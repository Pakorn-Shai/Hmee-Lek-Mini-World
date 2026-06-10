import type { LanguageCode } from '../data/SaveData';
import { SaveManager } from './SaveManager';

export class SettingsManager {
  public static getLanguage(): LanguageCode {
    return SaveManager.getData().settings.language;
  }

  public static setLanguage(language: LanguageCode): void {
    SaveManager.updateData((data) => {
      data.settings.language = language;
    });
  }

  public static getBgmVolume(): number {
    return SaveManager.getData().settings.bgmVolume;
  }

  public static setBgmVolume(volume: number): void {
    SaveManager.updateData((data) => {
      data.settings.bgmVolume = this.clampVolume(volume);
    });
  }

  public static getSfxVolume(): number {
    return SaveManager.getData().settings.sfxVolume;
  }

  public static setSfxVolume(volume: number): void {
    SaveManager.updateData((data) => {
      data.settings.sfxVolume = this.clampVolume(volume);
    });
  }

  public static isBgmEnabled(): boolean {
    return SaveManager.getData().settings.isBgmEnabled;
  }

  public static setBgmEnabled(isEnabled: boolean): void {
    SaveManager.updateData((data) => {
      data.settings.isBgmEnabled = isEnabled;
    });
  }

  public static isSfxEnabled(): boolean {
    return SaveManager.getData().settings.isSfxEnabled;
  }

  public static setSfxEnabled(isEnabled: boolean): void {
    SaveManager.updateData((data) => {
      data.settings.isSfxEnabled = isEnabled;
    });
  }

  private static clampVolume(volume: number): number {
    if (!Number.isFinite(volume)) {
      return 0;
    }

    return Math.min(1, Math.max(0, volume));
  }
}
