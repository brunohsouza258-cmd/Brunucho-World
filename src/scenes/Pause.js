// Pausa: funciona com teclado (setas + ENTER, ou os atalhos), toque e controle.
class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  create() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x000000, 0.6);
    this.add.text(WIDTH / 2, 90, 'PAUSADO', textStyle(56, '#ffd23f')).setOrigin(0.5);
    const a = Achievements.progress();
    this.add.text(WIDTH / 2, 145, `🏆 Conquistas: ${a.done}/${a.total}`, textStyle(18, '#ffe9a0')).setOrigin(0.5);

    const game = this.scene.get('Game');
    this.items = [
      { label: 'CONTINUAR  (ESC)', act: () => { this.scene.resume('Game'); this.scene.stop(); } },
      { label: 'REINICIAR FASE  (R)', act: () => { this.scene.stop(); game.restartLevel(); } },
      { label: 'OPÇÕES  (O)', act: () => { this.scene.pause(); this.scene.launch('Options', { from: 'Pause' }); } },
      { label: 'MENU  (Q)', act: () => { this.scene.stop('Game'); this.scene.start('Menu'); } },
    ];
    this.sel = 0;
    this.texts = this.items.map((it, i) => {
      const y = 215 + i * 62;
      const bg = this.add.rectangle(WIDTH / 2, y, 380, 50, 0x1b1b2a, 0.9).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
      const t = this.add.text(WIDTH / 2, y, IS_TOUCH ? it.label.replace(/\s*\(.\)\s*$|\s*\(ESC\)\s*$/, '') : it.label, textStyle(24)).setOrigin(0.5);
      bg.on('pointerover', () => { this.sel = i; this.refresh(); });
      bg.on('pointerdown', () => { this.sel = i; this.refresh(); it.act(); });
      return { bg, t };
    });
    this.refresh();

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-ENTER', () => this.items[this.sel].act());
    kb.on('keydown-SPACE', () => this.items[this.sel].act());
    kb.on('keydown-ESC', () => this.items[0].act());
    kb.on('keydown-P', () => this.items[0].act());
    kb.on('keydown-BACKSPACE', () => this.items[0].act());
    kb.on('keydown-R', () => this.items[1].act());
    kb.on('keydown-O', () => this.items[2].act());
    kb.on('keydown-Q', () => this.items[3].act());
  }

  move(d) {
    this.sel = (this.sel + d + this.items.length) % this.items.length;
    Sfx.tone(520, 0.05, { vol: 0.05 });
    this.refresh();
  }

  refresh() {
    this.texts.forEach(({ bg, t }, i) => {
      const on = i === this.sel;
      bg.setStrokeStyle(on ? 4 : 2, on ? 0xffd23f : 0xffffff);
      t.setColor(on ? '#ffd23f' : '#ffffff');
    });
  }
}
