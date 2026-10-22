// CENTRO DE COTIA: uma rua com várias lojas para gastar as moedas que você pega nas fases.
//   ← → andar · ↑ / ENTER entrar na loja · ESC voltar ao menu
//   (mouse/celular: toque no chão para andar até lá, toque numa loja para entrar; ◀ ▶ na tela seguram a caminhada)
class CentroScene extends Phaser.Scene {
  constructor() { super('Centro'); }

  create() {
    const GY = 14 * TILE;                                   // topo da calçada
    this.GY = GY;
    this.worldW = 700 + SHOPS.length * 380 + 320;
    const W = this.worldW;
    this.target = null;                                      // x aonde o toque mandou ir
    this.pendingShop = null;                                 // loja que abre quando chegar lá
    this.hold = 0;                                           // botões ◀ ▶ da tela (celular)
    this.near = -1;

    this.cameras.main.setBounds(0, 0, W, HEIGHT);
    this.cameras.main.fadeIn(300);
    Music.play('menu');
    Achievements.unlock('cotia');

    this.backdrop = createBackdrop(this, THEMES.escola);
    this.add.tileSprite(0, GY, W, TILE, 'tiles', TILES.SIDEWALK).setOrigin(0).setDepth(1);
    this.add.tileSprite(0, GY + TILE, W, HEIGHT - GY - TILE, 'tiles', TILES.CONCRETE).setOrigin(0).setDepth(1);

    this.drawGate(250);
    this.shopViews = SHOPS.map((s, i) => this.drawShop(s, i, 700 + i * 380));
    // postes entre as lojas, árvores e bancos
    for (let i = 0; i <= SHOPS.length; i++) this.drawLamp(700 + i * 380 - 190);
    [470, 2900, 3060].forEach((x) => this.drawTree(x));
    [330, 2980].forEach((x) => this.drawBench(x));

    // pessoas na rua: a Andreia e os amigos (menos o que você está jogando)
    this.npcs = [];
    this.addNpc('mae', 520, 'Andreia', ['Compra pão, Brunucho!', 'Gasta com juízo, hein?', 'Leva um casaquinho!']);
    const spots = [980, 1740, 2500, 3010];
    FRIEND_KEYS.forEach((k, i) => { if (k !== currentOutfit()) this.addNpc(`player_${k}`, spots[i % spots.length], OUTFITS[k].who, [OUTFITS[k].phrase]); });

    // o jogador
    const tex = playerTexture();
    this.tex = tex;
    this.shadow = this.add.ellipse(120, GY, 30, 8, 0x000000, 0.3).setDepth(3);
    this.player = this.add.sprite(120, GY, tex).setOrigin(0.5, 1).setDepth(5);
    this.nameTag = this.add.text(120, GY - 46, heroName(), textStyle(14, '#ffd23f')).setOrigin(0.5, 1).setDepth(6);
    this.pet = new PetFollower(this);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 0);

    this.createHud();

