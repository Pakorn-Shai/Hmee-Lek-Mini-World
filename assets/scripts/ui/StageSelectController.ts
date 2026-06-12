import { _decorator, Button, Component, Node } from 'cc';
import { BubbleStageSelection } from '../data/BubbleStageData';
import { SceneRouter } from '../core/SceneRouter';

const { ccclass } = _decorator;

@ccclass('StageSelectController')
export class StageSelectController extends Component {
  protected onLoad(): void {
    this.bindStageButtons();
    this.bindBackButton();
  }

  public openStage1(): void {
    BubbleStageSelection.selectedStage = 1;
    console.log('[StageSelectController] Stage 1 clicked. Loading BubbleShooter.');
    SceneRouter.loadBubbleShooter();
  }

  public backToMainMenu(): void {
    console.log('[StageSelectController] Back clicked. Loading MainMenu.');
    SceneRouter.loadMainMenu();
  }

  private bindStageButtons(): void {
    for (let stageId = 1; stageId <= 10; stageId += 1) {
      const stageNodeName = `Stage${this.formatStageNumber(stageId)}`;
      const stageNode = this.findNodeByName(this.node, stageNodeName);
      if (!stageNode) {
        console.warn(`[StageSelectController] ${stageNodeName} node not found.`);
        continue;
      }

      const button = stageNode.getComponent(Button) ?? stageNode.addComponent(Button);
      button.interactable = stageId === 1;
      stageNode.off(Button.EventType.CLICK, this.openStage1, this);

      if (stageId === 1) {
        stageNode.on(Button.EventType.CLICK, this.openStage1, this);
      }
    }
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
