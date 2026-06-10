import { director } from 'cc';

export enum AppScene {
  Boot = 'Boot',
  Title = 'Title',
  MainMenu = 'MainMenu',
  StageSelect = 'StageSelect',
  BubbleShooterGame = 'BubbleShooterGame',
}

export type SceneName = `${AppScene}`;

export class SceneRouter {
  public static loadScene(sceneName: AppScene | SceneName, onLaunched?: () => void): void {
    director.loadScene(sceneName, onLaunched);
  }

  public static loadBoot(): void {
    this.loadScene(AppScene.Boot);
  }

  public static loadTitle(): void {
    this.loadScene(AppScene.Title);
  }

  public static loadMainMenu(): void {
    this.loadScene(AppScene.MainMenu);
  }

  public static loadStageSelect(): void {
    this.loadScene(AppScene.StageSelect);
  }

  public static loadBubbleShooterGame(): void {
    this.loadScene(AppScene.BubbleShooterGame);
  }
}
