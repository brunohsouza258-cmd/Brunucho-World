// Guarda-roupa: escolha a roupa do Brunucho.
//   ← → ↑ ↓ escolher · ENTER vestir · ESC voltar   (no celular: toque na roupa e depois em VESTIR)
class WardrobeScene extends Phaser.Scene {
  constructor() { super('Wardrobe'); }

  create() {
    this.sel = Math.max(0, OUTFIT_KEYS.indexOf(currentOutfit()));
    this.worn = currentOutfit();

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x0b0b14, 1);
    this.add.text(WIDTH / 2, 32, '👕 GUARDA-ROUPA', { ...textStyle(36, '#ffd23f'), strokeThickness: 7 }).setOrigin(0.5);

    // ---- vitrine (esquerda) ----
    this.add.rectangle(215, 286, 360, 340, 0x1b1b2a, 1).setStrokeStyle(3, 0xffd23f);
    this.nameText = this.add.text(215, 138, '', { ...textStyle(26, '#ffffff'), align: 'center', wordWrap: { width: 330 } }).setOrigin(0.5);
    this.descText = this.add.text(215, 166, '', { ...textStyle(16, '#cfd0e8'), align: 'center', wordWrap: { width: 320 }, lineSpacing: 4 }).setOrigin(0.5, 0);
    this.add.ellipse(215, 424, 170, 22, 0x000000, 0.4);
    this.preview = this.add.sprite(215, 424, `player_${OUTFIT_KEYS[this.sel]}`).setOrigin(0.5, 1).setScale(4);
    this.wearBtn = this.button(215, 474, '', () => this.wear());

    // ---- grade de roupas (direita) ----
    this.cards = OUTFIT_KEYS.map((key, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = 500 + col * 104, y = 188 + row * 150;
      const bg = this.add.rectangle(x, y, 96, 138, 0x1b1b2a, 1).setStrokeStyle(2, 0x444455).setInteractive({ useHandCursor: true });
      this.add.sprite(x, y + 30, `player_${key}`).setOrigin(0.5, 1).setScale(2);
      const label = this.add.text(x, y + 47, OUTFITS[key].name, { ...textStyle(13), align: 'center', wordWrap: { width: 90 } }).setOrigin(0.5, 0.5);
      let fs = parseInt(label.style.fontSize, 10);
      while ((label.height > 36 || label.width > 92) && fs > 9) label.setFontSize(--fs);      // nome comprido encolhe até caber no cartão
      const check = this.add.text(x - 40, y - 60, '✔', textStyle(18, '#8aff8a')).setOrigin(0, 0).setVisible(false);
      bg.on('pointerdown', () => { if (this.sel === i) this.wear(); else this.select(i); });
      return { bg, label, check };
    });

    this.button(WIDTH - 90, 500, '◀ VOLTAR', () => this.close(), 0x2b2b3a);
    if (!IS_TOUCH) this.add.text(WIDTH / 2 + 130, 504, '← → ↑ ↓ escolher · ENTER vestir · ESC voltar', textStyle(13)).setOrigin(0.5).setAlpha(0.85);

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.select(this.sel - 1));
    kb.on('keydown-A', () => this.select(this.sel - 1));
    kb.on('keydown-RIGHT', () => this.select(this.sel + 1));
    kb.on('keydown-D', () => this.select(this.sel + 1));
    kb.on('keydown-UP', () => this.select(this.sel - 5));
    kb.on('keydown-W', () => this.select(this.sel - 5));
    kb.on('keydown-DOWN', () => this.select(this.sel + 5));
    kb.on('keydown-S', () => this.select(this.sel + 5));
    kb.on('keydown-ENTER', () => this.wear());
    kb.on('keydown-SPACE', () => this.wear());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-BACKSPACE', () => this.close());
    kb.on('keydown-C', () => this.select((this.sel + 1) % OUTFIT_KEYS.length));

    this.select(this.sel, true);
  }

  button(x, y, label, fn, color = 0xffd23f) {
    const t = this.add.text(x, y, label, { ...textStyle(22, color === 0xffd23f ? '#1b1b2a' : '#ffffff'),
      backgroundColor: color === 0xffd23f ? '#ffd23f' : '#2b2b3a', padding: { x: 14, y: 6 }, strokeThickness: 0 })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => this.time.delayedCall(1, fn));
    return t;
  }

  select(i, silent = false) {
    if (i < 0 || i >= OUTFIT_KEYS.length) return;
    this.sel = i;
    const key = OUTFIT_KEYS[i], o = OUTFITS[key];
    this.preview.play(`player_${key}_walk`);
    this.nameText.setText(o.name);
    this.descText.setText(o.desc);
    this.wearBtn.setText(key === this.worn ? '✔ VESTINDO' : 'VESTIR');
    this.cards.forEach((c, k) => {
      c.bg.setStrokeStyle(k === i ? 4 : 2, k === i ? 0xffd23f : 0x444455);
      c.check.setVisible(OUTFIT_KEYS[k] === this.worn);
    });
    if (!silent) Sfx.tone(520, 0.05, { vol: 0.05 });
  }

  wear() {
    const key = OUTFIT_KEYS[this.sel];
    Sfx.unlock(); Sfx.select();
    Storage.set('pp_outfit', key);
    this.worn = key;
    const used = new Set(Storage.get('pp_outfits_used', []));
    used.add(key);
    Storage.set('pp_outfits_used', [...used]);
    Achievements.unlock('roupa');
    if (OUTFIT_KEYS.every((k) => used.has(k))) Achievements.unlock('closet');
    this.select(this.sel, true);
    this.time.delayedCall(450, () => this.close());     // volta pro menu já com a roupa nova
  }

  close() {
    this.scene.stop();
    this.scene.resume('Menu');
    const m = this.scene.get('Menu');
    if (m && m.onOptionsClosed) m.onOptionsClosed();
  }
}
