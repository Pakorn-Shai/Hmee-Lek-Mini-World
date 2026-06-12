import { _decorator, Component, instantiate, Node, Prefab } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BubblePearlBoardPreview')
export class BubblePearlBoardPreview extends Component {
  @property(Prefab)
  public pearlPrefab: Prefab | null = null;

  @property(Node)
  public pearlParent: Node | null = null;

  private readonly horizontalSpacing = 68;
  private readonly verticalSpacing = 58;
  private readonly rowCounts = [6, 5, 6, 5];

  protected start(): void {
    this.createPreviewBoard();
  }

  public createPreviewBoard(): void {
    if (!this.pearlPrefab || !this.pearlParent) {
      console.warn('[PearlBoardPreview] pearlPrefab or pearlParent is not assigned.');
      return;
    }

    this.pearlParent.removeAllChildren();

    const maxColumns = 6;
    const boardWidth = (maxColumns - 1) * this.horizontalSpacing;
    const boardHeight = (this.rowCounts.length - 1) * this.verticalSpacing;
    const startX = -boardWidth / 2;
    const startY = boardHeight / 2;

    this.rowCounts.forEach((count, rowIndex) => {
      const rowOffsetX = rowIndex % 2 === 1 ? this.horizontalSpacing / 2 : 0;
      const y = startY - rowIndex * this.verticalSpacing;

      for (let column = 0; column < count; column += 1) {
        const pearl = instantiate(this.pearlPrefab);
        pearl.name = `Pearl_r${rowIndex}_c${column}`;
        pearl.setParent(this.pearlParent);
        pearl.setPosition(startX + rowOffsetX + column * this.horizontalSpacing, y, 0);
      }
    });

    console.log('[PearlBoardPreview] pearlParent child count:', this.pearlParent.children.length);
  }
}
