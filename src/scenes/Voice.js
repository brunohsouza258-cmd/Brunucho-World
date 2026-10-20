// Tela "Minha voz": grave (ou importe um arquivo de) cada fala do jogo. Abre por cima das Opções.
//   ↑↓ escolher a fala · ENTER gravar/parar · P ouvir · I importar arquivo · X apagar · ESC voltar
class VoiceScene extends Phaser.Scene {
  constructor() { super('Voice'); }

  create() {
    this.sel = 0;
    this.rec = null;       // gravação em andamento
    this.busy = false;     // processando uma gravação
    this.dead = false;     // a tela já fechou (descarta o que ainda estava pendente)

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0b0b14, 1);
    this.add.text(WIDTH / 2, 36, '🎤 MINHA VOZ', { ...textStyle(40, '#ffd23f'), strokeThickness: 7 }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 76, 'Grave a sua voz em cada fala. Onde você não gravar, o jogo usa a voz do computador.', textStyle(15)).setOrigin(0.5).setAlpha(0.9);

    const BTN = [
      { txt: '●', color: '#ff5555', tip: 'gravar', act: (i) => this.toggleRecord(i) },
      { txt: '▶', color: '#8aff8a', tip: 'ouvir', act: (i) => this.listen(i) },
      { txt: '📁', color: '#ffffff', tip: 'arquivo', act: (i) => this.pickFile(i) },
      { txt: '✖', color: '#ffb0b0', tip: 'apagar', act: (i) => this.erase(i) },
    ];
    this.rows = VOICE_LINES.map((ln, i) => {
      const y = 118 + i * 42;
      const bg = this.add.rectangle(WIDTH / 2, y, 900, 36, 0x1b1b2a, 0.9).setStrokeStyle(2, 0x444455).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.sel = i; this.refresh(); });
      this.add.text(50, y, ln.label, textStyle(22)).setOrigin(0, 0.5);
      this.add.text(290, y, ln.when, textStyle(13, '#b5b5c8')).setOrigin(0, 0.5);
      const status = this.add.text(560, y, '', textStyle(15)).setOrigin(0, 0.5);
      BTN.forEach((b, k) => {
        const t = this.add.text(742 + k * 38, y, b.txt, { ...textStyle(20, b.color), backgroundColor: '#2b2b3a', padding: { x: 7, y: 3 } })
          .setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => { this.sel = i; this.refresh(); b.act(i); });
      });
      return { bg, status };
    });

    this.msg = this.add.text(WIDTH / 2, 462, '', { ...textStyle(18, '#ffe9a0'), align: 'center', wordWrap: { width: 880 } }).setOrigin(0.5);
    this.meterBg = this.add.rectangle(WIDTH / 2, 494, 420, 10, 0x2b2b3a).setStrokeStyle(1, 0x555566);
    this.meter = this.add.rectangle(WIDTH / 2 - 210, 494, 0, 8, 0x8aff8a).setOrigin(0, 0.5);
    this.add.text(WIDTH / 2, 520, '↑↓ escolher · ENTER gravar/parar · P ouvir · I importar arquivo · X apagar · ESC voltar', textStyle(13)).setOrigin(0.5).setAlpha(0.85);

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-ENTER', () => this.toggleRecord(this.sel));
    kb.on('keydown-SPACE', () => this.toggleRecord(this.sel));
    kb.on('keydown-P', () => this.listen(this.sel));
    kb.on('keydown-I', () => this.pickFile(this.sel));
    kb.on('keydown-X', () => this.erase(this.sel));
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-BACKSPACE', () => this.close());

    this.setMsg(Voices.count() ? `${Voices.count()} de ${VOICE_LINES.length} falas com a sua voz.` : 'Escolha uma fala e aperte ENTER para gravar (o navegador vai pedir o microfone).');
    this.refresh();
  }

  move(d) {
    if (this.rec || this.busy) return;
    this.sel = (this.sel + d + VOICE_LINES.length) % VOICE_LINES.length;
    Sfx.tone(520, 0.05, { vol: 0.05 });
    this.refresh();
  }

  refresh() {
    if (this.dead) return;
    this.rows.forEach((r, i) => {
      const id = VOICE_LINES[i].id, ln = VOICE_LINES[i];
      r.bg.setStrokeStyle(i === this.sel ? 4 : 2, i === this.sel ? 0xffd23f : 0x444455);
      if (Voices.has(id)) r.status.setText('✔ sua voz').setColor('#8aff8a');
      else if (ln.tts) r.status.setText('voz do computador').setColor('#b5b5c8');
      else r.status.setText('(só toca se você gravar)').setColor('#8a8aa0');
    });
  }

  setMsg(text, color = '#ffe9a0') { if (!this.dead) this.msg.setText(text).setColor(color); }
  setLevel(v) { if (!this.dead) this.meter.width = 416 * v; }

  // ---------------------------------------------------------------- gravar
  async toggleRecord(i) {
    if (this.busy) return;
    if (this.rec) { this.rec.ctl.stop(); return; }          // apertou de novo: para
    this.sel = i; this.refresh();
    const id = VOICE_LINES[i].id;
    try {
      this.setMsg('Liberando o microfone...');
      Sfx.unlock();
      if (window.speechSynthesis) speechSynthesis.cancel();
      const ctl = await Voices.startRecording((v) => this.setLevel(v));
      if (this.dead) { ctl.stop(); return; }
      this.rec = { id, ctl };
      if (Sfx.musicGain) Sfx.musicGain.gain.value = 0;      // a música não pode entrar na gravação
      this.setMsg(`🔴 GRAVANDO... diga "${VOICE_LINES[i].label}"  (ENTER para parar)`, '#ff6b6b');
      const auto = this.time.delayedCall(4000, () => ctl.stop());
      const blob = await ctl.done;
      auto.remove();
      this.rec = null;
      Sfx.applyVolumes();
      this.setLevel(0);
      if (this.dead) return;                                  // fechou a tela: descarta
      this.busy = true;
      this.setMsg('Processando...');
      const ok = await Voices.saveBlob(id, blob);
      this.busy = false;
      if (this.dead) return;
      if (ok) { this.setMsg('✔ Gravado! Ouvindo como vai ficar no jogo...', '#8aff8a'); Voices.play(id); }
      else this.setMsg('Não ouvi nada. Fale mais perto do microfone e tente de novo.', '#ff9a6b');
    } catch (e) {
      this.rec = null; this.busy = false;
      Sfx.applyVolumes(); this.setLevel(0);
      this.setMsg(e && e.name === 'NotAllowedError'
        ? 'O navegador bloqueou o microfone. Permita o acesso (ícone perto do endereço) e tente de novo.'
        : 'Não consegui usar o microfone neste aparelho. Tente "importar arquivo" (tecla I).', '#ff6b6b');
    }
    this.refresh();
  }

  // ---------------------------------------------------------------- ouvir / importar / apagar
  listen(i) {
    if (this.rec || this.busy) return;
    const id = VOICE_LINES[i].id;
    Sfx.unlock();
    if (!Settings.get('voices')) { this.setMsg('As vozes estão desligadas nas Opções.', '#ff9a6b'); return; }
    if (!Voices.has(id) && !VOICE_LINES[i].tts) { this.setMsg('Essa fala só toca com a sua voz. Aperte ENTER para gravar.', '#ff9a6b'); return; }
    this.setMsg(Voices.has(id) ? 'Tocando a sua voz...' : 'Tocando a voz do computador...');
    if (Voices.has(id)) Voices.play(id); else Sfx.voice(id);
  }

  pickFile(i) {
    if (this.rec || this.busy) return;
    const id = VOICE_LINES[i].id;
    Sfx.unlock();
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*,.mp3,.wav,.m4a,.ogg,.webm'; input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async () => {
      const f = input.files && input.files[0];
      input.remove();
      if (!f || this.dead) return;
      if (f.size > 4 * 1024 * 1024) { this.setMsg('Arquivo grande demais (máximo 4 MB). Use um áudio curtinho.', '#ff9a6b'); return; }
      this.busy = true; this.setMsg('Lendo o arquivo...');
      const ok = await Voices.saveBlob(id, f);
      this.busy = false;
      if (this.dead) return;
      if (ok) { this.setMsg('✔ Arquivo importado! Ouvindo...', '#8aff8a'); Voices.play(id); }
      else this.setMsg('Não consegui usar esse arquivo (silêncio ou formato que o navegador não lê).', '#ff6b6b');
      this.refresh();
    };
    input.click();
    setTimeout(() => input.parentNode && input.remove(), 120000);
  }

  async erase(i) {
    if (this.rec || this.busy) return;
    const id = VOICE_LINES[i].id;
    if (!Voices.has(id)) { this.setMsg('Essa fala já está sem gravação.'); return; }
    await Voices.remove(id);
    this.setMsg('Gravação apagada. O jogo volta a usar a voz do computador.');
    this.refresh();
  }

  close() {
    this.dead = true;
    if (this.rec) this.rec.ctl.stop();
    Sfx.applyVolumes();
    this.scene.stop();
    this.scene.resume('Options');
    const o = this.scene.get('Options');
    if (o && o.refresh) o.refresh();
  }
}
