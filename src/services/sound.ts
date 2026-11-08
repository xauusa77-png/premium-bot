/**
 * PREMIUM BOT - Audio Synthesis Engine
 * Pure Web Audio API synthesiser for low-latency, cross-platform audio.
 * Works on Android/mobile browsers without external audio files.
 */

const SOUND_STORAGE_KEY = 'pb_sound_enabled';

class SoundService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      this.enabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.enabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(val));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    const next = !this.enabled;
    this.setEnabled(next);
    if (next) {
      this.playClick();
    }
    return next;
  }

  /**
   * Crisp digital button click sound when GENERATE SIGNAL is clicked
   */
  public playClick(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Crisp tech pulse frequency sweep
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  /**
   * Subtle premium harmonic chime when a signal appears
   */
  public playSignalArrival(direction: 'UP' | 'DOWN' | 'NO CLEAR SIGNAL' | string): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (direction === 'UP') {
        // Bullish harmonic major chord chime (660Hz -> 880Hz -> 1320Hz)
        const notes = [659.25, 880.0, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.4);
        });
      } else if (direction === 'DOWN') {
        // Bearish subtle warm resonance chime (740Hz -> 587Hz -> 440Hz)
        const notes = [739.99, 587.33, 440.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.14 / (idx + 1), now + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.4);
        });
      } else {
        // Neutral clean soft ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }
}

export const soundService = new SoundService();
