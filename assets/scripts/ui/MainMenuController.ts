import { _decorator, Color, Component, Graphics, Label, Layers, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { SceneRouter } from '../core/SceneRouter';
import { SaveManager } from '../core/SaveManager';

const { ccclass } = _decorator;

const HEART_HUD_X = -260;
const COIN_HUD_X = 260;
const ECONOMY_HUD_Y = 980;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  private heartLabel?: Label;
  private coinLabel?: Label;
  private heartShadowLabel?: Label;
  private coinShadowLabel?: Label;

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
