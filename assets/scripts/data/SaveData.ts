export const CURRENT_SAVE_SCHEMA_VERSION = 1;

export type LanguageCode = 'th' | 'en' | 'zh_TW' | 'zh_CN';

export interface PlayerSaveData {
  coins: number;
}

export interface SettingsSaveData {
  language: LanguageCode;
  bgmVolume: number;
  sfxVolume: number;
  isBgmEnabled: boolean;
  isSfxEnabled: boolean;
}

export interface BubbleShooterProgressSaveData {
  unlockedStage: number;
  bestScore: Record<string, number>;
  stars: Record<string, number>;
  cleared: Record<string, boolean>;
}

export interface MiniGameProgressSaveData {
  bubbleShooter: BubbleShooterProgressSaveData;
}

export interface SaveData {
  schemaVersion: number;
  player: PlayerSaveData;
  settings: SettingsSaveData;
  minigames: MiniGameProgressSaveData;
}
