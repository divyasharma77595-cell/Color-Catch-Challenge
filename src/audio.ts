/**
 * Web Audio API synthesizer for retro-arcade sound effects & dynamic background music.
 * 100% client-side, zero latency, zero external asset dependencies.
 */

// Musical notes frequencies (Hz)
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, REST: 0,
};

// 16-step melodic theme patterns
const MELODY_PATTERN_A = [
  'E4', 'G4', 'A4', 'C5', 'B4', 'G4', 'E4', 'D4',
  'E4', 'G4', 'A4', 'C5', 'D5', 'C5', 'A4', 'G4',
];

const MELODY_PATTERN_B = [
  'A4', 'C5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4',
  'F4', 'A4', 'C5', 'B4', 'G4', 'E4', 'D4', 'C4',
];

const BASS_PATTERN = [
  'C3', 'REST', 'C3', 'G3', 'A3', 'REST', 'A3', 'E3',
  'F3', 'REST', 'F3', 'C4', 'G3', 'REST', 'G3', 'B3',
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private currentStep: number = 0;
  private tempoBpm: number = 126;

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        
        // Master SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);

        // Master BGM Gain
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (this.bgmGain) {
        this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.22, this.ctx.currentTime);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /* ----------------- BGM Synthesizer ----------------- */

  public startBGM(speedMultiplier: number = 1.0) {
    this.initCtx();
    if (!this.ctx || this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.tempoBpm = Math.floor(126 * speedMultiplier);
    this.currentStep = 0;
    this.scheduleBgmLoop();
  }

  public updateBgmTempo(speedMultiplier: number) {
    this.tempoBpm = Math.floor(126 * speedMultiplier);
  }

  public pauseBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentStep = 0;
  }

  private scheduleBgmLoop = () => {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    const stepDuration = 60 / this.tempoBpm / 4; // 16th note duration in seconds
    const now = this.ctx.currentTime;

    // Schedule next beat note
    const step = this.currentStep % 32;
    const isSectionB = step >= 16;
    const localStep = step % 16;

    // 1. Melody Note
    const melodyList = isSectionB ? MELODY_PATTERN_B : MELODY_PATTERN_A;
    const noteName = melodyList[localStep];
    const freq = NOTE[noteName];

    if (freq && !this.isMuted) {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.09, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + stepDuration * 0.85);
    }

    // 2. Bassline Note (every 2 steps / 8th notes)
    if (localStep % 2 === 0 && !this.isMuted) {
      const bassNote = BASS_PATTERN[localStep];
      const bassFreq = NOTE[bassNote];

      if (bassFreq) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.07, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.6);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.6);
      }
    }

    // 3. Subtle Percussion (Hi-hat click on every 2nd step, soft kick on 0, 8)
    if (!this.isMuted) {
      if (localStep % 4 === 0) {
        // Soft synth kick
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.12, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.08);
      } else if (localStep % 2 === 1) {
        // Soft hat tick
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'triangle';
        hatOsc.frequency.setValueAtTime(8000, now);

        hatGain.gain.setValueAtTime(0.015, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        hatOsc.connect(hatGain);
        hatGain.connect(this.bgmGain);
        hatOsc.start(now);
        hatOsc.stop(now + 0.03);
      }
    }

    this.currentStep++;

    const delayMs = stepDuration * 1000;
    this.bgmTimer = window.setTimeout(this.scheduleBgmLoop, delayMs);
  };

  /* ----------------- SFX Sound Effects ----------------- */

  public playCatch(isBonus: boolean = false, combo: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isBonus ? 'triangle' : 'sine';

    const baseFreq = 480 + Math.min(combo * 45, 450);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);

    if (combo >= 3) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.18);
      gain2.gain.setValueAtTime(0.14, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.2);
    }
  }

  public playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playTargetChange() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }

  public playCountdownTick(isFinal: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isFinal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 500, now);

    gain.gain.setValueAtTime(isFinal ? 0.25 : 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.2 : 0.08));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + (isFinal ? 0.2 : 0.08));
  }

  public playGameOver(isHighscore: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = isHighscore
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
      : [659.25, 587.33, 523.25, 392.0];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.22, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.35);
    });
  }

  public playButtonClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sounds = new SoundEngine();
