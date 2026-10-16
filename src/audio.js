// Efeitos sonoros sintetizados na hora com a Web Audio API (não precisa de arquivos de som).
// Tudo passa por: efeitos → sfxGain ┐
//                 música  → musicGain ┴→ master → caixa de som

const Sfx = {
  ctx: null,
  muted: Storage.get('pp_muted', false),

  // Navegadores só liberam áudio depois de uma interação do usuário.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.musicGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      // ruído branco (usado na bateria da música)
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (typeof Music !== 'undefined') Music.resume();
  },

  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.muted ? 0 : 1;
    this.sfxGain.gain.value = Settings.get('sfx');
    this.musicGain.gain.value = Settings.get('music');
  },

  toggle() {
    this.muted = !this.muted;
    Storage.set('pp_muted', this.muted);
    this.applyVolumes();
    return this.muted;
  },

  tone(freq, dur, { type = 'square', to = null, vol = 0.1, delay = 0, out = null } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(out || this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  // Voz do navegador falando ("six seven!", "moggado!"). Liga/desliga nas Opções.
  say(text, { lang = 'pt-BR', rate = 1.15, pitch = 1.2 } = {}) {
    if (this.muted || !Settings.get('voices') || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = Math.min(1, Settings.get('sfx') + 0.2);
      const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.replace('_', '-').startsWith(lang.slice(0, 2)));
      if (voice) u.voice = voice;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz, sem problema */ }
  },

  jump()       { this.tone(320, 0.15, { to: 640, vol: 0.07 }); },
  doubleJump() { this.tone(480, 0.15, { to: 960, vol: 0.07 }); this.tone(720, 0.1, { vol: 0.04, delay: 0.05 }); },
  coin()       { this.tone(988, 0.08, { vol: 0.07 }); this.tone(1319, 0.18, { vol: 0.07, delay: 0.07 }); },
  stomp()      { this.tone(220, 0.15, { type: 'triangle', to: 70, vol: 0.25 }); },
  die()        { this.tone(440, 0.5, { type: 'sawtooth', to: 55, vol: 0.1 }); },
  checkpoint() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, { vol: 0.07, delay: i * 0.08 })); },
  win()        { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { vol: 0.08, delay: i * 0.12 })); },
  select()     { this.tone(660, 0.1, { vol: 0.07 }); },
  life()       { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.1, delay: i * 0.07 })); },
  achievement() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.09, delay: i * 0.09 })); },
  // "six... SEVEN!" em duas notas, depois um brilho
  sixSeven()   { this.tone(392, 0.18, { vol: 0.1 }); this.tone(587, 0.3, { vol: 0.1, delay: 0.2 });
                 [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.1, { vol: 0.05, delay: 0.5 + i * 0.05 })); },
  aura()       { [523, 784, 1047, 1568, 2093].forEach((f, i) => this.tone(f, 0.35, { type: 'sine', vol: 0.08, delay: i * 0.06 })); },
  auraBreak()  { this.tone(1200, 0.4, { type: 'sine', to: 200, vol: 0.12 }); },
  powerUp()    { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.1, { vol: 0.07, delay: i * 0.05 })); },
};

window.addEventListener('keydown', () => Sfx.unlock());
window.addEventListener('pointerdown', () => Sfx.unlock());
