import { _decorator, Button, Color, Component, Label, Layers, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { BubbleStageSelection, getBubbleStageConfig } from '../data/BubbleStageData';
import { SceneRouter } from '../core/SceneRouter';
import { SaveManager } from '../core/SaveManager';

const { ccclass } = _decorator;

@ccclass('StageSelectController')
export class StageSelectController extends Component {
  private heartLabel?: Label;
  private coinLabel?: Label;
  private heartWarningNode?: Node;
  private heartWarningLabel?: Label;

  protected onLoad(): void {
    this.setupEconomyLabels();
    this.refreshEconomyLabels();
    this.setupHeartWarning();
    this.bindStageButtons();
    this.bindBackButton();
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
      const isUnlocked = stageConfig !== undefined && stageId <= progress.unlockedStage;
      const stageKey = `${stageId}`;
      const stars = progress.stars[stageKey] ?? 0;
      const isCleared = progress.cleared[stageKey] ?? false;

      button.interactable = isUnlocked;
      stageNode.off(Button.EventType.CLICK, this.openStage1, this);
      this.updateStageProgressLabel(stageNode, isUnlocked, isCleared, stars, stageConfig !== undefined);

      if (isUnlocked) {
        stageNode.on(Button.EventType.CLICK, () => this.openStage(stageId), this);
      }

      console.log('[StageSelectController] stage state', {
        stageId,
        unlocked: isUnlocked,
        cleared: isCleared,
        stars,
      });
    }
  }

  private updateStageProgressLabel(stageNode: Node, isUnlocked: boolean, isCleared: boolean, stars: number, hasStageConfig: boolean): void {
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

    if (!hasStageConfig) {
      label.string = 'เร็ว ๆ นี้';
      label.color = new Color(255, 255, 255, 150);
      return;
    }

    if (!isUnlocked) {
      label.string = 'ล็อก';
      label.color = new Color(255, 255, 255, 165);
      return;
    }

    label.string = isCleared ? `${this.formatStars(stars)} ผ่านแล้ว` : this.formatStars(stars);
    label.color = isCleared ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 210);
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
