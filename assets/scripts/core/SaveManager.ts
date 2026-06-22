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
const DEFAULT_MAX_HEARTS = 5;
const HEART_REGEN_INTERVAL_MS = 60 * 60 * 1000;

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

  public static getCoins(): number {
    return this.getData().player.coins;
  }

  public static addCoins(amount: number): SaveData {
    const coinAmount = Math.floor(this.toNumber(amount, 0));
    if (coinAmount <= 0) {
      return this.getData();
    }

    return this.updateData((data) => {
      data.player.coins = Math.max(0, data.player.coins + coinAmount);
    });
  }

  public static getHearts(): number {
    return this.regenerateHearts().player.hearts;
  }

  public static getMaxHearts(): number {
    return this.regenerateHearts().player.maxHearts;
  }

  public static consumeHeart(): boolean {
    const nextData = this.regenerateHearts();

    if (nextData.player.hearts <= 0) {
      return false;
    }

    nextData.player.hearts -= 1;
    if (nextData.player.hearts < nextData.player.maxHearts && !this.isValidNumber(nextData.player.lastHeartRegenAt)) {
      nextData.player.lastHeartRegenAt = Date.now();
    }

    this.data = this.normalize(nextData);
    this.save();
    return true;
  }

  public static regenerateHearts(): SaveData {
    const nextData = this.getData();
    const player = nextData.player;
    const now = Date.now();

    if (player.hearts >= player.maxHearts) {
      player.lastHeartRegenAt = now;
      this.data = this.normalize(nextData);
      this.save();
      return this.clone(this.data);
    }

    const elapsedMs = now - player.lastHeartRegenAt;
    const regeneratedHearts = Math.floor(elapsedMs / HEART_REGEN_INTERVAL_MS);

    if (regeneratedHearts > 0) {
      const missingHearts = player.maxHearts - player.hearts;
      const heartsToAdd = Math.min(missingHearts, regeneratedHearts);
      player.hearts += heartsToAdd;
      player.lastHeartRegenAt += heartsToAdd * HEART_REGEN_INTERVAL_MS;
    }

    this.data = this.normalize(nextData);
    this.save();
    return this.clone(this.data);
  }

  public static canPlayStage(): boolean {
    return this.getHearts() > 0;
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
    return {
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      player: this.normalizePlayer(saveData.player),
      settings: this.normalizeSettings(saveData.settings),
      minigames: {
        bubbleShooter: this.normalizeBubbleShooterProgress(saveData.minigames?.bubbleShooter),
      },
    };
  }

  private static normalizePlayer(player?: Partial<SaveData['player']>): SaveData['player'] {
    const now = Date.now();
    const coins = Math.max(0, Math.floor(this.toNumber(player?.coins, 0)));
    const maxHearts = Math.max(1, Math.floor(this.toNumber(player?.maxHearts, DEFAULT_MAX_HEARTS)));
    const hearts = Math.max(0, Math.min(maxHearts, Math.floor(this.toNumber(player?.hearts, DEFAULT_MAX_HEARTS))));
    const lastHeartRegenAt = Math.floor(this.toNumber(player?.lastHeartRegenAt, now));

    return {
      coins,
      hearts,
      maxHearts,
      lastHeartRegenAt,
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
        hearts: DEFAULT_MAX_HEARTS,
        maxHearts: DEFAULT_MAX_HEARTS,
        lastHeartRegenAt: Date.now(),
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
    return this.isValidNumber(value) ? value : fallback;
  }

  private static isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private static clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
