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

    osc1.type = "square";
    osc1.frequency.setValueAtTime(987, t); // B5
    osc1.frequency.setValueAtTime(1319, t + 0.07); // E6

    osc2.type = "square";
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

    osc.type = "triangle";
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

    osc.type = "sine";
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
      osc.type = "square";
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
    osc.type = "sawtooth";
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
      ice: this._melodyIce.bind(this),
      walle: this._melodyWallE.bind(this),
      minecraft: this._melodyMinecraft.bind(this),
      clockwork: this._melodyClockwork.bind(this),
      desert: this._melodyDesert.bind(this),
      skatepark: this._melodySkatepark.bind(this),
      numbers: this._melodyNumbers.bind(this),
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
    return this._playLoop(notes, 0.14, "square");
  }

  // --- Ice Theme: mysteriöse, kühle Melodie ---
  _melodyIce() {
    const notes = [
      // Moll-Töne, langsamer
      330, 0, 370, 0, 330, 0, 294, 0, 262, 0, 294, 0, 330, 0, 370, 0, 440, 0,
      415, 0, 370, 0, 330, 0, 294, 0, 262, 0, 294, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.2, "triangle");
  }

  // --- Wall-E Theme: verträumte, warme Melodie ---
  _melodyWallE() {
    // Angelehnt an warme, nostalgische Töne
    const notes = [
      392, 0, 440, 0, 494, 0, 523, 0, 587, 0, 523, 0, 494, 0, 440, 0, 392, 0,
      349, 0, 330, 0, 349, 0, 392, 0, 440, 0, 392, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.22, "sine");
  }

  // --- Minecraft Theme: ruhige, pentatonische Melodie ---
  _melodyMinecraft() {
    // C-Pentatonik, ruhig und erkundend (inspiriert vom Minecraft-Feeling)
    const notes = [
      262, 0, 294, 0, 330, 0, 0, 0, 392, 0, 440, 0, 392, 0, 330, 0, 294, 0, 262,
      0, 294, 0, 330, 0, 392, 0, 330, 0, 294, 0, 0, 0, 262, 0, 330, 0, 392, 0,
      440, 0, 523, 0, 440, 0, 392, 0, 0, 0, 330, 0, 294, 0, 262, 0, 294, 0, 330,
      0, 392, 0, 330, 0, 0, 0,
    ];
    return this._playLoop(notes, 0.25, "triangle");
  }

  // --- Clockwork Theme: Tick-Tock Rhythmus + mechanische Melodie ---
  _melodyClockwork() {
    let running = true;

    // ── Tick-Tock mit Web Audio Look-Ahead Scheduling ────────
    // 120 BPM → 0.5s pro Schlag, Tick auf ungeraden, Tock auf geraden Schlägen
    const BEAT = 0.5;
    let nextBeat = this.ctx.currentTime + 0.05;
    let beatNum = 0;
    const activeNodes = [];

    const scheduleBeats = () => {
      if (!running || !this.ctx) return;

      while (nextBeat < this.ctx.currentTime + 1.2) {
        const isTick = beatNum % 2 === 0;
        const t = nextBeat;

        // Tick (hoch, scharf) / Tock (tiefer, weicher)
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(isTick ? 1400 : 900, t);
        env.gain.setValueAtTime(isTick ? 0.45 : 0.28, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(env);
        env.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.035);
        activeNodes.push(osc);

        // Tiefes Getriebe-Klonken auf jedem Taktschlag (beat 1 of 4)
        if (beatNum % 4 === 0) {
          const clank = this.ctx.createOscillator();
          const clankEnv = this.ctx.createGain();
          clank.type = "sawtooth";
          clank.frequency.setValueAtTime(140, t);
          clank.frequency.exponentialRampToValueAtTime(55, t + 0.09);
          clankEnv.gain.setValueAtTime(0.38, t);
          clankEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          clank.connect(clankEnv);
          clankEnv.connect(this.musicGain);
          clank.start(t);
          clank.stop(t + 0.11);
          activeNodes.push(clank);
        }

        nextBeat += BEAT;
        beatNum++;
      }
    };

    scheduleBeats();
    const schedulerId = setInterval(scheduleBeats, 100);

    // ── Melodie: E-Moll, mechanisch-gleichmäßig ──────────────
    // Viertel = 0.25s (passt zu 120 BPM: 2 Noten pro Tick-Tock-Schlag)
    const notes = [
      330,
      0,
      294,
      0, // E4, D4
      262,
      0,
      294,
      0, // C4, D4
      330,
      0,
      392,
      0, // E4, G4
      440,
      0,
      392,
      370, // A4, G4, F#4
      330,
      0,
      294,
      0, // E4, D4
      262,
      0,
      294,
      262, // C4, D4, C4
      294,
      0,
      330,
      0, // D4, E4
      262,
      0,
      0,
      0, // C4, Pause
    ];

    const melodyLoop = this._playLoop(notes, 0.25, "triangle");

    return {
      stop() {
        running = false;
        clearInterval(schedulerId);
        melodyLoop.stop();
        for (const n of activeNodes) {
          try {
            n.stop();
          } catch {
            /* bereits gestoppt */
          }
        }
      },
    };
  }

  // --- Desert Theme: Hijaz-Maqam + Dumbek-Rhythmus ---
  _melodyDesert() {
    let running = true;

    // ── Dumbek-Rhythmus: Dum auf 1, Tek auf 3 ──────────────
    // 133 BPM (0.45 s/Beat) – gemächlich, wüstenartig
    const BEAT = 0.45;
    let nextBeat = this.ctx.currentTime + 0.05;
    let beatNum = 0;
    const activeNodes = [];

    const scheduleBeats = () => {
      if (!running || !this.ctx) return;
      while (nextBeat < this.ctx.currentTime + 1.2) {
        const t = nextBeat;

        // Dum – tiefer Basston (Daumen, volle Membran)
        if (beatNum % 4 === 0) {
          const dum = this.ctx.createOscillator();
          const dumEnv = this.ctx.createGain();
          dum.type = "sine";
          dum.frequency.setValueAtTime(95, t);
          dum.frequency.exponentialRampToValueAtTime(52, t + 0.14);
          dumEnv.gain.setValueAtTime(0.55, t);
          dumEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
          dum.connect(dumEnv);
          dumEnv.connect(this.musicGain);
          dum.start(t);
          dum.stop(t + 0.17);
          activeNodes.push(dum);
        }

        // Tek – hoher Fingerschlag auf Beat 3
        if (beatNum % 4 === 2) {
          const tek = this.ctx.createOscillator();
          const tekEnv = this.ctx.createGain();
          tek.type = "triangle";
          tek.frequency.setValueAtTime(680, t);
          tek.frequency.exponentialRampToValueAtTime(400, t + 0.045);
          tekEnv.gain.setValueAtTime(0.2, t);
          tekEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
          tek.connect(tekEnv);
          tekEnv.connect(this.musicGain);
          tek.start(t);
          tek.stop(t + 0.055);
          activeNodes.push(tek);
        }

        nextBeat += BEAT;
        beatNum++;
      }
    };

    scheduleBeats();
    const schedulerId = setInterval(scheduleBeats, 100);

    // ── Melodie: Hijaz-Maqam auf D ──────────────────────────
    // Töne: D4(294) Eb4(311) F#4(370) G4(392) A4(440) Bb4(466) C5(523) D5(587)
    // Übermäßige Sekunde Eb→F# ist der charakteristische persisch-arabische Klang
    const notes = [
      // Phrase 1 – aufsteigend durch die Skala
      294, 311, 370,  0, 392,  0, 440,  0,
      // Phrase 2 – Gipfel
      466,  0, 523,  0, 587,  0,   0,  0,
      // Phrase 3 – Abstieg
      587, 523, 466, 440, 392,  0, 370,  0,
      // Phrase 4 – Rückkehr zum Grundton
      311, 294,   0,  0, 294,  0,   0,  0,
      // Phrase 5 – zweite Variation mit Verzierung
      440,  0, 523, 466, 440,  0, 392, 370,
      // Phrase 6 – Chromatische Umspielung
      370, 311, 294, 311, 370,  0,   0,  0,
      // Phrase 7 – Bogen über die Quinte
      392, 440, 392, 370, 311, 294,   0,  0,
      // Phrase 8 – Abschluss auf D
      294,  0, 311,  0, 370,  0, 294,  0,
    ];

    const melodyLoop = this._playLoop(notes, 0.225, "sine");

    return {
      stop() {
        running = false;
        clearInterval(schedulerId);
        melodyLoop.stop();
        for (const n of activeNodes) {
          try {
            n.stop();
          } catch {
            /* bereits gestoppt */
          }
        }
      },
    };
  }

  // --- Skatepark Theme: druckvoller Punk-Chiptune ---
  _melodySkatepark() {
    // Schnelle 8th-notes, A-Moll, aggressive square-wave
    // 160 BPM → 0.375s pro Viertel → 0.1875s pro Achtel ≈ 0.19s
    const notes = [
      // Riff 1 – treibend aufwärts
      440, 440, 523, 0,   587, 0,   659, 523,
      // Riff 2 – kurze Pause, dann Druck
      440, 523, 587, 659, 523, 440, 0,   0,
      // Riff 3 – höher hinaus
      659, 659, 784, 0,   880, 0,   784, 659,
      // Riff 4 – Auflösung zurück
      587, 523, 440, 494, 523, 440, 392, 0,
    ];
    return this._playLoop(notes, 0.12, "square");
  }

  // --- Numbers Theme: hüpfender Abzählreim in C-Dur-Pentatonik ---
  _melodyNumbers() {
    const notes = [
      // Zähl-Phrase 1 – Treppe aufwärts (1,2,3,4,5)
      523, 587, 659, 784, 880, 0,   784, 0,
      // Phrase 2 – Antwort abwärts
      880, 784, 659, 587, 523, 0,   587, 0,
      // Phrase 3 – höher zählen (6,7,8,9,10)
      659, 784, 880, 1047, 880, 0,  784, 0,
      // Phrase 4 – Auflösung auf dem Grundton
      659, 587, 523, 587, 659, 523, 0,   0,
    ];
    return this._playLoop(notes, 0.16, "triangle");
  }

  // Münze im Zahlenland: aufsteigendes Zwitschern (Zahl wird größer)
  playNumberUp(value = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Mit steigender Zahl klingt es eine Stufe höher
    const base = 523 + Math.min(value, 10) * 45;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.12);
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Treffer: absteigender Ton (Zahl schrumpft)
  playNumberDown() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.28);
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Volle Punktzahl erreicht – Power-up-Fanfare
  playPowerUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t + i * 0.08);
      env.gain.linearRampToValueAtTime(0.28, t + i * 0.08 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.3);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.3);
    });

    // Funkeln obendrauf
    const spark = this.ctx.createOscillator();
    const sparkEnv = this.ctx.createGain();
    spark.type = "sine";
    spark.frequency.setValueAtTime(1800, t + 0.4);
    spark.frequency.exponentialRampToValueAtTime(3200, t + 0.7);
    sparkEnv.gain.setValueAtTime(0.12, t + 0.4);
    sparkEnv.gain.exponentialRampToValueAtTime(0.01, t + 0.75);
    spark.connect(sparkEnv);
    sparkEnv.connect(this.sfxGain);
    spark.start(t + 0.4);
    spark.stop(t + 0.75);
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
      },
    };
  }
}
