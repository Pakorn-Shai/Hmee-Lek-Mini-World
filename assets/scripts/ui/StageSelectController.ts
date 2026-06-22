import { _decorator, Button, Color, Component, Graphics, Label, Layers, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { BubbleStageSelection, getBubbleStageConfig } from '../data/BubbleStageData';
import { SceneRouter } from '../core/SceneRouter';
import { SaveManager } from '../core/SaveManager';

const { ccclass } = _decorator;

const ECONOMY_HUD_Y = 1320;
const HEART_HUD_X = -430;
const COIN_HUD_X = 430;

type StageVisualState = 'comingSoon' | 'locked' | 'unlocked' | 'cleared';

@ccclass('StageSelectController')
export class StageSelectController extends Component {
  private heartLabel?: Label;
  private coinLabel?: Label;
  private heartShadowLabel?: Label;
  private coinShadowLabel?: Label;
  private heartWarningNode?: Node;
  private heartWarningLabel?: Label;
  private hasLoaded = false;
  private unlockedStageSpriteFrame?: SpriteFrame;
  private lockedStageSpriteFrame?: SpriteFrame;

  protected onLoad(): void {
    this.setupEconomyLabels();
    this.setupHeartWarning();
    this.bindBackButton();
    this.cacheStageButtonSpriteFrames();
    this.hasLoaded = true;
    this.refreshStageSelectState();
  }

  protected onEnable(): void {
    if (!this.hasLoaded) {
      return;
    }

    this.refreshStageSelectState();
  }

  public openStage1(): void {
    this.openStage(1);
  }

  public openStage(stageId: number): void {
    const progress = SaveManager.getData().minigames.bubbleShooter;
    const stageConfig = getBubbleStageConfig(stageId);
    if (!stageConfig || stageId > progress.unlockedStage) {
      console.log('[StageSelectController] Stage locked or missing config.', {
        stageId,
        unlockedStage: progress.unlockedStage,
        hasStageConfig: stageConfig !== undefined,
      });
      return;
    }

    if (!SaveManager.canPlayStage()) {
      this.refreshEconomyLabels();
      this.showHeartWarning();
      console.warn('[StageSelectController] Cannot play stage: no hearts left.');
      return;
    }

    BubbleStageSelection.selectedStage = stageId;
    console.log(`[StageSelectController] Stage ${stageId} clicked. Loading BubbleShooter.`);
    SceneRouter.loadBubbleShooter();
  }

  public backToMainMenu(): void {
    console.log('[StageSelectController] Back clicked. Loading MainMenu.');
    SceneRouter.loadMainMenu();
  }

  // DEBUG TOOL: Temporary progress reset hook for editor buttons. Remove before release.
  public debugResetProgress(): void {
    SaveManager.reset();
    console.log('[StageSelectController] Debug reset progress. Reloading StageSelect.');
    SceneRouter.loadStageSelect();
  }

  private refreshStageSelectState(): void {
    this.refreshEconomyLabels();
    this.bindStageButtons();
  }

  private bindStageButtons(): void {
    const progress = SaveManager.regenerateHearts().minigames.bubbleShooter;

    for (let stageId = 1; stageId <= 10; stageId += 1) {
      const stageNodeName = `Stage${this.formatStageNumber(stageId)}`;
      const stageNode = this.findNodeByName(this.node, stageNodeName);
      if (!stageNode) {
        console.warn(`[StageSelectController] ${stageNodeName} node not found.`);
        continue;
      }

      const button = stageNode.getComponent(Button) ?? stageNode.addComponent(Button);
      const stageConfig = getBubbleStageConfig(stageId);
      const hasStageConfig = stageConfig !== undefined;
      const stageKey = String(stageId);
      const stars = this.normalizeStarCount(progress.stars[stageKey] ?? 0);
      const isCleared = progress.cleared[stageKey] === true;
      const isUnlocked = hasStageConfig && (stageId <= progress.unlockedStage || isCleared);
      const visualState = this.getStageVisualState(hasStageConfig, isUnlocked, isCleared);

      stageNode.targetOff(this);
      button.interactable = isUnlocked;
      this.updateStageProgressLabel(stageNode, visualState, stars);
      this.updateStageVisualState(stageNode, visualState, stars);

      if (isUnlocked) {
        stageNode.on(Button.EventType.CLICK, () => this.openStage(stageId), this);
      }

      console.log('[StageSelectController] stage state', {
        stageId,
        unlocked: isUnlocked,
        cleared: isCleared,
        stars,
        unlockedStage: progress.unlockedStage,
      });
    }
  }

  private getStageVisualState(hasStageConfig: boolean, isUnlocked: boolean, isCleared: boolean): StageVisualState {
    if (!hasStageConfig) {
      return 'comingSoon';
    }

    if (!isUnlocked) {
      return 'locked';
    }

    return isCleared ? 'cleared' : 'unlocked';
  }

  private updateStageProgressLabel(stageNode: Node, visualState: StageVisualState, stars: number): void {
    let labelNode = stageNode.getChildByName('ProgressLabel');
    if (!labelNode) {
      labelNode = new Node('ProgressLabel');
      labelNode.setParent(stageNode);
      labelNode.setPosition(0, -78);
    }

    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(220, 48);

    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.fontSize = 24;
    label.lineHeight = 30;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;

    if (visualState === 'comingSoon') {
      label.string = 'เร็ว ๆ นี้';
      label.color = new Color(255, 255, 255, 150);
      return;
    }

    if (visualState === 'locked') {
      label.string = 'ล็อก';
      label.color = new Color(255, 255, 255, 165);
      return;
    }

    label.string = visualState === 'cleared' ? `${this.formatStars(stars)} ผ่านแล้ว` : 'เปิดแล้ว';
    label.color = visualState === 'cleared' ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 210);
  }

  private updateStageVisualState(stageNode: Node, visualState: StageVisualState, stars: number): void {
    const isLocked = visualState === 'locked' || visualState === 'comingSoon';
    const isCleared = visualState === 'cleared';

    this.updateStageSpriteFrame(stageNode, visualState);
    this.setNamedVisualsActive(stageNode, ['LockIcon', 'LockedIcon', 'Lock', 'LockNode', 'LockLabel'], isLocked);
    this.setNamedVisualsActive(stageNode, ['ClearedIcon', 'ClearedBadge', 'ClearedLabel', 'ClearIcon'], isCleared);
    this.updateStageMainLabel(stageNode, visualState);
    this.updateStageStarNodes(stageNode, isCleared, stars);
    this.updateStageSpriteColor(stageNode, visualState);
  }

  private cacheStageButtonSpriteFrames(): void {
    const unlockedStageNode = this.findNodeByName(this.node, 'Stage01');
    const lockedStageNode = this.findNodeByName(this.node, 'Stage02');

    this.unlockedStageSpriteFrame = unlockedStageNode?.getComponent(Sprite)?.spriteFrame ?? undefined;
    this.lockedStageSpriteFrame = lockedStageNode?.getComponent(Sprite)?.spriteFrame ?? undefined;

    if (!this.unlockedStageSpriteFrame) {
      console.warn('[StageSelectController] Unlocked stage sprite frame not found.');
    }

    if (!this.lockedStageSpriteFrame) {
      console.warn('[StageSelectController] Locked stage sprite frame not found.');
    }
  }

  private updateStageSpriteFrame(stageNode: Node, visualState: StageVisualState): void {
    const sprite = stageNode.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    const nextSpriteFrame =
      visualState === 'locked' || visualState === 'comingSoon'
        ? this.lockedStageSpriteFrame
        : this.unlockedStageSpriteFrame;

    if (nextSpriteFrame) {
      sprite.spriteFrame = nextSpriteFrame;
    }
  }

  private updateStageMainLabel(stageNode: Node, visualState: StageVisualState): void {
    const label = stageNode.getChildByName('Label')?.getComponent(Label);
    if (!label) {
      return;
    }

    if (visualState === 'locked' || visualState === 'comingSoon') {
      label.color = new Color(255, 255, 255, 150);
      return;
    }

    label.color = visualState === 'cleared' ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 255);
  }

  private updateStageStarNodes(stageNode: Node, isCleared: boolean, stars: number): void {
    for (let index = 1; index <= 3; index += 1) {
      const starNode = this.findFirstExistingNode(stageNode, [`Star${index}`, `Star0${index}`]);
      if (!starNode) {
        continue;
      }

      starNode.active = isCleared;
      const starLabel = starNode.getComponent(Label) ?? starNode.getChildByName('Label')?.getComponent(Label);
      if (starLabel) {
        starLabel.string = index <= stars ? '★' : '☆';
        starLabel.color = index <= stars ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 150);
      }
    }
  }

  private updateStageSpriteColor(stageNode: Node, visualState: StageVisualState): void {
    const sprite = stageNode.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    if (visualState === 'locked' || visualState === 'comingSoon') {
      sprite.color = new Color(130, 142, 156, 210);
      return;
    }

    sprite.color = visualState === 'cleared' ? new Color(255, 246, 186, 255) : new Color(255, 255, 255, 255);
  }

  private setNamedVisualsActive(root: Node, nodeNames: string[], isActive: boolean): void {
    for (const nodeName of nodeNames) {
      const visualNode = this.findNodeByName(root, nodeName);
      if (visualNode && visualNode !== root) {
        visualNode.active = isActive;
      }
    }
  }

  private findFirstExistingNode(root: Node, nodeNames: string[]): Node | null {
    for (const nodeName of nodeNames) {
      const foundNode = this.findNodeByName(root, nodeName);
      if (foundNode) {
        return foundNode;
      }
    }

    return null;
  }

  private normalizeStarCount(stars: number): number {
    return Math.max(0, Math.min(Math.floor(stars), 3));
  }

  private setupEconomyLabels(): void {
    this.heartLabel = this.findNodeByName(this.node, 'HeartLabel')?.getComponent(Label) ?? undefined;
    this.coinLabel = this.findNodeByName(this.node, 'CoinLabel')?.getComponent(Label) ?? undefined;

    if (!this.heartLabel) {
      this.heartLabel = this.createEconomyLabel('HeartLabel', HEART_HUD_X, ECONOMY_HUD_Y);
    }

    if (!this.coinLabel) {
      this.coinLabel = this.createEconomyLabel('CoinLabel', COIN_HUD_X, ECONOMY_HUD_Y);
    }

    this.positionEconomyLabel(this.heartLabel, HEART_HUD_X, ECONOMY_HUD_Y);
    this.positionEconomyLabel(this.coinLabel, COIN_HUD_X, ECONOMY_HUD_Y);
    this.heartShadowLabel = this.ensureEconomyLabelShadow(this.heartLabel);
    this.coinShadowLabel = this.ensureEconomyLabelShadow(this.coinLabel);
  }

  private refreshEconomyLabels(): void {
    const saveData = SaveManager.regenerateHearts();
    if (this.heartLabel) {
      this.heartLabel.string = `x${saveData.player.hearts}`;
    }
    if (this.heartShadowLabel) {
      this.heartShadowLabel.string = `x${saveData.player.hearts}`;
    }
    if (this.coinLabel) {
      this.coinLabel.string = `${saveData.player.coins}`;
    }
    if (this.coinShadowLabel) {
      this.coinShadowLabel.string = `${saveData.player.coins}`;
    }
  }

  private createEconomyLabel(nodeName: string, x: number, y: number): Label {
    const badgeNode = new Node(`${nodeName}Badge`);
    badgeNode.layer = Layers.Enum.UI_2D;
    badgeNode.setParent(this.node);
    badgeNode.setPosition(x, y);
    const badgeTransform = badgeNode.addComponent(UITransform);
    badgeTransform.setContentSize(330, 104);
    this.decorateEconomyBadge(badgeNode);

    this.createEconomyIcon(nodeName, badgeNode);

    const shadowNode = new Node(`${nodeName}ShadowLabel`);
    shadowNode.layer = Layers.Enum.UI_2D;
    shadowNode.setParent(badgeNode);
    shadowNode.setPosition(58, -5);

    const shadowTransform = shadowNode.addComponent(UITransform);
    shadowTransform.setContentSize(190, 82);

    const shadowLabel = shadowNode.addComponent(Label);
    shadowLabel.fontSize = 44;
    shadowLabel.lineHeight = 54;
    shadowLabel.color = new Color(13, 52, 78, 195);
    shadowLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    shadowLabel.verticalAlign = Label.VerticalAlign.CENTER;

    const labelNode = new Node(nodeName);
    labelNode.layer = Layers.Enum.UI_2D;
    labelNode.setParent(badgeNode);
    labelNode.setPosition(58, 0);

    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(190, 82);

    const label = labelNode.addComponent(Label);
    label.fontSize = 44;
    label.lineHeight = 54;
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    return label;
  }

  private positionEconomyLabel(label: Label | undefined, x: number, y: number): void {
    if (!label) {
      return;
    }

    const container = label.node.parent && label.node.parent !== this.node ? label.node.parent : label.node;
    container.setPosition(x, y);
    const containerTransform = container.getComponent(UITransform) ?? container.addComponent(UITransform);
    containerTransform.setContentSize(330, 104);
    this.decorateEconomyBadge(container);

    const labelTransform = label.node.getComponent(UITransform) ?? label.node.addComponent(UITransform);
    labelTransform.setContentSize(190, 82);
    label.fontSize = 44;
    label.lineHeight = 54;
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;

    if (container !== label.node) {
      label.node.setPosition(58, 0);
      const iconNode = container.getChildByName(`${label.node.name}Icon`);
      if (iconNode) {
        iconNode.setPosition(-94, 0);
        const iconTransform = iconNode.getComponent(UITransform) ?? iconNode.addComponent(UITransform);
        iconTransform.setContentSize(82, 82);
      }
    }

    if (container.parent) {
      container.setSiblingIndex(Math.max(0, container.parent.children.length - 1));
    }
  }

  private ensureEconomyLabelShadow(label: Label | undefined): Label | undefined {
    if (!label) {
      return undefined;
    }

    const container = label.node.parent && label.node.parent !== this.node ? label.node.parent : label.node;
    let shadowNode = container.getChildByName(`${label.node.name}ShadowLabel`);
    if (!shadowNode) {
      shadowNode = new Node(`${label.node.name}ShadowLabel`);
      shadowNode.layer = Layers.Enum.UI_2D;
      shadowNode.setParent(container);
    }

    shadowNode.setPosition(58, -5);
    const shadowTransform = shadowNode.getComponent(UITransform) ?? shadowNode.addComponent(UITransform);
    shadowTransform.setContentSize(190, 82);

    const shadowLabel = shadowNode.getComponent(Label) ?? shadowNode.addComponent(Label);
    shadowLabel.string = label.string;
    shadowLabel.fontSize = 44;
    shadowLabel.lineHeight = 54;
    shadowLabel.color = new Color(13, 52, 78, 195);
    shadowLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    shadowLabel.verticalAlign = Label.VerticalAlign.CENTER;

    shadowNode.setSiblingIndex(Math.max(0, label.node.getSiblingIndex()));
    label.node.setSiblingIndex(container.children.length - 1);
    return shadowLabel;
  }

  private createEconomyIcon(nodeName: string, parent: Node): void {
    const iconNode = new Node(`${nodeName}Icon`);
    iconNode.layer = Layers.Enum.UI_2D;
    iconNode.setParent(parent);
    iconNode.setPosition(-94, 0);
    const transform = iconNode.addComponent(UITransform);
    transform.setContentSize(82, 82);

    const sprite = iconNode.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;

    const assetName = nodeName === 'HeartLabel' ? 'icon_heart' : 'icon_coin';
    this.loadCommonSpriteFrame(assetName, (spriteFrame) => {
      if (!iconNode.isValid) {
        return;
      }

      sprite.spriteFrame = spriteFrame;
    });
  }

  private setupHeartWarning(): void {
    this.heartWarningNode = this.findNodeByName(this.node, 'HeartWarningPanel') ?? undefined;
    this.heartWarningLabel = this.findNodeByName(this.node, 'HeartWarningLabel')?.getComponent(Label) ?? undefined;

    if (!this.heartWarningNode) {
      this.heartWarningNode = new Node('HeartWarningPanel');
      this.heartWarningNode.layer = Layers.Enum.UI_2D;
      this.heartWarningNode.setParent(this.node);
      this.heartWarningNode.setPosition(0, 130);

      const panelTransform = this.heartWarningNode.addComponent(UITransform);
      panelTransform.setContentSize(620, 210);

      const panelSprite = this.heartWarningNode.addComponent(Sprite);
      panelSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      panelSprite.type = Sprite.Type.SIMPLE;
      this.loadCommonSpriteFrame('popup_small_panel', (spriteFrame) => {
        if (!this.heartWarningNode?.isValid) {
          return;
        }

        panelSprite.spriteFrame = spriteFrame;
      });
    }

    if (!this.heartWarningLabel) {
      const labelNode = new Node('HeartWarningLabel');
      labelNode.layer = Layers.Enum.UI_2D;
      labelNode.setParent(this.heartWarningNode);
      labelNode.setPosition(0, 0);

      const labelTransform = labelNode.addComponent(UITransform);
      labelTransform.setContentSize(560, 120);

      this.heartWarningLabel = labelNode.addComponent(Label);
      this.heartWarningLabel.fontSize = 38;
      this.heartWarningLabel.lineHeight = 48;
      this.heartWarningLabel.color = new Color(104, 73, 10, 255);
      this.heartWarningLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
      this.heartWarningLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    this.heartWarningLabel.string = 'หัวใจหมด รอฟื้นฟู';
    this.heartWarningNode.active = false;
  }

  private showHeartWarning(): void {
    if (!this.heartWarningNode) {
      return;
    }

    this.heartWarningNode.active = true;
    this.heartWarningNode.setSiblingIndex(this.node.children.length - 1);
    this.unschedule(this.hideHeartWarning);
    this.scheduleOnce(this.hideHeartWarning, 1.8);
  }

  private hideHeartWarning(): void {
    if (this.heartWarningNode) {
      this.heartWarningNode.active = false;
    }
  }

  private loadCommonSpriteFrame(assetName: string, onLoaded: (spriteFrame: SpriteFrame) => void): void {
    const resourcePath = `ui/common/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        console.warn(`[StageSelectController] SpriteFrame not found: ${resourcePath}`, error);
        return;
      }

      onLoaded(spriteFrame);
    });
  }

  private decorateEconomyBadge(node: Node): void {
    let shadow = node.getChildByName(`${node.name}Shadow`);
    if (!shadow) {
      shadow = new Node(`${node.name}Shadow`);
      shadow.layer = Layers.Enum.UI_2D;
      shadow.setParent(node);
    }
    shadow.setPosition(0, -7);
    const shadowTransform = shadow.getComponent(UITransform) ?? shadow.addComponent(UITransform);
    shadowTransform.setContentSize(330, 104);
    this.drawRoundedRect(shadow, 330, 104, new Color(8, 47, 79, 100), 46);
    shadow.setSiblingIndex(0);

    let fill = node.getChildByName(`${node.name}Fill`);
    if (!fill) {
      fill = new Node(`${node.name}Fill`);
      fill.layer = Layers.Enum.UI_2D;
      fill.setParent(node);
    }
    fill.setPosition(0, 0);
    const fillTransform = fill.getComponent(UITransform) ?? fill.addComponent(UITransform);
    fillTransform.setContentSize(330, 104);
    this.drawRoundedRect(fill, 330, 104, new Color(255, 255, 255, 72), 46);
    fill.setSiblingIndex(1);
  }

  private drawRoundedRect(node: Node, width: number, height: number, color: Color, radius: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, Math.min(radius, width / 2, height / 2));
    graphics.fill();
  }

  private formatStars(stars: number): string {
    const filledStars = Math.max(0, Math.min(Math.floor(stars), 3));
    return `${'★'.repeat(filledStars)}${'☆'.repeat(3 - filledStars)}`;
  }

  private bindBackButton(): void {
    const backNode = this.findNodeByName(this.node, 'BackButton');
    if (!backNode) {
      console.warn('[StageSelectController] BackButton node not found.');
      return;
    }

    const button = backNode.getComponent(Button) ?? backNode.addComponent(Button);
    button.interactable = true;
    backNode.off(Button.EventType.CLICK, this.backToMainMenu, this);
    backNode.on(Button.EventType.CLICK, this.backToMainMenu, this);
  }

  private formatStageNumber(stageId: number): string {
    return stageId < 10 ? `0${stageId}` : `${stageId}`;
  }

  private findNodeByName(root: Node, nodeName: string): Node | null {
    if (root.name === nodeName) {
      return root;
    }

    for (const child of root.children) {
      const foundNode = this.findNodeByName(child, nodeName);
      if (foundNode) {
        return foundNode;
      }
    }

    return null;
  }
}
