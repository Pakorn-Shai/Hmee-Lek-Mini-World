import { _decorator, Component, instantiate, Node, Prefab, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PearlBoardPreview')
export class PearlBoardPreview extends Component {
  @property(Prefab)
  public pearlPrefab: Prefab | null = null;

  @property(Node)
  public boardParent: Node | null = null;

  @property
  public pearlSize = 64;

  @property
  public horizontalSpacing = 68;

  @property
  public verticalSpacing = 58;

  private readonly rows = [6, 5, 6, 5];

  protected onLoad(): void {
    this.createPreview();
  }

  public createPreview(): void {
    if (!this.pearlPrefab || !this.boardParent) {
      console.warn('[PearlBoardPreview] Assign pearlPrefab and boardParent in the Inspector.');
      return;
    }

    this.boardParent.removeAllChildren();

    this.rows.forEach((count, rowIndex) => {
      const rowWidth = (count - 1) * this.horizontalSpacing;
      const offsetX = rowIndex % 2 === 1 ? this.horizontalSpacing / 2 : 0;
      const y = -rowIndex * this.verticalSpacing;

      for (let column = 0; column < count; column += 1) {
        const pearl = instantiate(this.pearlPrefab);
        pearl.name = `PreviewPearl_r${rowIndex}_c${column}`;
        pearl.setParent(this.boardParent);
        pearl.setPosition(new Vec3(-rowWidth / 2 + column * this.horizontalSpacing + offsetX, y, 0));

        const transform = pearl.getComponent(UITransform) ?? pearl.addComponent(UITransform);
        transform.setContentSize(this.pearlSize, this.pearlSize);
      }
    });

    console.log('[PearlBoardPreview] pearl count:', this.boardParent.children.length);
  }
}
