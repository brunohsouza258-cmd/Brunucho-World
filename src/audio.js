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
      Voices.load();   // carrega as vozes gravadas pelo jogador
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

  // Fala do jogo: usa a SUA voz gravada (Opções → Gravar minha voz) e, se não tiver, a voz do computador.
  voice(id) {
    if (this.muted || !Settings.get('voices')) return;
    if (Settings.get('myVoice') && Voices.play(id)) return;
    const line = VOICE_LINES.find((l) => l.id === id);
    if (line && line.tts) this.say(line.tts[0], line.tts[1]);
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

// ---------------------------------------------------------------- Minha voz
// As falas do jogo. "tts" é a voz do computador (usada quando não tem gravação); null = só toca se você gravar.
const VOICE_LINES = [
  { id: 'sixseven', label: 'Six seven!', when: 'ao pegar o poder 67', tts: ['six seven!', { lang: 'en-US', rate: 1.1, pitch: 1.4 }] },
  { id: 'moggado', label: 'Moggado!', when: 'ao derrotar um inimigo', tts: ['moggado!', { rate: 1.3, pitch: 1.3 }] },
  { id: 'moggados', label: 'Moggados!', when: 'ao vencer o chefão', tts: ['moggados!', { rate: 1.1, pitch: 1.2 }] },
  { id: 'olhar', label: 'Olhar de mil jardas', when: 'ao parar o tempo', tts: ['olhar de mil jardas', { rate: 0.8, pitch: 0.7 }] },
  { id: 'anjo', label: 'Anjo caído', when: 'ao pegar as asas', tts: ['anjo caído', { rate: 1, pitch: 0.9 }] },
  { id: 'churros', label: 'Churros!', when: 'ao pegar o churros', tts: ['churros!', { rate: 1.1, pitch: 1.1 }] },
  { id: 'aura', label: 'Aura!', when: 'ao pegar o escudo de aura', tts: null },
  { id: 'gameover', label: 'Ai, mãe!', when: 'quando acabam as vidas', tts: null },
];

// Guarda as gravações no navegador (IndexedDB), junto com o resto do jogo.
const VoiceStore = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve) => {
      try {
        const r = indexedDB.open('super_brunucho', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('voz');
        r.onsuccess = () => { this._db = r.result; resolve(r.result); };
        r.onerror = () => resolve(null);
        r.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  },
  async run(mode, fn) {
    const db = await this.open();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('voz', mode);
        const req = fn(tx.objectStore('voz'));
        tx.oncomplete = () => resolve(req && req.result !== undefined ? req.result : true);
        tx.onerror = () => resolve(null);
        tx.onabort = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  },
  get(id) { return this.run('readonly', (st) => st.get(id)); },
  set(id, buf) { return this.run('readwrite', (st) => st.put(buf, id)); },
  del(id) { return this.run('readwrite', (st) => st.delete(id)); },
  keys() { return this.run('readonly', (st) => st.getAllKeys()); },
};

// WAV de 16 bits (mono) a partir de amostras decimais
function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

const Voices = {
  buffers: {},   // id → AudioBuffer pronto pra tocar
  plays: 0,      // quantas vezes uma voz gravada tocou (usado nos testes)

  has(id) { return !!this.buffers[id]; },
  count() { return Object.keys(this.buffers).length; },

  async load() {
    const keys = await VoiceStore.keys();
    if (!keys || !Sfx.ctx) return;
    for (const id of keys) {
      const raw = await VoiceStore.get(id);
      if (!raw || raw === true) continue;
      try { this.buffers[id] = await Sfx.ctx.decodeAudioData(raw.slice(0)); } catch (e) { /* gravação estragada: ignora */ }
    }
  },

  play(id) {
    const b = this.buffers[id];
    if (!b || !Sfx.ctx) return false;
    const src = Sfx.ctx.createBufferSource();
    const gain = Sfx.ctx.createGain();
    src.buffer = b; gain.gain.value = 1.4;
    src.connect(gain).connect(Sfx.sfxGain);
    src.start();
    this.plays++;
    return true;
  },

  // Recebe a gravação (ou um arquivo), corta o silêncio do começo e do fim, normaliza o volume e guarda.
  // Devolve false se não deu pra aproveitar (silêncio, arquivo ruim).
  async saveBlob(id, blob) {
    if (!Sfx.ctx) return false;
    let audio;
    try { audio = await Sfx.ctx.decodeAudioData(await blob.arrayBuffer()); } catch (e) { return false; }
    const rate = audio.sampleRate, n = audio.length, chans = audio.numberOfChannels;
    const mono = new Float32Array(n);
    for (let c = 0; c < chans; c++) { const d = audio.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / chans; }
    let a = 0, b = n - 1;
    while (a < n && Math.abs(mono[a]) < 0.02) a++;
    while (b > a && Math.abs(mono[b]) < 0.02) b--;
    if (b - a < rate * 0.12) return false;                       // só silêncio
    const pad = Math.floor(rate * 0.05);
    a = Math.max(0, a - pad); b = Math.min(n - 1, b + pad);
    const seg = mono.slice(a, Math.min(b + 1, a + Math.floor(rate * 6)));   // no máximo 6 segundos
    let peak = 0;
    for (const v of seg) peak = Math.max(peak, Math.abs(v));
    if (peak < 0.005) return false;
    const gain = 0.9 / peak;
    for (let i = 0; i < seg.length; i++) seg[i] *= gain;
    const fade = Math.min(seg.length, Math.floor(rate * 0.02));    // pontinha final suave, sem estalo
    for (let i = 0; i < fade; i++) seg[seg.length - 1 - i] *= i / fade;
    const wav = encodeWav(seg, rate);
    await VoiceStore.set(id, wav);
    this.buffers[id] = await Sfx.ctx.decodeAudioData(wav.slice(0));
    Achievements.unlock('dublador');
    return true;
  },

  async remove(id) { delete this.buffers[id]; await VoiceStore.del(id); },

  // Começa a gravar com o microfone. Devolve { stop(), done: Promise<Blob> }; onLevel(0..1) alimenta o medidor.
  async startRecording(onLevel) {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('sem-suporte');
    Sfx.unlock();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const rec = new MediaRecorder(stream);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const src = Sfx.ctx.createMediaStreamSource(stream);
    const an = Sfx.ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    const meter = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
      if (onLevel) onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
    }, 50);
    const done = new Promise((resolve) => {
      rec.onstop = () => {
        clearInterval(meter); src.disconnect(); stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: rec.mimeType }));
      };
    });
    rec.start();
    return { stop: () => { if (rec.state !== 'inactive') rec.stop(); }, done };
  },
};
