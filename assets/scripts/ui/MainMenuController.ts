import { _decorator, Color, Component, Label, Layers, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { SceneRouter } from '../core/SceneRouter';
import { SaveManager } from '../core/SaveManager';

const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  private heartLabel?: Label;
  private coinLabel?: Label;

  protected onLoad(): void {
    this.setupEconomyLabels();
    this.refreshEconomyLabels();
  }

  public onBubbleShooterClicked(): void {
    SceneRouter.loadStageSelect();
  }

  public onBackClicked(): void {
    SceneRouter.loadTitle();
  }

  private setupEconomyLabels(): void {
    this.heartLabel = this.findNodeByName(this.node, 'HeartLabel')?.getComponent(Label) ?? undefined;
    this.coinLabel = this.findNodeByName(this.node, 'CoinLabel')?.getComponent(Label) ?? undefined;

    if (!this.heartLabel) {
      this.heartLabel = this.createEconomyLabel('HeartLabel', -170, 520);
    }

    if (!this.coinLabel) {
      this.coinLabel = this.createEconomyLabel('CoinLabel', 170, 520);
    }
  }

  private refreshEconomyLabels(): void {
    const saveData = SaveManager.regenerateHearts();
    if (this.heartLabel) {
      this.heartLabel.string = `x${saveData.player.hearts}`;
    }
    if (this.coinLabel) {
      this.coinLabel.string = `x${saveData.player.coins}`;
    }
  }

  private createEconomyLabel(nodeName: string, x: number, y: number): Label {
    const badgeNode = new Node(`${nodeName}Badge`);
    badgeNode.layer = Layers.Enum.UI_2D;
    badgeNode.setParent(this.node);
    badgeNode.setPosition(x, y);
    const badgeTransform = badgeNode.addComponent(UITransform);
    badgeTransform.setContentSize(260, 84);

    this.createEconomyIcon(nodeName, badgeNode);

    const labelNode = new Node(nodeName);
    labelNode.layer = Layers.Enum.UI_2D;
    labelNode.setParent(badgeNode);
    labelNode.setPosition(48, 0);

    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(160, 72);

    const label = labelNode.addComponent(Label);
    label.fontSize = 34;
    label.lineHeight = 42;
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    return label;
  }

  private createEconomyIcon(nodeName: string, parent: Node): void {
    const iconNode = new Node(`${nodeName}Icon`);
    iconNode.layer = Layers.Enum.UI_2D;
    iconNode.setParent(parent);
    iconNode.setPosition(-74, 0);
    const transform = iconNode.addComponent(UITransform);
    transform.setContentSize(62, 62);

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

  private loadCommonSpriteFrame(assetName: string, onLoaded: (spriteFrame: SpriteFrame) => void): void {
    const resourcePath = `ui/common/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        console.warn(`[MainMenuController] SpriteFrame not found: ${resourcePath}`, error);
        return;
      }

      onLoaded(spriteFrame);
    });
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
