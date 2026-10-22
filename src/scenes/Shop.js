// Dentro de uma loja do Centro de Cotia.   ↑↓ escolher · ENTER comprar · ESC sair   (celular: toque em COMPRAR)
class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  create(data) {
    this.shop = SHOPS.find((s) => s.id === data.shop);
    this.items = this.shop.items.map((it) => Shop.fill(it));
    this.sel = 0;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x0b0b14, 1);
    this.add.rectangle(WIDTH / 2, 44, VIEW_W, 88, this.shop.wall, 0.22);
    this.add.rectangle(WIDTH / 2, 88, VIEW_W, 3, this.shop.trim, 1);
    this.add.text(WIDTH / 2, 34, `${this.shop.icon}  ${this.shop.name}`, { ...textStyle(36, '#ffd23f'), strokeThickness: 7 }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 70, `“${this.shop.greet}”`, textStyle(16, '#ffe9a0')).setOrigin(0.5);

    this.walletText = this.add.text(WIDTH - 24, 120, '', textStyle(26, '#ffe9a0')).setOrigin(1, 0.5);
    this.add.text(24, 120, 'Escolha o que levar:', textStyle(16, '#b5b5c8')).setOrigin(0, 0.5);

    this.rows = this.items.map((it, i) => {
      const y = 170 + i * 84;
      const bg = this.add.rectangle(WIDTH / 2, y, 900, 76, 0x1b1b2a, 0.95).setStrokeStyle(2, 0x444455).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.sel = i; this.refresh(); });
      this.add.text(66, y, it.icon, { fontSize: '36px' }).setOrigin(0.5);
      this.add.text(112, y - 18, it.name, textStyle(22)).setOrigin(0, 0.5);
      const desc = this.add.text(112, y + 14, it.desc, { ...textStyle(14, '#b5b5c8'), wordWrap: { width: 480 } }).setOrigin(0, 0.5);
      let fs = parseInt(desc.style.fontSize, 10);
      while (desc.height > 36 && fs > 9) desc.setFontSize(--fs);                         // descrição comprida encolhe até caber
      const status = this.add.text(668, y, '', textStyle(16, '#9ff0ff')).setOrigin(0.5);
      const btn = this.add.text(826, y, '', { ...textStyle(18, '#1b1b2a'), backgroundColor: '#ffd23f', padding: { x: 12, y: 8 }, strokeThickness: 0 })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.sel = i; this.refresh(); this.time.delayedCall(1, () => this.act(i)); });
      return { bg, status, btn };
    });

    this.msg = this.add.text(WIDTH / 2, 496, '', { ...textStyle(20, '#ffe9a0'), align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 524, hint('↑↓ escolher · ENTER comprar · ESC sair da loja', 'toque em COMPRAR'), textStyle(13)).setOrigin(0.5).setAlpha(0.8);
    const out = this.add.text(18, 20, '◀ SAIR', { ...textStyle(20), backgroundColor: '#2b2b3a', padding: { x: 12, y: 6 } }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    out.on('pointerdown', () => this.time.delayedCall(1, () => this.close()));

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-ENTER', () => this.act(this.sel));
    kb.on('keydown-SPACE', () => this.act(this.sel));
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-BACKSPACE', () => this.close());

    this.say('Bem-vindo! Escolha um item e aperte ENTER (ou toque em COMPRAR).', true);
    this.refresh();
  }

  move(d) {
    this.sel = (this.sel + d + this.items.length) % this.items.length;
    Sfx.tone(520, 0.05, { vol: 0.05 });
    this.refresh();
  }

  say(text, ok = true) { this.msg.setText(text).setColor(ok ? '#ffe9a0' : '#ff8a8a'); }

  refresh() {
    this.items.forEach((it, i) => {
      const r = this.rows[i], lvl = Shop.level(it.id), price = Shop.price(it);
      r.bg.setStrokeStyle(i === this.sel ? 4 : 2, i === this.sel ? 0xffd23f : 0x444455);
      let status = '', label = '', on = true;
      if (it.kind === 'stock') { status = `Na mochila: ${Shop.stock(it.id)}`; label = `🪙 ${price}  COMPRAR`; }
      else if (it.kind === 'perm') { status = lvl ? '✔ É SEU' : ''; label = lvl ? '✔ COMPRADO' : `🪙 ${price}  COMPRAR`; on = !lvl; }
      else if (it.kind === 'tier') { status = `Nível ${lvl}/${it.max}`; label = lvl >= it.max ? '✔ MÁXIMO' : `🪙 ${price}  NÍVEL ${lvl + 1}`; on = lvl < it.max; }
      else if (it.kind === 'outfit') {
        status = lvl ? '✔ COMPRADO' : '';
        if (!lvl) label = `🪙 ${price}  COMPRAR`;
        else { const wearing = currentOutfit() === it.id; label = wearing ? '✔ VESTINDO' : 'VESTIR'; on = !wearing; }
      } else if (it.kind === 'pet') {
        if (!lvl) label = `🪙 ${price}  COMPRAR`;
        else { const active = Shop.pet() === it.id; status = active ? '✔ COMPANHEIRO' : 'Você tem'; label = active ? 'GUARDAR' : 'USAR'; }
      }
      r.status.setText(status);
      r.btn.setText(label).setBackgroundColor(on ? '#ffd23f' : '#555566').setColor(on ? '#1b1b2a' : '#cccccc');
    });
    this.walletText.setText(`🪙 ${Wallet.get()}`);
  }

  act(i) {
    const it = this.items[i];
    const lvl = Shop.level(it.id);
    Sfx.unlock();
    if (it.kind === 'outfit' && lvl) {
      if (currentOutfit() === it.id) return;
      Storage.set('pp_outfit', it.id);
      Achievements.unlock('roupa');
      Sfx.select(); this.say(`Vestiu: ${it.name}!`);
    } else if (it.kind === 'pet' && lvl) {
      const active = Shop.pet() === it.id;
      Shop.setPet(active ? null : it.id);
      Sfx.select(); this.say(active ? `${it.name} ficou em casa.` : `${it.name} vai com você!`);
    } else {
      const price = Shop.price(it);
      const r = Shop.buy(it);
      this.say(r.msg, r.ok);
      if (r.ok) {
        Sfx.coin(); Sfx.powerUp();
        this.popPrice(`-${price}`);
        if (it.kind === 'outfit') this.say(`Comprou: ${it.name}! Toque em VESTIR para usar.`);
      } else {
        Sfx.tone(160, 0.25, { type: 'sawtooth', vol: 0.08 });
        this.tweens.add({ targets: this.walletText, x: this.walletText.x + 8, duration: 50, yoyo: true, repeat: 3 });
      }
    }
    this.refresh();
  }

  // "-50" sobe da carteira
  popPrice(text) {
    const t = this.add.text(this.walletText.x - 60, this.walletText.y + 24, text, textStyle(22, '#ff8a8a')).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y + 24, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  close() {
    this.scene.stop();
    this.scene.resume('Centro');
    const c = this.scene.get('Centro');
    if (c && c.onShopClosed) c.onShopClosed();
  }
}
