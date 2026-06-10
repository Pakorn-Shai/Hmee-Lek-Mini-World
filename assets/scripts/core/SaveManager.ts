import { sys } from 'cc';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
} from '../data/SaveData';
import type {
  SaveData,
  SettingsSaveData,
  BubbleShooterProgressSaveData,
} from '../data/SaveData';

type SaveDataUpdater = (data: SaveData) => void;

const SAVE_STORAGE_KEY = 'hmee_lek_mini_world.save';

export class SaveManager {
  private static data: SaveData | null = null;

  public static load(): SaveData {
    const rawSave = sys.localStorage.getItem(SAVE_STORAGE_KEY);

    if (!rawSave) {
      this.data = this.createDefaultSave();
      this.save();
      return this.clone(this.data);
    }

    try {
      const parsedSave = JSON.parse(rawSave) as Partial<SaveData>;
      this.data = this.migrate(parsedSave);
      this.save();
    } catch (error) {
      console.warn('[SaveManager] Failed to load save data. Using default save.', error);
      this.data = this.createDefaultSave();
      this.save();
    }

    return this.clone(this.data);
  }

  public static save(data?: SaveData): void {
    if (data) {
      this.data = this.normalize(data);
    }

    if (!this.data) {
      this.data = this.createDefaultSave();
    }

    sys.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
  }

  public static reset(): SaveData {
    this.data = this.createDefaultSave();
    this.save();
    return this.clone(this.data);
  }

  public static getData(): SaveData {
    if (!this.data) {
      return this.load();
    }

    return this.clone(this.data);
  }

  public static updateData(updater: SaveDataUpdater): SaveData {
    const nextData = this.getData();
    updater(nextData);
    this.data = this.normalize(nextData);
    this.save();
    return this.clone(this.data);
  }

  private static migrate(saveData: Partial<SaveData>): SaveData {
    const schemaVersion = saveData.schemaVersion ?? 0;

    if (schemaVersion < CURRENT_SAVE_SCHEMA_VERSION) {
      // TODO: Add version-by-version migration steps when the save schema changes.
    }

    return this.normalize({
      ...saveData,
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    } as SaveData);
  }

  private static normalize(saveData: Partial<SaveData>): SaveData {
    const defaultSave = this.createDefaultSave();

    return {
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      player: {
        coins: this.toNumber(saveData.player?.coins, defaultSave.player.coins),
      },
      settings: this.normalizeSettings(saveData.settings),
      minigames: {
        bubbleShooter: this.normalizeBubbleShooterProgress(saveData.minigames?.bubbleShooter),
      },
    };
  }

  private static normalizeSettings(settings?: Partial<SettingsSaveData>): SettingsSaveData {
    const defaultSettings = this.createDefaultSave().settings;

    return {
      language: settings?.language ?? defaultSettings.language,
      bgmVolume: this.clampVolume(settings?.bgmVolume ?? defaultSettings.bgmVolume),
      sfxVolume: this.clampVolume(settings?.sfxVolume ?? defaultSettings.sfxVolume),
      isBgmEnabled: settings?.isBgmEnabled ?? defaultSettings.isBgmEnabled,
      isSfxEnabled: settings?.isSfxEnabled ?? defaultSettings.isSfxEnabled,
    };
  }

  private static normalizeBubbleShooterProgress(
    progress?: Partial<BubbleShooterProgressSaveData>,
  ): BubbleShooterProgressSaveData {
    const defaultProgress = this.createDefaultSave().minigames.bubbleShooter;

    return {
      unlockedStage: Math.max(1, Math.floor(this.toNumber(progress?.unlockedStage, defaultProgress.unlockedStage))),
      bestScore: progress?.bestScore ?? defaultProgress.bestScore,
      stars: progress?.stars ?? defaultProgress.stars,
      cleared: progress?.cleared ?? defaultProgress.cleared,
    };
  }

  private static createDefaultSave(): SaveData {
    return {
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      player: {
        coins: 0,
      },
      settings: {
        language: 'th',
        bgmVolume: 0.8,
        sfxVolume: 0.8,
        isBgmEnabled: true,
        isSfxEnabled: true,
      },
      minigames: {
        bubbleShooter: {
          unlockedStage: 1,
          bestScore: {},
          stars: {},
          cleared: {},
        },
      },
    };
  }

  private static clampVolume(value: number): number {
    return Math.min(1, Math.max(0, this.toNumber(value, 0.8)));
  }

  private static toNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private static clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
