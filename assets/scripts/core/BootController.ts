import { _decorator, Component } from 'cc';
import { SaveManager } from './SaveManager';
import { SceneRouter } from './SceneRouter';
import { SettingsManager } from './SettingsManager';

const { ccclass } = _decorator;

@ccclass('BootController')
export class BootController extends Component {
  public start(): void {
    console.log('[Boot] Loading save data');
    SaveManager.load();

    console.log('[Boot] Loading settings');
    SettingsManager.getLanguage();

    console.log('[Boot] Opening Title scene');
    SceneRouter.loadTitle();
  }
}
