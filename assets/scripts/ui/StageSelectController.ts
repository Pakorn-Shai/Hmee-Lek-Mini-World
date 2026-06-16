import { _decorator, Button, Color, Component, Label, Node, UITransform } from 'cc';
import { BubbleStageSelection, getBubbleStageConfig } from '../data/BubbleStageData';
import { SceneRouter } from '../core/SceneRouter';
import { SaveManager } from '../core/SaveManager';

const { ccclass } = _decorator;

@ccclass('StageSelectController')
export class StageSelectController extends Component {
  protected onLoad(): void {
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

    BubbleStageSelection.selectedStage = stageId;
    console.log(`[StageSelectController] Stage ${stageId} clicked. Loading BubbleShooter.`);
    SceneRouter.loadBubbleShooter();
  }

  public backToMainMenu(): void {
    console.log('[StageSelectController] Back clicked. Loading MainMenu.');
    SceneRouter.loadMainMenu();
  }

  private bindStageButtons(): void {
    const progress = SaveManager.getData().minigames.bubbleShooter;

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
      label.string = 'Soon';
      label.color = new Color(255, 255, 255, 150);
      return;
    }

    if (!isUnlocked) {
      label.string = 'Locked';
      label.color = new Color(255, 255, 255, 165);
      return;
    }

    label.string = isCleared ? `${this.formatStars(stars)} Cleared` : this.formatStars(stars);
    label.color = isCleared ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 210);
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
