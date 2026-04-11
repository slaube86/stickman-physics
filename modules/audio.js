// audio.js – Prozedurales Audio: Sound-Effekte + Chiptune-Musik

export class AudioManager {
  constructor() {
    this.ctx = null; // AudioContext, wird bei erster Interaktion erstellt
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.muted = false;
    this.currentMusic = null; // { stop() }
    this.currentTheme = null;
    this._initialized = false;
  }

  // AudioContext erst bei User-Interaktion starten (Browser-Policy)
  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.4;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this._initialized = true;
    } catch {
      // Web Audio nicht verfügbar
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  // ─── Sound-Effekte ──────────────────────────────────────

  playCoin() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Aufsteigendes "Pling" – zwei kurze Töne
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987, t);       // B5
    osc1.frequency.setValueAtTime(1319, t + 0.07); // E6

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1319, t + 0.07); // E6
    osc2.frequency.setValueAtTime(1568, t + 0.12); // G6

    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc1.connect(env);
    osc2.connect(env);
    env.connect(this.sfxGain);

    osc1.start(t);
    osc1.stop(t + 0.12);
    osc2.start(t + 0.07);
    osc2.stop(t + 0.2);
  }

  playJump() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playBounce() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.25);

    env.gain.setValueAtTime(0.25, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playLevelComplete() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fanfare: C E G C(hoch)
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t + i * 0.15);
      env.gain.linearRampToValueAtTime(0.25, t + i * 0.15 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.4);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.4);
    });
  }

  playGameOver() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Absteigender Ton
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // ─── Musik ──────────────────────────────────────────────

  startMusic(theme) {
    if (!this.ctx) return;
    if (this.currentTheme === theme && this.currentMusic) return;
    this.stopMusic();
    this.currentTheme = theme;

    const melodies = {
      normal: this._melodyNormal.bind(this),
      ice:    this._melodyIce.bind(this),
      walle:  this._melodyWallE.bind(this),
      minecraft: this._melodyMinecraft.bind(this),
    };

    const melodyFn = melodies[theme] || melodies.normal;
    this.currentMusic = melodyFn();
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.currentTheme = null;
    }
  }

  pauseMusic() {
    if (this.musicGain) {
      this.musicGain.gain.value = 0;
    }
  }

  resumeMusic() {
    if (this.musicGain && !this.muted) {
      this.musicGain.gain.value = 0.15;
    }
  }

  // --- Normal Theme: fröhliche Chiptune-Melodie ---
  _melodyNormal() {
    // C-Dur Melodie, loopend
    const notes = [
      // Takt 1
      523, 523, 659, 659, 784, 784, 659, 0,
      // Takt 2
      587, 587, 523, 523, 494, 494, 523, 0,
      // Takt 3
      659, 659, 784, 784, 880, 880, 784, 0,
      // Takt 4
      659, 587, 523, 587, 659, 523, 494, 0,
    ];
    return this._playLoop(notes, 0.14, 'square');
  }

  // --- Ice Theme: mysteriöse, kühle Melodie ---
  _melodyIce() {
    const notes = [
      // Moll-Töne, langsamer
      330, 0, 370, 0, 330, 0, 294, 0,
      262, 0, 294, 0, 330, 0, 370, 0,
      440, 0, 415, 0, 370, 0, 330, 0,
      294, 0, 262, 0, 294, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.2, 'triangle');
  }

  // --- Wall-E Theme: verträumte, warme Melodie ---
  _melodyWallE() {
    // Angelehnt an warme, nostalgische Töne
    const notes = [
      392, 0, 440, 0, 494, 0, 523, 0,
      587, 0, 523, 0, 494, 0, 440, 0,
      392, 0, 349, 0, 330, 0, 349, 0,
      392, 0, 440, 0, 392, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.22, 'sine');
  }

  // --- Minecraft Theme: ruhige, pentatonische Melodie ---
  _melodyMinecraft() {
    // C-Pentatonik, ruhig und erkundend (inspiriert vom Minecraft-Feeling)
    const notes = [
      262, 0, 294, 0, 330, 0, 0, 0,
      392, 0, 440, 0, 392, 0, 330, 0,
      294, 0, 262, 0, 294, 0, 330, 0,
      392, 0, 330, 0, 294, 0, 0, 0,
      262, 0, 330, 0, 392, 0, 440, 0,
      523, 0, 440, 0, 392, 0, 0, 0,
      330, 0, 294, 0, 262, 0, 294, 0,
      330, 0, 392, 0, 330, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.25, 'triangle');
  }

  _playLoop(notes, noteLen, waveType) {
    let running = true;
    let timeoutId = null;
    let activeOsc = null;
    let activeEnv = null;
    let idx = 0;

    const playNext = () => {
      if (!running || !this.ctx) return;

      const freq = notes[idx % notes.length];
      idx++;

      if (freq > 0) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = waveType;
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.3, t);
        env.gain.exponentialRampToValueAtTime(0.01, t + noteLen * 0.9);

        osc.connect(env);
        env.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + noteLen);

        activeOsc = osc;
        activeEnv = env;
      }

      timeoutId = setTimeout(playNext, noteLen * 1000);
    };

    playNext();

    return {
      stop() {
        running = false;
        if (timeoutId) clearTimeout(timeoutId);
        try {
          if (activeOsc) activeOsc.stop();
        } catch {
          // bereits gestoppt
        }
      }
    };
  }
}
