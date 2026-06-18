import { _decorator, Component, Enum, instantiate, Node, Prefab, resources, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { BubblePearl } from './BubblePearl';
import {
  DEFAULT_ALLOWED_PEARL_COLORS,
  getPearlColorName,
  getPearlSpriteAssetName,
  normalizePearlColors,
  PearlColor,
  pickRandomPearlColor,
} from './PearlColorSystem';

const { ccclass, property } = _decorator;

export interface BubblePearlCell {
  row: number;
  col: number;
  color: PearlColor;
  node: Node;
}

export interface BubblePearlGridPosition {
  row: number;
  col: number;
}

export interface BubblePearlMatchResult {
  matched: boolean;
  color: PearlColor | null;
  groupSize: number;
  removedCount: number;
  floatingRemovedCount: number;
}

@ccclass('BubblePearlBoardPreview')
export class BubblePearlBoardPreview extends Component {
  public static readonly DEFAULT_PEARL_SIZE = 160;
  public static readonly DEFAULT_HORIZONTAL_SPACING = 166;
  public static readonly DEFAULT_VERTICAL_SPACING = 144;

  @property(Prefab)
  public pearlPrefab: Prefab | null = null;

  @property(Node)
  public pearlParent: Node | null = null;

  @property
  public pearlSize = BubblePearlBoardPreview.DEFAULT_PEARL_SIZE;

  @property
  public horizontalSpacing = BubblePearlBoardPreview.DEFAULT_HORIZONTAL_SPACING;

  @property
  public verticalSpacing = BubblePearlBoardPreview.DEFAULT_VERTICAL_SPACING;

  @property
  public maxColumns = 6;

  @property
  public maxRows = 12;

  @property({ type: [Enum(PearlColor)] })
  public allowedColors: PearlColor[] = [...DEFAULT_ALLOWED_PEARL_COLORS];

  @property({ type: [Enum(PearlColor)] })
  public availablePearlColors: PearlColor[] = [];

  @property({ type: [SpriteFrame] })
  public availablePearlSprites: SpriteFrame[] = [];

  @property
  public removeFloatingAfterMatch = true;

  // Expensive grid traversal logs stay opt-in so gameplay checks do not spam the console.
  @property
  public debugLogging = false;

  private rowCounts = [6, 5, 6, 5];
  private readonly occupiedCells = new Map<string, BubblePearlCell>();
  private readonly pearlSpriteFrames = new Map<PearlColor, SpriteFrame>();
  private readonly loadingPearlSprites = new Set<PearlColor>();
  private readonly pendingSpriteFrameCallbacks = new Map<PearlColor, Array<(spriteFrame: SpriteFrame) => void>>();
  private readonly matchRemoveDuration = 0.22;
  private readonly floatingRemoveDuration = 0.28;

  protected onLoad(): void {
    this.registerInspectorPearlSprites();
    this.preloadAllowedPearlSprites();
    this.createPreviewBoard();
  }

  public configureStage(rowCount: number, columnCount: number, allowedColors: PearlColor[], targetPearlCount?: number): void {
    this.maxColumns = Math.max(1, columnCount);
    this.maxRows = Math.max(1, rowCount + 8);
    this.allowedColors = normalizePearlColors(allowedColors);
    this.rowCounts = this.createRowCounts(rowCount, this.maxColumns, targetPearlCount);
    this.preloadAllowedPearlSprites();
    this.createPreviewBoard();

    console.log('[PearlBoardPreview] configured stage board', {
      rowCount,
      columnCount: this.maxColumns,
      targetPearlCount: targetPearlCount ?? null,
      rowCounts: this.rowCounts,
      spawnedPearls: this.getPearlCount(),
      allowedColors: this.getAllowedColorNames(),
    });
  }

  public createPreviewBoard(): void {
    if (!this.pearlPrefab || !this.pearlParent) {
      console.warn('[PearlBoardPreview] pearlPrefab or pearlParent is not assigned.');
      return;
    }

    this.pearlParent.removeAllChildren();
    this.occupiedCells.clear();
    this.debugLog('[PearlBoardPreview] allowedColors:', this.getAllowedColorNames());

    this.rowCounts.forEach((count, rowIndex) => {
      for (let column = 0; column < count; column += 1) {
        const color = pickRandomPearlColor(this.getAllowedColors());
        const pearl = instantiate(this.pearlPrefab) as unknown as Node;
        pearl.name = `Pearl_r${rowIndex}_c${column}`;
        pearl.setParent(this.pearlParent);
        this.preparePearlNode(pearl);
        this.placePearlAtGrid(pearl, rowIndex, column, color);
        this.debugLog('[PearlBoardPreview] spawn board pearl', {
          row: rowIndex,
          col: column,
          color: getPearlColorName(color),
        });
      }
    });

    this.debugLog('[PearlBoardPreview] pearlParent child count:', this.pearlParent.children.length);
    this.debugLog('[PearlBoardPreview] board data initialized:', this.occupiedCells.size);
  }

  public createShootingPearl(parent: Node, startLocalPosition: Vec3, color: PearlColor): Node | null {
    if (!this.pearlPrefab) {
      console.warn('[PearlBoardPreview] pearlPrefab is not assigned.');
      return null;
    }

    const pearl = instantiate(this.pearlPrefab) as unknown as Node;
    pearl.name = 'ShootingPearl';
    pearl.setParent(parent);
    pearl.setPosition(startLocalPosition);
    this.preparePearlNode(pearl);
    this.applyPearlColor(pearl, color);
    console.log('[PearlBoardPreview] create shooting pearl', { color: getPearlColorName(color) });
    return pearl;
  }

  public attachPearlFromWorld(pearl: Node, worldPosition: Vec3): BubblePearlGridPosition | null {
    if (!this.pearlParent) {
      console.warn('[PearlBoardPreview] pearlParent is not assigned.');
      return null;
    }

    const localPosition = this.worldToBoardLocal(worldPosition);
    const grid = this.localToNearestAvailableGrid(localPosition);
    const color = this.getPearlColor(pearl) ?? pickRandomPearlColor(this.getAllowedColors());
    pearl.setParent(this.pearlParent);
    this.preparePearlNode(pearl);
    this.placePearlAtGrid(pearl, grid.row, grid.col, color);

    console.log('[PearlBoardPreview] pearl snapped to grid', {
      row: grid.row,
      col: grid.col,
      color: getPearlColorName(color),
      totalPearls: this.occupiedCells.size,
    });

    return grid;
  }

  public gridToLocal(row: number, col: number): Vec3 {
    const startX = this.getStartX();
    const startY = this.getStartY();
    const rowOffsetX = this.isOffsetRow(row) ? this.horizontalSpacing / 2 : 0;
    return new Vec3(startX + rowOffsetX + col * this.horizontalSpacing, startY - row * this.verticalSpacing, 0);
  }

  public localToNearestGrid(position: Vec3): BubblePearlGridPosition {
    const roughRow = Math.round((this.getStartY() - position.y) / this.verticalSpacing);
    const row = this.clampRow(roughRow);
    const col = this.clampColumn(row, Math.round((position.x - this.getStartX() - this.getRowOffsetX(row)) / this.horizontalSpacing));
    return { row, col };
  }

  public getPearlCells(): BubblePearlCell[] {
    return [...this.occupiedCells.values()].filter((cell) => cell.node?.isValid);
  }

  public getPearlWorldPositions(): Array<BubblePearlGridPosition & { color: PearlColor; worldPosition: Vec3; node: Node }> {
    return this.getPearlCells().map((cell) => ({
      row: cell.row,
      col: cell.col,
      color: cell.color,
      node: cell.node,
      worldPosition: this.boardLocalToWorld(this.gridToLocal(cell.row, cell.col)),
    }));
  }

  public getCollisionDistance(): number {
    return this.pearlSize * 0.92;
  }

  public getProjectileRadius(): number {
    return this.pearlSize / 2;
  }

  public getHorizontalBoundsWorld(): { left: number; right: number } {
    const radius = this.getProjectileRadius();
    const leftWorld = this.boardLocalToWorld(new Vec3(this.getStartX() - radius, 0, 0));
    const rightWorld = this.boardLocalToWorld(new Vec3(this.getStartX() + (this.maxColumns - 1) * this.horizontalSpacing + radius, 0, 0));
    return { left: leftWorld.x, right: rightWorld.x };
  }

  public getTopBoundaryWorldY(): number {
    return this.boardLocalToWorld(this.gridToLocal(0, 0)).y;
  }

  public getPearlCount(): number {
    return this.occupiedCells.size;
  }

  public hasPearls(): boolean {
    return this.getPearlCount() > 0;
  }

  public getNeighbors(row: number, col: number): BubblePearlGridPosition[] {
    const sideNeighbors = [
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    const diagonalNeighbors = this.isOffsetRow(row)
      ? [
          { row: row - 1, col },
          { row: row - 1, col: col + 1 },
          { row: row + 1, col },
          { row: row + 1, col: col + 1 },
        ]
      : [
          { row: row - 1, col: col - 1 },
          { row: row - 1, col },
          { row: row + 1, col: col - 1 },
          { row: row + 1, col },
        ];

    const neighbors = [...sideNeighbors, ...diagonalNeighbors].filter((cell) => this.isValidGrid(cell.row, cell.col));
    this.debugLog('[PearlBoardPreview] neighbors checked', {
      row,
      col,
      neighbors,
    });
    return neighbors;
  }

  public checkMatch(row: number, col: number): BubblePearlMatchResult {
    const startCell = this.getCell(row, col);
    if (!startCell) {
      console.warn('[PearlBoardPreview] checkMatch skipped: no cell at grid', { row, col });
      return { matched: false, color: null, groupSize: 0, removedCount: 0, floatingRemovedCount: 0 };
    }

    const sameColorGroup = this.findSameColorGroup(row, col, startCell.color);
    const matched = sameColorGroup.length >= 3;

    this.debugLog('[PearlBoardPreview] checkMatch result', {
      row,
      col,
      color: getPearlColorName(startCell.color),
      groupSize: sameColorGroup.length,
      matched,
    });

    if (!matched) {
      return {
        matched: false,
        color: startCell.color,
        groupSize: sameColorGroup.length,
        removedCount: 0,
        floatingRemovedCount: 0,
      };
    }

    const removedCount = this.removeCells(sameColorGroup, 'match');
    const floatingRemovedCount = this.removeFloatingAfterMatch ? this.removeFloatingPearls() : 0;

    console.log('[PearlBoardPreview] match removed', {
      color: getPearlColorName(startCell.color),
      removedCount,
      floatingRemovedCount,
      boardPearls: this.getPearlCount(),
    });

    return {
      matched: true,
      color: startCell.color,
      groupSize: sameColorGroup.length,
      removedCount,
      floatingRemovedCount,
    };
  }

  public removeFloatingPearls(): number {
    const connectedKeys = new Set<string>();
    const queue: BubblePearlCell[] = [];

    for (const cell of this.getPearlCells()) {
      if (cell.row === 0) {
        connectedKeys.add(this.getCellKey(cell.row, cell.col));
        queue.push(cell);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      for (const neighborPosition of this.getNeighbors(current.row, current.col)) {
        const neighborKey = this.getCellKey(neighborPosition.row, neighborPosition.col);
        if (connectedKeys.has(neighborKey)) {
          continue;
        }

        const neighbor = this.occupiedCells.get(neighborKey);
        if (!neighbor) {
          continue;
        }

        connectedKeys.add(neighborKey);
        queue.push(neighbor);
      }
    }

    const floatingCells = this.getPearlCells().filter((cell) => !connectedKeys.has(this.getCellKey(cell.row, cell.col)));
    if (floatingCells.length === 0) {
      console.log('[PearlBoardPreview] removeFloatingPearls: no floating pearls');
      return 0;
    }

    const removedCount = this.removeCells(floatingCells, 'floating');
    console.log('[PearlBoardPreview] removeFloatingPearls removed', {
      removedCount,
      boardPearls: this.getPearlCount(),
    });
    return removedCount;
  }

  public getAvailableColorsFromBoard(): PearlColor[] {
    const colors = this.getPearlCells().map((cell) => cell.color);
    return [...new Set(colors)];
  }

  public getAllowedColors(): PearlColor[] {
    return normalizePearlColors(this.allowedColors);
  }

  public getAllowedColorNames(): string[] {
    return this.getAllowedColors().map((color) => getPearlColorName(color));
  }

  public pickLauncherPearlColor(): PearlColor {
    const boardColors = this.getAvailableColorsFromBoard();
    return pickRandomPearlColor(boardColors.length > 0 ? boardColors : this.getAllowedColors());
  }

  public getSpriteFrameForColor(color: PearlColor): SpriteFrame | null {
    return this.pearlSpriteFrames.get(color) ?? null;
  }

  public requestSpriteFrameForColor(color: PearlColor, onLoaded: (spriteFrame: SpriteFrame) => void): void {
    const existingSpriteFrame = this.getSpriteFrameForColor(color);
    if (existingSpriteFrame) {
      onLoaded(existingSpriteFrame);
      return;
    }

    this.loadPearlSpriteFrame(color, onLoaded);
  }

  public applyPearlColor(pearl: Node, color: PearlColor, row = -1, col = -1): void {
    const pearlData = pearl.getComponent(BubblePearl) ?? pearl.addComponent(BubblePearl);
    pearlData.setData(color, row, col);

    const sprite = pearl.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    const spriteFrame = this.getSpriteFrameForColor(color);
    if (spriteFrame) {
      sprite.spriteFrame = spriteFrame;
      return;
    }

    this.requestSpriteFrameForColor(color, (loadedSpriteFrame) => {
      if (!pearl.isValid) {
        return;
      }

      sprite.spriteFrame = loadedSpriteFrame;
    });
  }

  public getPearlColor(pearl: Node): PearlColor | null {
    return pearl.getComponent(BubblePearl)?.color ?? null;
  }

  private placePearlAtGrid(pearl: Node, row: number, col: number, color: PearlColor): void {
    const key = this.getCellKey(row, col);
    const previous = this.occupiedCells.get(key);
    if (previous?.node && previous.node !== pearl && previous.node.isValid) {
      previous.node.destroy();
    }

    pearl.name = `Pearl_r${row}_c${col}`;
    pearl.setPosition(this.gridToLocal(row, col));
    this.applyPearlColor(pearl, color, row, col);
    this.occupiedCells.set(key, { row, col, color, node: pearl });
  }

  private preparePearlNode(pearl: Node): void {
    const transform = pearl.getComponent(UITransform) ?? pearl.addComponent(UITransform);
    transform.setContentSize(this.pearlSize, this.pearlSize);
    pearl.setScale(1, 1, 1);
    const opacity = pearl.getComponent(UIOpacity);
    if (opacity) {
      opacity.opacity = 255;
    }
  }

  private localToNearestAvailableGrid(position: Vec3): BubblePearlGridPosition {
    const nearest = this.localToNearestGrid(position);
    if (!this.isOccupied(nearest.row, nearest.col)) {
      return nearest;
    }

    const candidates: BubblePearlGridPosition[] = [];
    for (let row = Math.max(0, nearest.row - 2); row <= Math.min(this.maxRows - 1, nearest.row + 2); row += 1) {
      for (let col = 0; col < this.getColumnCount(row); col += 1) {
        if (!this.isOccupied(row, col) && this.canAttachAt(row, col)) {
          candidates.push({ row, col });
        }
      }
    }

    if (candidates.length === 0) {
      for (let row = 0; row < this.maxRows; row += 1) {
        for (let col = 0; col < this.getColumnCount(row); col += 1) {
          if (!this.isOccupied(row, col) && this.canAttachAt(row, col)) {
            candidates.push({ row, col });
          }
        }
      }
    }

    if (candidates.length === 0) {
      return nearest;
    }

    candidates.sort((a, b) => {
      const distanceA = Vec3.squaredDistance(position, this.gridToLocal(a.row, a.col));
      const distanceB = Vec3.squaredDistance(position, this.gridToLocal(b.row, b.col));
      return distanceA - distanceB;
    });

    return candidates[0];
  }

  private canAttachAt(row: number, col: number): boolean {
    if (row === 0) {
      return true;
    }

    return this.getNeighbors(row, col).some((neighbor) => this.isOccupied(neighbor.row, neighbor.col));
  }

  private boardLocalToWorld(position: Vec3): Vec3 {
    const transform = this.pearlParent?.getComponent(UITransform);
    return transform ? transform.convertToWorldSpaceAR(position) : position.clone();
  }

  private worldToBoardLocal(position: Vec3): Vec3 {
    const transform = this.pearlParent?.getComponent(UITransform);
    return transform ? transform.convertToNodeSpaceAR(position) : position.clone();
  }

  private getStartX(): number {
    return -((this.maxColumns - 1) * this.horizontalSpacing) / 2;
  }

  private getStartY(): number {
    return ((this.rowCounts.length - 1) * this.verticalSpacing) / 2;
  }

  private getRowOffsetX(row: number): number {
    return this.isOffsetRow(row) ? this.horizontalSpacing / 2 : 0;
  }

  private getColumnCount(row: number): number {
    return this.isOffsetRow(row) ? this.maxColumns - 1 : this.maxColumns;
  }

  private isOffsetRow(row: number): boolean {
    return row % 2 === 1;
  }

  private isValidGrid(row: number, col: number): boolean {
    return row >= 0 && row < this.maxRows && col >= 0 && col < this.getColumnCount(row);
  }

  private clampRow(row: number): number {
    return Math.max(0, Math.min(this.maxRows - 1, row));
  }

  private clampColumn(row: number, col: number): number {
    return Math.max(0, Math.min(this.getColumnCount(row) - 1, col));
  }

  private isOccupied(row: number, col: number): boolean {
    return this.occupiedCells.has(this.getCellKey(row, col));
  }

  private getCell(row: number, col: number): BubblePearlCell | null {
    return this.occupiedCells.get(this.getCellKey(row, col)) ?? null;
  }

  private findSameColorGroup(row: number, col: number, color: PearlColor): BubblePearlCell[] {
    const visitedKeys = new Set<string>();
    const group: BubblePearlCell[] = [];
    const queue: BubblePearlGridPosition[] = [{ row, col }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const currentKey = this.getCellKey(current.row, current.col);
      if (visitedKeys.has(currentKey)) {
        continue;
      }

      visitedKeys.add(currentKey);
      const currentCell = this.occupiedCells.get(currentKey);
      if (!currentCell || currentCell.color !== color) {
        continue;
      }

      group.push(currentCell);

      for (const neighbor of this.getNeighbors(current.row, current.col)) {
        const neighborKey = this.getCellKey(neighbor.row, neighbor.col);
        if (!visitedKeys.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    this.debugLog('[PearlBoardPreview] same color group found', {
      row,
      col,
      color: getPearlColorName(color),
      cells: group.map((cell) => ({ row: cell.row, col: cell.col })),
      groupSize: group.length,
    });

    return group;
  }

  private removeCells(cells: BubblePearlCell[], reason: 'match' | 'floating'): number {
    let removedCount = 0;

    for (const cell of cells) {
      const key = this.getCellKey(cell.row, cell.col);
      const currentCell = this.occupiedCells.get(key);
      if (!currentCell) {
        continue;
      }

      this.occupiedCells.delete(key);
      if (currentCell.node?.isValid) {
        this.playPearlRemoveAnimation(currentCell.node, reason);
      }

      removedCount += 1;
      this.debugLog('[PearlBoardPreview] pearl removed', {
        reason,
        row: currentCell.row,
        col: currentCell.col,
        color: getPearlColorName(currentCell.color),
      });
    }

    return removedCount;
  }

  private playPearlRemoveAnimation(pearl: Node, reason: 'match' | 'floating'): void {
    const opacity = pearl.getComponent(UIOpacity) ?? pearl.addComponent(UIOpacity);
    opacity.opacity = 255;

    if (reason === 'match') {
      pearl.setScale(1, 1, 1);
      tween(opacity).to(this.matchRemoveDuration, { opacity: 0 }).start();
      tween(pearl)
        .to(0.08, { scale: new Vec3(1.16, 1.16, 1) })
        .to(this.matchRemoveDuration - 0.08, { scale: new Vec3(0.72, 0.72, 1) })
        .call(() => {
          if (pearl.isValid) {
            pearl.destroy();
          }
        })
        .start();
      return;
    }

    const targetPosition = pearl.position.clone();
    targetPosition.y -= this.verticalSpacing * 1.8;
    tween(opacity).to(this.floatingRemoveDuration, { opacity: 0 }).start();
    tween(pearl)
      .to(this.floatingRemoveDuration, {
        position: targetPosition,
        scale: new Vec3(0.72, 0.72, 1),
      })
      .call(() => {
        if (pearl.isValid) {
          pearl.destroy();
        }
      })
      .start();
  }

  private getCellKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private createRowCounts(rowCount: number, columnCount: number, targetPearlCount?: number): number[] {
    const resolvedRowCount = Math.max(1, rowCount);
    const resolvedColumnCount = Math.max(1, columnCount);
    const rowCounts: number[] = [];
    let remainingPearls = Math.max(0, targetPearlCount ?? Number.POSITIVE_INFINITY);

    for (let rowIndex = 0; rowIndex < resolvedRowCount; rowIndex += 1) {
      const rowCapacity = this.isOffsetRow(rowIndex) ? Math.max(1, resolvedColumnCount - 1) : resolvedColumnCount;
      const pearlCount = Math.min(rowCapacity, remainingPearls);

      if (pearlCount <= 0) {
        break;
      }

      rowCounts.push(pearlCount);
      remainingPearls -= pearlCount;
    }

    return rowCounts.length > 0 ? rowCounts : [resolvedColumnCount];
  }

  private registerInspectorPearlSprites(): void {
    this.pearlSpriteFrames.clear();
    const pairCount = Math.min(this.availablePearlColors.length, this.availablePearlSprites.length);

    for (let index = 0; index < pairCount; index += 1) {
      const color = this.availablePearlColors[index];
      const spriteFrame = this.availablePearlSprites[index];
      if (spriteFrame) {
        this.pearlSpriteFrames.set(color, spriteFrame);
      }
    }

    console.log('[PearlBoardPreview] inspector SpriteFrames assigned:', {
      colorCount: this.availablePearlColors.length,
      spriteFrameCount: this.availablePearlSprites.filter(Boolean).length,
      registeredCount: this.pearlSpriteFrames.size,
    });
  }

  private preloadAllowedPearlSprites(): void {
    for (const color of this.getAllowedColors()) {
      this.loadPearlSpriteFrame(color);
    }
  }

  private loadPearlSpriteFrame(color: PearlColor, onLoaded?: (spriteFrame: SpriteFrame) => void): void {
    const existingSpriteFrame = this.getSpriteFrameForColor(color);
    if (existingSpriteFrame) {
      onLoaded?.(existingSpriteFrame);
      return;
    }

    if (this.loadingPearlSprites.has(color)) {
      if (onLoaded) {
        const callbacks = this.pendingSpriteFrameCallbacks.get(color) ?? [];
        callbacks.push(onLoaded);
        this.pendingSpriteFrameCallbacks.set(color, callbacks);
      }
      return;
    }

    this.loadingPearlSprites.add(color);
    if (onLoaded) {
      this.pendingSpriteFrameCallbacks.set(color, [onLoaded]);
    }
    const assetName = getPearlSpriteAssetName(color);
    const resourcePath = `bubble-shooter/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      this.loadingPearlSprites.delete(color);

      if (error || !spriteFrame) {
        this.pendingSpriteFrameCallbacks.delete(color);
        console.error('[PearlBoardPreview] SpriteFrame not found for pearl color', {
          color: getPearlColorName(color),
          resourcePath,
          error,
        });
        return;
      }

      this.pearlSpriteFrames.set(color, spriteFrame);
      const callbacks = this.pendingSpriteFrameCallbacks.get(color) ?? [];
      this.pendingSpriteFrameCallbacks.delete(color);
      callbacks.forEach((callback) => callback(spriteFrame));
      this.refreshExistingPearlsWithColor(color);
      console.log('[PearlBoardPreview] SpriteFrame loaded for pearl color', {
        color: getPearlColorName(color),
        resourcePath,
      });
    });
  }

  private debugLog(message: string, ...args: unknown[]): void {
    if (!this.debugLogging) {
      return;
    }

    console.log(message, ...args);
  }

  private refreshExistingPearlsWithColor(color: PearlColor): void {
    const spriteFrame = this.getSpriteFrameForColor(color);
    if (!spriteFrame) {
      return;
    }

    for (const cell of this.getPearlCells()) {
      if (cell.color !== color) {
        continue;
      }

      const sprite = cell.node.getComponent(Sprite);
      if (sprite) {
        sprite.spriteFrame = spriteFrame;
      }
    }
  }
}
