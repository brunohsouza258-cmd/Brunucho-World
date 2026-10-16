// Trilha sonora do jogo, tocada por um mini-sequenciador com a Web Audio API.
// Cada música tem: bpm, acordes (um por compasso), melodia, estilo de baixo e bateria.
// Melodia: cada "palavra" é uma semicolcheia (1/16). "C5" = nota, "-" = segura a anterior, "." = pausa.

const SONGS = {
  // Hino "Six Seven" do menu: o gancho "six... se-ven!" se repete em cada compasso
  menu: {
    bpm: 140, lead: 'square', leadVol: 0.07, bass: 'octave', chords: ['A2', 'F2', 'C3', 'G2'],
    melody: `E5 - - . E5 . G5 - - - . . A4 . C5 . | D5 - - . D5 . F5 - - - . . C5 . A4 .
             E5 - - . E5 . G5 - - - . . A5 . G5 . | F5 . E5 . D5 . B4 . D5 - - - . . . .`,
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  // Música turbo enquanto o poder 67 está ativo
  poder67: {
    bpm: 168, lead: 'square', leadVol: 0.08, bass: 'pump', chords: ['A2', 'G2', 'F2', 'E2'],
    melody: `A5 . . A5 C6 - . . A5 . . A5 C6 - . . | G5 . . G5 B5 - . . G5 . . G5 B5 - . .
             F5 . . F5 A5 - . . F5 . . F5 A5 - . . | E5 . . E5 G#5 - . . B5 . A5 . G#5 . E5 .`,
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  },
  intro: {
    bpm: 92, lead: 'triangle', leadVol: 0.09, bass: 'long', chords: ['C3', 'A2', 'F2', 'G2'],
    melody: `E5 - - - G5 - - - C6 - - - G5 - - - | A5 - - - E5 - - - C5 - - - E5 - - -
             F5 - - - A5 - - - C6 - - - A5 - - - | G5 - - - B5 - - - D6 - - - B5 - - -`,
    drums: null,
  },
  dia: {
    bpm: 122, lead: 'square', leadVol: 0.06, bass: 'pump', chords: ['C3', 'G2', 'A2', 'F2'],
    melody: `C5 . E5 . G5 . E5 . C5 . D5 . E5 - - . | D5 . B4 . G4 . B4 . D5 . E5 . D5 - - .
             C5 . E5 . A5 . G5 . E5 . C5 . E5 - - . | F5 . E5 . D5 . C5 . A4 . C5 . C5 - - .`,
    drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  },
  escola: {
    bpm: 132, lead: 'square', leadVol: 0.06, bass: 'octave', chords: ['F2', 'C3', 'D3', 'A#2'],
    melody: `F5 . A5 . C6 . A5 . F5 . . . C5 . . . | E5 . G5 . C6 . G5 . E5 . . . C5 . . .
             D5 . F5 . A5 . F5 . D5 . E5 . F5 . G5 . | A5 - - . G5 - - . F5 - - . . . . .`,
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  entardecer: {
    bpm: 96, lead: 'triangle', leadVol: 0.1, bass: 'octave', chords: ['D2', 'A#1', 'F2', 'C2'],
    melody: `A4 - - - D5 - - - F5 - - - E5 - D5 - | D5 - - - A#4 - - - A4 - - - G4 - - -
             A4 - - - C5 - - - F5 - - - A5 - G5 - | F5 - - - E5 - - - C5 - - - . . . .`,
    drums: { k: 'x.........x.....', s: '....x.......x...', h: 'x...x...x...x...' },
  },
  // São Paulo: lo-fi com garoa
  sp: {
    bpm: 86, lead: 'sine', leadVol: 0.12, bass: 'long', chords: ['A2', 'D2', 'G2', 'C3'], pad: true,
    melody: `E5 - . C5 - . A4 - . . . . G4 . A4 . | F5 - . D5 - . A4 - . . . . C5 . D5 .
             D5 - . B4 - . G4 - . . . . F4 . G4 . | E5 - - - . . G4 . C5 - - - . . . .`,
    drums: { k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  },
  // Rio: bossa/samba com agogô e tamborim
  rio: {
    bpm: 104, lead: 'triangle', leadVol: 0.1, bass: 'bossa', chords: ['G2', 'E2', 'A2', 'D2'],
    melody: `B4 . D5 . G5 - - . F#5 . E5 . D5 - - . | E5 . G5 . B5 - - . A5 . G5 . E5 - - .
             C5 . E5 . A5 - - . G5 . E5 . C5 - - . | D5 . F#5 . A5 . C6 . B5 - - - A5 - - .`,
    drums: { k: '....x.......x...', s: '', h: 'x.xx.x.xx.x.x.x.', a: 'a.b.a.b..a.b.a..' },
  },
  // Bahia: axé/ijexá com agogô
  bahia: {
    bpm: 126, lead: 'square', leadVol: 0.06, bass: 'pump', chords: ['D2', 'G2', 'A2', 'D2'],
    melody: `F#5 . A5 . F#5 . D5 . E5 . F#5 . E5 - D5 . | B4 . D5 . G5 . F#5 . E5 . D5 . B4 - - .
             A4 . C#5 . E5 . A5 . G5 . F#5 . E5 - - . | F#5 . E5 . D5 . A4 . D5 - - - . . . .`,
    drums: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: '', a: 'a.b.a..ba.b.a...' },
  },
  // Praia: reggae de boa
  praia: {
    bpm: 82, lead: 'triangle', leadVol: 0.1, bass: 'reggae', chords: ['F2', 'A#2', 'C3', 'F2'], skank: true,
    melody: `C5 - - - A4 - - - C5 - D5 - C5 - - - | D5 - - - F5 - - - D5 - C5 - A#4 - - -
             G4 - - - C5 - - - E5 - D5 - C5 - - - | A4 - - - G4 - - - F4 - - - . . . .`,
    drums: { k: '........x.......', s: '........x.......', h: '..x...x...x...x.' },
  },
  noite: {
    bpm: 150, lead: 'square', leadVol: 0.06, bass: 'pump', chords: ['E2', 'C2', 'D2', 'B1'],
    melody: `E5 . G5 . B5 . G5 . E5 . G5 . B5 . E6 . | C6 . B5 . G5 . E5 . C5 . E5 . G5 . C6 .
             D6 . A5 . F#5 . D5 . A5 . F#5 . D5 . A4 . | B4 . D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 .`,
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  },
  // Chefão final: Lula & Flávio
  chefao: {
    bpm: 165, lead: 'square', leadVol: 0.07, bass: 'pump', chords: ['E2', 'C2', 'D2', 'B1'],
    melody: `E5 E5 . E5 G5 . E5 . B5 - A5 - G5 - F#5 - | E5 E5 . E5 G5 . E5 . C6 - B5 - A5 - G5 -
             D5 D5 . D5 F#5 . D5 . A5 - G5 - F#5 - E5 - | B4 . D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 .`,
    drums: { k: 'x...x..xx...x...', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx' },
  },
  // ---- Ritmos regionais (fases dos estados) ----
  // Forró (Nordeste): zabumba, triângulo e sanfona
  forro: {
    bpm: 124, lead: 'sawtooth', leadVol: 0.045, bass: 'baiao', chords: ['G2', 'A2', 'D2', 'G2'],
    melody: `G4 . B4 . D5 . F5 - E5 . D5 . B4 . G4 . | A4 . C5 . E5 . G5 - F5 . E5 . C5 . A4 .
             D5 . F5 . A5 . G5 - F5 . E5 . D5 . C5 . | B4 . D5 . G5 . F5 . D5 . B4 . G4 - - .`,
    drums: { k: 'x..x....x..x....', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx' },
  },
  // Vanerão (Sul): gaita ligeira
  gaucho: {
    bpm: 132, lead: 'sawtooth', leadVol: 0.045, bass: 'pump', chords: ['D2', 'A2', 'D2', 'A2'],
    melody: `D5 . F#5 . A5 . F#5 . D5 . F#5 . A5 . D6 . | C#6 . A5 . E5 . A5 . C#6 . B5 . A5 . G5 .
             F#5 . A5 . D6 . A5 . F#5 . E5 . D5 . F#5 . | E5 . G5 . C#6 . B5 . A5 - - . . . . .`,
    drums: { k: 'x...x...x...x...', s: '..x...x...x...x.', h: '' },
  },
  // Carimbó (Norte): curimbó e maracá
  carimbo: {
    bpm: 112, lead: 'triangle', leadVol: 0.1, bass: 'bossa', chords: ['A2', 'C3', 'F2', 'E2'],
    melody: `A4 . C5 . E5 - D5 . C5 . A4 . G4 - A4 . | C5 . E5 . G5 - F5 . E5 . C5 . D5 - E5 .
             F5 . E5 . D5 - C5 . D5 . E5 . G5 - E5 . | D5 . C5 . B4 - A4 . G4 . A4 - - - . .`,
    drums: { k: 'x..x..x.x..x..x.', s: '', h: 'x.x.x.x.x.x.x.x.', a: 'a...b...a...b...' },
  },
  // Sertanejo (Centro-Oeste e Minas): viola caipira
  sertanejo: {
    bpm: 96, lead: 'triangle', leadVol: 0.1, bass: 'long', chords: ['E2', 'A2', 'B1', 'E2'],
    melody: `E5 - G#5 - B5 - G#5 - E5 - F#5 - G#5 - - - | A5 - G#5 - F#5 - E5 - C#5 - E5 - F#5 - - -
             B4 - D#5 - F#5 - B5 - A5 - G#5 - F#5 - - - | G#5 - F#5 - E5 - - - B4 - E5 - - - - -`,
    drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  vitoria: {
    bpm: 120, lead: 'square', leadVol: 0.08, bass: 'octave', chords: ['C3', 'F2', 'C3', 'G2'],
    melody: `C5 . C5 . C5 . G5 - - - . . E5 . G5 . | C6 - - - - - . . A5 . G5 . F5 . G5 .
             E5 - - - C5 - - - D5 . E5 . F5 . D5 . | C5 - - - G4 - - - C5 - - - . . . .`,
    drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  },
  gameover: {
    bpm: 72, lead: 'triangle', leadVol: 0.12, bass: 'long', chords: ['E2', 'E2'], loop: false,
    melody: `E5 - - - D#5 - - - D5 - - - C#5 - - - | C5 - - - - - - - - - - - . . . .`,
    drums: null,
  },
};

// ---------------------------------------------------------------- Sequenciador

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function noteFreq(name) {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return null;
  const midi = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Transforma a melodia em lista de { step, freq, len }
function parseMelody(text) {
  const tokens = text.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
  const notes = [];
  tokens.forEach((t, i) => {
    if (t === '-') { if (notes.length && notes[notes.length - 1].open) notes[notes.length - 1].len++; return; }
    if (notes.length) notes[notes.length - 1].open = false;
    if (t === '.') return;
    notes.push({ step: i, freq: noteFreq(t), len: 1, open: true });
  });
  return { notes, steps: tokens.length };
}

const Music = {
  wanted: null,   // música que deveria estar tocando
  playing: null,  // música tocando de fato
  timer: null,

  play(name) {
    this.wanted = name;
    if (this.playing === name) return;
    this.stopNow();
    this.resume();
  },

  stop() { this.wanted = null; this.stopNow(); },

  stopNow() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing = null;
    if (this.bus) {
      // corta o que ainda estava agendado
      const old = this.bus;
      old.gain.setTargetAtTime(0, Sfx.ctx.currentTime, 0.05);
      setTimeout(() => old.disconnect(), 400);
      this.bus = null;
    }
  },

  // Chamado quando o áudio é liberado (primeira tecla/toque) ou ao trocar de música
  resume() {
    if (!this.wanted || this.playing || !Sfx.ctx) return;
    const song = SONGS[this.wanted];
    if (!song) return;
    const ctx = Sfx.ctx;
    this.playing = this.wanted;
    this.song = song;
    this.mel = parseMelody(song.melody);
    this.stepDur = 60 / song.bpm / 4;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    this.bus = ctx.createGain();
    this.bus.connect(Sfx.musicGain);
    this.timer = setInterval(() => this.schedule(), 25);
  },

  schedule() {
    const ctx = Sfx.ctx;
    const song = this.song;
    const total = this.mel.steps;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const s = this.step % total;
      if (!song.loop && song.loop !== undefined && this.step >= total) { this.stopNow(); return; }
      this.playStep(s, this.nextTime);
      this.nextTime += this.stepDur;
      this.step++;
    }
  },

  playStep(s, t) {
    const song = this.song;
    const bar = Math.floor(s / 16);
    const inBar = s % 16;
    const root = noteFreq(song.chords[bar % song.chords.length]);

    // melodia
    for (const n of this.mel.notes) {
      if (n.step === s) this.voice(n.freq, t, n.len * this.stepDur * 0.95, song.lead, song.leadVol);
    }
    // baixo
    const bassAt = {
      octave: { 0: 1, 2: 2, 4: 1, 6: 2, 8: 1, 10: 2, 12: 1, 14: 2 },
      pump: { 0: 1, 2: 1, 4: 1, 6: 1, 8: 1, 10: 1, 12: 1, 14: 1 },
      long: { 0: 1, 8: 1.5 },
      bossa: { 0: 1, 6: 1.5, 8: 1, 14: 1.5 },
      reggae: { 0: 1, 3: 1, 10: 1.5 },
      baiao: { 0: 1, 3: 1, 8: 1.5, 11: 1 },
    }[song.bass] || {};
    if (bassAt[inBar]) {
      const len = song.bass === 'long' ? 7 : 2;
      this.voice(root * bassAt[inBar], t, this.stepDur * len, 'triangle', 0.16);
    }
    // acordes "skank" do reggae / pad do lo-fi
    if (song.skank && (inBar === 4 || inBar === 12)) {
      [1, 1.26, 1.5].forEach((m) => this.voice(root * 4 * m, t, this.stepDur * 1.2, 'square', 0.025));
    }
    if (song.pad && inBar === 0) {
      [1, 1.19, 1.5, 1.78].forEach((m) => this.voice(root * 2 * m, t, this.stepDur * 15, 'sine', 0.025));
    }
    // bateria
    const d = song.drums;
    if (d) {
      if (d.k && d.k[inBar] === 'x') this.kick(t);
      if (d.s && d.s[inBar] === 'x') this.snare(t);
      if (d.h && d.h[inBar] === 'x') this.hat(t);
      if (d.a && d.a[inBar] === 'a') this.agogo(t, 880);
      if (d.a && d.a[inBar] === 'b') this.agogo(t, 660);
    }
  },

  voice(freq, t, dur, type, vol) {
    if (!freq) return;
    const ctx = Sfx.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t); o.stop(t + dur + 0.02);
  },

  kick(t) {
    const ctx = Sfx.ctx;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(this.bus); o.start(t); o.stop(t + 0.16);
  },

  noiseHit(t, dur, vol, filterType, freq) {
    const ctx = Sfx.ctx;
    const src = ctx.createBufferSource(); src.buffer = Sfx.noise;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  },

  snare(t) { this.noiseHit(t, 0.14, 0.18, 'bandpass', 1800); },
  hat(t) { this.noiseHit(t, 0.04, 0.07, 'highpass', 7000); },
  agogo(t, f) { this.voice(f, t, 0.08, 'square', 0.04); this.voice(f * 1.5, t, 0.05, 'sine', 0.03); },
};