    // controles
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');
    const enter = () => { if (this.near >= 0) this.openShop(this.near); };
    ['UP', 'W', 'ENTER', 'SPACE'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, enter));
    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.input.on('pointerdown', (ptr, over) => {            // toque no chão: anda até lá
      if (over.length) return;
      this.pendingShop = null;
      this.target = ptr.worldX;
    });
    this.input.on('pointerup', () => { this.hold = 0; });
    this.events.on('resume', () => this.refreshWallet());
  }

  // ------------------------------------------------------------ Cenário

  tint(color, amount) {
    const c = Phaser.Display.Color.IntegerToColor(color);
    return (amount < 0 ? c.darken(-amount) : c.lighten(amount)).color;
  }

  // Portal de entrada: duas colunas e uma placa grande
  drawGate(cx) {
    const GY = this.GY, g = this.add.graphics().setDepth(2);
    g.fillStyle(0x6a4a2e); g.fillRect(cx - 190, GY - 230, 16, 230); g.fillRect(cx + 174, GY - 230, 16, 230);
    g.fillStyle(0x4a3220); g.fillRect(cx - 190, GY - 230, 4, 230); g.fillRect(cx + 174, GY - 230, 4, 230);
    g.fillStyle(0x3a2616); g.fillRoundedRect(cx - 200, GY - 250, 400, 84, 12);
    g.lineStyle(4, 0xffd23f, 1); g.strokeRoundedRect(cx - 200, GY - 250, 400, 84, 12);
    this.add.text(cx, GY - 224, 'CENTRO DE COTIA', { ...textStyle(40, '#ffd23f'), strokeThickness: 7 }).setOrigin(0.5).setDepth(3);
    this.add.text(cx, GY - 186, '★ lojas · padaria · moda · pet shop ★', textStyle(15, '#ffe9a0')).setOrigin(0.5).setDepth(3);
    // bandeirinhas
    const cols = [0xd62828, 0xffd23f, 0x2ecc71, 0x34d1ff, 0xff4f6d];
    for (let k = 0; k < 12; k++) {
      const x = cx - 190 + k * 31, y = GY - 130 + Math.sin((k / 11) * Math.PI) * 14;
      g.fillStyle(cols[k % 5]); g.fillTriangle(x, y, x + 20, y, x + 10, y + 20);
    }
  }

  drawShop(s, i, cx) {
    const GY = this.GY, L = cx - 150, g = this.add.graphics().setDepth(2);
    const dark = this.tint(s.wall, -18), light = this.tint(s.wall, 10);
    // prédio
    g.fillStyle(s.wall); g.fillRect(L, GY - 300, 300, 300);
    g.fillStyle(light); g.fillRect(L, GY - 300, 300, 8);
    g.fillStyle(s.trim); g.fillRect(L - 6, GY - 310, 312, 14);
    g.fillStyle(dark); g.fillRect(L, GY - 296, 300, 6);
    // janelas do andar de cima
    [L + 34, L + 192].forEach((x) => {
      g.fillStyle(s.trim); g.fillRect(x - 4, GY - 290, 82, 64);
      g.fillStyle(0xcfe9f7); g.fillRect(x, GY - 286, 74, 56);
      g.fillStyle(0xffffff, 0.4); g.fillRect(x + 6, GY - 282, 20, 48);
      g.fillStyle(s.trim); g.fillRect(x + 36, GY - 286, 3, 56);
    });
    // placa com o nome
    g.fillStyle(0x2a1f18); g.fillRoundedRect(L + 10, GY - 218, 280, 56, 9);
    g.lineStyle(3, s.trim, 1); g.strokeRoundedRect(L + 10, GY - 218, 280, 56, 9);
    const nm = this.add.text(cx, GY - 190, `${s.icon} ${s.name}`, { ...textStyle(21, '#ffe9a0'), strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
    let fs = parseInt(nm.style.fontSize, 10);
    while (nm.width > 262 && fs > 11) nm.setFontSize(--fs);
    // toldo listrado
    for (let k = 0; k < 10; k++) {
      const x = L + k * 30;
      g.fillStyle(s.awning[k % 2]); g.fillRect(x, GY - 154, 30, 26); g.fillTriangle(x, GY - 128, x + 30, GY - 128, x + 15, GY - 114);
    }
    g.fillStyle(0x000000, 0.16); g.fillRect(L, GY - 126, 300, 5);
    // vitrines com os produtos
    [[L + 14, 0], [L + 186, 1]].forEach(([x, k]) => {
      g.fillStyle(s.trim); g.fillRect(x - 4, GY - 106, 108, 82);
      g.fillStyle(0xd8eef7); g.fillRect(x, GY - 102, 100, 74);
      g.fillStyle(0xffffff, 0.35); g.fillRect(x + 6, GY - 98, 14, 66);
      g.fillStyle(0x8a6a3a); g.fillRect(x, GY - 44, 100, 6);                  // prateleira
      const pair = s.items.slice(k * 2, k * 2 + 2);
      (pair.length ? pair : s.items.slice(0, 1)).forEach((it, n, arr) =>
        this.add.text(x + 50 + (n - (arr.length - 1) / 2) * 38, GY - 62, it.icon, { fontSize: '28px' }).setOrigin(0.5).setDepth(3));
    });
    // porta
    g.fillStyle(s.trim); g.fillRect(cx - 30, GY - 100, 60, 100);
    g.fillStyle(0x1d3b45); g.fillRect(cx - 24, GY - 94, 48, 94);
    g.fillStyle(0xffffff, 0.22); g.fillRect(cx - 20, GY - 90, 10, 86);
    g.fillStyle(0xffd23f); g.fillRect(cx + 14, GY - 48, 4, 8);
    g.fillStyle(0xd62828); g.fillRoundedRect(cx - 17, GY - 78, 34, 13, 3);
    this.add.text(cx, GY - 72, 'ABERTO', { fontFamily: FONT, fontSize: '9px', color: '#ffffff' }).setOrigin(0.5).setDepth(3);
    // toque na loja = andar até a porta e entrar
    const zone = this.add.zone(cx, GY - 110, 300, 220).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { this.target = cx; this.pendingShop = i; });
    const prompt = this.add.text(cx, GY - 250, IS_TOUCH ? '👆 toque para entrar' : '↑  ENTRAR', { ...textStyle(16, '#1b1b2a'), backgroundColor: '#ffd23f', padding: { x: 10, y: 4 }, strokeThickness: 0 })
      .setOrigin(0.5).setDepth(20).setVisible(false);
    this.tweens.add({ targets: prompt, y: GY - 258, duration: 450, yoyo: true, repeat: -1 });
    return { cx, zone, prompt, shop: s };
  }

  drawLamp(x) {
    const GY = this.GY, g = this.add.graphics().setDepth(2);
    g.fillStyle(0x3a3d46); g.fillRect(x - 3, GY - 150, 6, 150); g.fillRect(x - 3, GY - 150, 22, 5);
    g.fillStyle(0xfff3b0); g.fillRoundedRect(x + 10, GY - 146, 16, 8, 3);
    g.fillStyle(0x2a2c33); g.fillRect(x - 7, GY - 8, 14, 8);
  }

  drawTree(x) {
    const GY = this.GY, g = this.add.graphics().setDepth(2);
    g.fillStyle(0x6a4a2e); g.fillRect(x - 6, GY - 96, 12, 96);
    g.fillStyle(0x2f8f46); g.fillCircle(x, GY - 118, 40); g.fillCircle(x - 28, GY - 98, 28); g.fillCircle(x + 28, GY - 98, 28);
    g.fillStyle(0x3fae5a); g.fillCircle(x - 8, GY - 130, 20); g.fillCircle(x + 14, GY - 112, 16);
  }

  drawBench(x) {
    const GY = this.GY, g = this.add.graphics().setDepth(2);
    g.fillStyle(0x8a5a2e); g.fillRect(x - 30, GY - 30, 60, 7); g.fillRect(x - 30, GY - 48, 60, 7);
    g.fillStyle(0x3a3d46); g.fillRect(x - 26, GY - 23, 5, 23); g.fillRect(x + 21, GY - 23, 5, 23); g.fillRect(x - 30, GY - 50, 4, 20); g.fillRect(x + 26, GY - 50, 4, 20);
  }

  addNpc(key, x, name, lines) {
    const spr = this.add.sprite(x, this.GY, key).setOrigin(0.5, 1).setDepth(4);
    const tag = this.add.text(x, this.GY - spr.height - 2, name, textStyle(13, '#9ff0ff')).setOrigin(0.5, 1).setDepth(6);
    this.npcs.push({ spr, tag, x, lines, said: 0, close: false });
  }

  speech(target, text) {
    const t = this.add.text(target.x, target.y - target.height - 22, text, {
      fontFamily: FONT, fontSize: '14px', color: '#1b1b2a', backgroundColor: '#ffffff', padding: { x: 6, y: 4 } }).setOrigin(0.5, 1).setDepth(110);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, delay: 1600, duration: 500, onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------ Interface

  createHud() {
    const fixed = (o) => o.setScrollFactor(0).setDepth(100);
    fixed(this.add.rectangle(14, 12, 210, 44, 0x1b1b2a, 0.85).setOrigin(0).setStrokeStyle(2, 0xffd23f));
    this.walletText = fixed(this.add.text(26, 34, '', textStyle(24, '#ffe9a0'))).setOrigin(0, 0.5);
    this.refreshWallet();
    const back = fixed(this.add.text(VIEW_W - 14, 14, '◀ MENU', { ...textStyle(20), backgroundColor: '#2b2b3a', padding: { x: 12, y: 6 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.leave());
    fixed(this.add.text(VIEW_W / 2, 20, 'CENTRO DE COTIA', { ...textStyle(18, '#ffd23f') })).setOrigin(0.5, 0);
    this.hintText = fixed(this.add.text(VIEW_W / 2, HEIGHT - 14, hint('← → andar  ·  ↑ ou ENTER entra na loja  ·  ESC volta', 'toque no chão para andar  ·  toque numa loja para entrar'), textStyle(14)))
      .setOrigin(0.5, 1).setAlpha(0.9);
    if (IS_TOUCH) {                                           // ◀ ▶ seguram a caminhada
      [['◀', 70, -1], ['▶', 170, 1]].forEach(([label, x, d]) => {
        const c = fixed(this.add.circle(x, HEIGHT - 70, 38, 0xffffff, 0.2)).setStrokeStyle(3, 0xffffff, 0.45).setInteractive();
        fixed(this.add.text(x, HEIGHT - 70, label, textStyle(30))).setOrigin(0.5);
        c.on('pointerdown', () => { this.hold = d; this.target = null; this.pendingShop = null; });
      });
    }
  }

  refreshWallet() { if (this.walletText) this.walletText.setText(`🪙 ${Wallet.get()}`); }

  openShop(i) {
    if (this.opening) return;
    Sfx.unlock(); Sfx.select();
    this.opening = true;
    this.target = null; this.pendingShop = null; this.hold = 0;
    this.scene.pause();
    this.scene.launch('Shop', { shop: SHOPS[i].id });
  }

  onShopClosed() { this.opening = false; this.refreshWallet(); }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    Sfx.select();
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
  }

  // ------------------------------------------------------------ Loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const p = this.player, k = this.keys;
    let dir = ((k.RIGHT.isDown || k.D.isDown || this.hold === 1) ? 1 : 0) - ((k.LEFT.isDown || k.A.isDown || this.hold === -1) ? 1 : 0);
    if (dir !== 0 && !this.hold) { this.target = null; this.pendingShop = null; }
    if (dir === 0 && this.target !== null) {
      const dx = this.target - p.x;
      if (Math.abs(dx) <= 5) {
        p.x = this.target; this.target = null;
        if (this.pendingShop !== null) { const i = this.pendingShop; this.pendingShop = null; this.openShop(i); }
      } else dir = Math.sign(dx);
    }
    p.x = Phaser.Math.Clamp(p.x + dir * 210 * dt, 30, this.worldW - 30);
    if (dir !== 0) {
      p.setFlipX(dir < 0);
      if (!p.anims.isPlaying) p.play(`${this.tex}_walk`);
    } else if (p.anims.isPlaying) { p.anims.stop(); p.setTexture(this.tex); }
    this.shadow.setPosition(p.x, this.GY);
    this.nameTag.setPosition(p.x, this.GY - 46);

    // perto de alguma porta?
    let near = -1;
    this.shopViews.forEach((v, i) => { if (Math.abs(p.x - v.cx) < 75) near = i; });
    if (near !== this.near) {
      if (this.near >= 0) this.shopViews[this.near].prompt.setVisible(false);
      if (near >= 0) this.shopViews[near].prompt.setVisible(true);
      this.near = near;
    }

    // as pessoas da rua olham pra você e falam quando você chega perto
    this.npcs.forEach((n) => {
      n.spr.setFlipX(p.x < n.x);
      const close = Math.abs(p.x - n.x) < 130;
      if (close && !n.close && time - n.said > 4000) { n.said = time; this.speech(n.spr, Phaser.Utils.Array.GetRandom(n.lines)); }
      n.close = close;
    });

    this.pet.follow(p.x, this.GY, time);
    this.backdrop.update(this.cameras.main.scrollX, time);
  }
}
