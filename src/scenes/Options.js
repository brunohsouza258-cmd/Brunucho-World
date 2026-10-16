// Tela de Opções. Abre por cima do Menu ou da Pausa e, ao fechar, volta para quem abriu.
class OptionsScene extends Phaser.Scene {
  constructor() { super('Options'); }

  create(data) {
    this.from = data.from || 'Menu';
    this.sel = 0;
    this.confirmReset = false;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0b0b14, 0.88);
    this.add.text(WIDTH / 2, 50, 'OPÇÕES', { ...textStyle(44, '#ffd23f'), strokeThickness: 8 }).setOrigin(0.5);

    const pct = (v) => `${Math.round(v * 100)}%`;
    const bar = (v) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));
    const step = (key, d) => Settings.set(key, Phaser.Math.Clamp(Math.round((Settings.get(key) + d) * 10) / 10, 0, 1));
    // tocar/ENTER no volume sobe 10% e, passando de 100%, volta pro 0 (bom pro celular)
    const cycle = (key) => Settings.set(key, Settings.get(key) >= 1 ? 0 : Math.round((Settings.get(key) + 0.1) * 10) / 10);
    const cycleDiff = (d) => {
      const i = DIFFICULTY_KEYS.indexOf(Settings.get('difficulty'));
      Settings.set('difficulty', DIFFICULTY_KEYS[(i + d + DIFFICULTY_KEYS.length) % DIFFICULTY_KEYS.length]);
    };

    this.items = [
      { label: () => `Música   ${bar(Settings.get('music'))}  ${pct(Settings.get('music'))}`,
        side: (d) => step('music', d / 10), act: () => cycle('music') },
      { label: () => `Efeitos  ${bar(Settings.get('sfx'))}  ${pct(Settings.get('sfx'))}`,
        side: (d) => { step('sfx', d / 10); Sfx.coin(); }, act: () => { cycle('sfx'); Sfx.coin(); } },
      { label: () => `Vozes ("six seven!", "moggado!"): ${Settings.get('voices') ? 'LIGADAS' : 'DESLIGADAS'}`,
        side: () => this.toggle('voices'), act: () => { this.toggle('voices'); Sfx.say('six seven!', { lang: 'en-US' }); } },
      { label: () => `Tremer a tela: ${Settings.get('shake') ? 'SIM' : 'NÃO'}`,
        side: () => this.toggle('shake'), act: () => this.toggle('shake') },
      { label: () => `Dificuldade: ${difficulty().name}  (${difficulty().lives} vidas)`,
        side: (d) => cycleDiff(d), act: () => cycleDiff(1) },
      { label: () => `Tela cheia: ${this.scale.isFullscreen ? 'SIM' : 'NÃO'}`,
        side: () => this.toggleFullscreen(), act: () => this.toggleFullscreen() },
      { label: () => `Todas as fases liberadas: ${Settings.get('allLevels') ? 'SIM' : 'NÃO'}`,
        side: () => this.toggle('allLevels'), act: () => this.toggle('allLevels') },
      { label: () => (this.confirmReset ? 'TEM CERTEZA? Aperte de novo para APAGAR TUDO' : 'Apagar progresso, conquistas e ranking'),
        act: () => this.resetProgress(), danger: true },
      { label: () => 'VOLTAR', act: () => this.close() },
    ];

    this.texts = this.items.map((it, i) => {
      const t = this.add.text(WIDTH / 2, 112 + i * 43, '', textStyle(22)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.sel = i; this.refresh(); });
      t.on('pointerdown', () => { this.sel = i; this.activate(); });
      return t;
    });
    this.add.text(WIDTH / 2, 505, '↑↓ escolher  ·  ←→ ajustar  ·  ENTER mudar  ·  ESC voltar', textStyle(16)).setOrigin(0.5).setAlpha(0.85);

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.side(-1));
    kb.on('keydown-A', () => this.side(-1));
    kb.on('keydown-RIGHT', () => this.side(1));
    kb.on('keydown-D', () => this.side(1));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-BACKSPACE', () => this.close());
    this.refresh();
  }

  toggle(key) { Settings.set(key, !Settings.get(key)); }

  toggleFullscreen() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
    this.time.delayedCall(300, () => this.refresh());
  }

  move(d) {
    this.sel = (this.sel + d + this.items.length) % this.items.length;
    this.confirmReset = false;
    Sfx.tone(520, 0.05, { vol: 0.05 });
    this.refresh();
  }

  side(d) { const it = this.items[this.sel]; if (it.side) { it.side(d); this.refresh(); } }

  activate() { this.items[this.sel].act(); Sfx.select(); this.refresh(); }

  resetProgress() {
    if (!this.confirmReset) { this.confirmReset = true; return; }
    Progress.reset();
    this.confirmReset = false;
    this.items[this.sel].label = () => 'Progresso apagado!';
  }

  refresh() {
    this.texts.forEach((t, i) => {
      const sel = i === this.sel;
      const it = this.items[i];
      t.setText((sel ? '▶ ' : '') + it.label() + (sel ? ' ◀' : ''));
      t.setColor(sel ? (it.danger ? '#ff6b6b' : '#ffd23f') : '#ffffff');
    });
  }

  close() {
    this.scene.stop();
    this.scene.resume(this.from);
    const from = this.scene.get(this.from);
    if (from && from.onOptionsClosed) from.onOptionsClosed();
  }
}
