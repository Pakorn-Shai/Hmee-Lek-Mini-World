import { _decorator, Component } from 'cc';
import { SceneRouter } from '../core/SceneRouter';

const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  public onBubbleShooterClicked(): void {
    SceneRouter.loadStageSelect();
  }

  public onBackClicked(): void {
    SceneRouter.loadTitle();
  }
}
