import { _decorator, AudioClip, AudioSource, Component } from 'cc';
import { SettingsManager } from './SettingsManager';

const { ccclass, property } = _decorator;

export type BgmId = string;
export type SfxId = string;

@ccclass('AudioManager')
export class AudioManager extends Component {
  @property(AudioSource)
  private bgmSource: AudioSource | null = null;

  @property(AudioSource)
  private sfxSource: AudioSource | null = null;

  private currentBgmId: BgmId | null = null;

  public playBgm(bgmId: BgmId, clip?: AudioClip): void {
    if (!SettingsManager.isBgmEnabled()) {
      return;
    }

    if (!this.bgmSource) {
      console.warn('[AudioManager] BGM AudioSource is not assigned.');
      return;
    }

    if (this.currentBgmId === bgmId && this.bgmSource.playing) {
      return;
    }

    if (!clip) {
      // TODO: Bind or load AudioClip assets for BGM when real audio is added.
      console.warn(`[AudioManager] Missing BGM clip: ${bgmId}`);
      return;
    }

    this.currentBgmId = bgmId;
    this.bgmSource.stop();
    this.bgmSource.clip = clip;
    this.bgmSource.loop = true;
    this.bgmSource.volume = SettingsManager.getBgmVolume();
    this.bgmSource.play();
  }

  public stopBgm(): void {
    this.currentBgmId = null;
    this.bgmSource?.stop();
  }

  public playSfx(sfxId: SfxId, clip?: AudioClip): void {
    if (!SettingsManager.isSfxEnabled()) {
      return;
    }

    if (!this.sfxSource) {
      console.warn('[AudioManager] SFX AudioSource is not assigned.');
      return;
    }

    if (!clip) {
      // TODO: Bind or load AudioClip assets for SFX when real audio is added.
      console.warn(`[AudioManager] Missing SFX clip: ${sfxId}`);
      return;
    }

    this.sfxSource.volume = SettingsManager.getSfxVolume();
    this.sfxSource.playOneShot(clip, SettingsManager.getSfxVolume());
  }

  public applySettings(): void {
    if (this.bgmSource) {
      this.bgmSource.volume = SettingsManager.isBgmEnabled() ? SettingsManager.getBgmVolume() : 0;
    }

    if (this.sfxSource) {
      this.sfxSource.volume = SettingsManager.isSfxEnabled() ? SettingsManager.getSfxVolume() : 0;
    }
  }
}
