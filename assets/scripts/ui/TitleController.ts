import { _decorator, Component } from 'cc';
import { SceneRouter } from '../core/SceneRouter';

const { ccclass } = _decorator;

@ccclass('TitleController')
export class TitleController extends Component {
  public onPlayClicked(): void {
    SceneRouter.loadMainMenu();
  }
}
