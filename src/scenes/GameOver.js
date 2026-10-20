// Acabaram as vidas: a Andreia te achou...
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    this.data_ = data;
    Music.play('gameover');
    Sfx.voice('gameover');
    Achievements.unlock('gameover');
    Progress.clearRun();
    this.cameras.main.fadeIn(500);

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x1a0b14);
    this.add.text(WIDTH / 2, 70, 'GAME OVER', { ...textStyle(72, '#ff3b3b'), strokeThickness: 12 }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 136, 'A Andreia te achou...', textStyle(28, '#ff8ab3')).setOrigin(0.5);

    // A mãe batendo o chinelo na mão, e o Brunucho tremendo
    const mae = this.add.image(WIDTH / 2 + 80, 360, 'mae').setOrigin(0.5, 1).setScale(4).setFlipX(true);
    const bru = this.add.image(WIDTH / 2 - 90, 360, playerTexture()).setOrigin(0.5, 1).setScale(4);
    this.tweens.add({ targets: mae, angle: { from: -4, to: 4 }, duration: 220, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: bru, x: bru.x - 3, duration: 50, yoyo: true, repeat: -1 });
    this.add.text(mae.x, 190, '"Vai pro quarto AGORA!"', { ...textStyle(18), backgroundColor: '#ffffff', color: '#1b1b2a', padding: { x: 8, y: 4 } })
      .setOrigin(0.5).setStroke('#ffffff', 0);

    const st = data.stats || {};
    this.add.text(WIDTH / 2, 400, `Pontos: ${formatScore(st.score || 0)}   ·   Fase ${data.level + 1}: ${LEVELS[data.level].name}`, textStyle(20)).setOrigin(0.5);

    this.options = [
      { label: 'TENTAR DE NOVO (esta fase)', act: () => this.retry() },
      { label: 'VOLTAR AO MENU', act: () => this.toMenu() },
    ];
    this.sel = 0;
    this.texts = this.options.map((o, i) => {
      const t = this.add.text(WIDTH / 2, 452 + i * 38, o.label, textStyle(24)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.sel = i; this.confirm(); });
      return t;
    });
    this.refresh();

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => { this.sel = 0; this.refresh(); });
    kb.on('keydown-DOWN', () => { this.sel = 1; this.refresh(); });
    kb.on('keydown-W', () => { this.sel = 0; this.refresh(); });
    kb.on('keydown-S', () => { this.sel = 1; this.refresh(); });
    this.time.delayedCall(700, () => {
      kb.on('keydown-ENTER', () => this.confirm());
      kb.on('keydown-SPACE', () => this.confirm());
    });
  }

  refresh() {
    this.texts.forEach((t, i) => t.setColor(i === this.sel ? '#ffd23f' : '#ffffff').setScale(i === this.sel ? 1.1 : 1));
  }

  confirm() { Sfx.select(); this.options[this.sel].act(); }

  retry() {
    // Volta pro começo da fase com as vidas cheias (os pontos voltam ao início da fase)
    const s = { ...this.data_.startStats, lives: difficulty().lives };
    this.scene.start('Game', { level: this.data_.level, stats: s });
  }

  toMenu() { this.scene.start('Menu'); }
}
