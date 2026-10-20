const LEVEL_COLS = 5;       // cartões por linha em "Escolher fase"
const LEVELS_PER_PAGE = 10; // cartões por página

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.mode = 'main';
    this.scrollX = 0;
    this.starting = false;
    this.achPage = 0;
    this.cameras.main.fadeIn(300);
    Music.play('menu');

    // --- Fundo: Rio de Janeiro passando, com o Brunucho correndo de um Caramelo ---
    this.backdrop = createBackdrop(this, THEMES.rio);
    this.groundTop = this.add.tileSprite(-UI_OFF, HEIGHT - TILE * 2, VIEW_W, TILE, 'tiles', TILES.CALCADAO).setOrigin(0);
    this.groundFill = this.add.tileSprite(-UI_OFF, HEIGHT - TILE, VIEW_W, TILE, 'tiles', TILES.SAND).setOrigin(0);
    this.hero = this.add.sprite(190, HEIGHT - TILE * 2, playerTexture()).setOrigin(0.5, 1).setScale(2).setInteractive({ useHandCursor: true });
    this.hero.play(`${playerTexture()}_walk`);
    this.chaser = this.add.image(60, HEIGHT - TILE * 2, 'caramelo').setOrigin(0.5, 1).setScale(2).setFlipX(true);
    this.hero.on('pointerdown', () => this.nextOutfit());

    this.createTitle();

    // --- Painéis ---
    this.mainPanel = this.createMainPanel();
    this.levelPanel = this.createLevelPanel();
    this.rankingPanel = this.add.container(0, 0);
    this.achPanel = this.add.container(0, 0).setDepth(50);
    this.showMode('main');

    // --- Teclado ---
    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.side(-1));
    kb.on('keydown-A', () => this.side(-1));
    kb.on('keydown-RIGHT', () => this.side(1));
    kb.on('keydown-D', () => this.side(1));
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ESC', () => this.showMode('main'));
    kb.on('keydown-BACKSPACE', () => this.showMode('main'));
    kb.on('keydown-C', () => this.nextOutfit());
    kb.on('keydown-M', () => Sfx.toggle());
    kb.on('keydown-O', () => this.openOptions());
    kb.on('keydown', (ev) => {
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= LEVELS.length && this.mode !== 'achievements') this.tryLevel(n - 1);
    });
  }

  // ------------------------------------------------------------ Título

  createTitle() {
    const superText = this.add.text(WIDTH / 2, 46, 'SUPER', { ...textStyle(32, '#ff7a3d'), strokeThickness: 7 }).setOrigin(0.5);
    this.tweens.add({ targets: superText, angle: { from: -3, to: 3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Nome letra por letra, cada uma ondulando
    const name = PLAYER_NAME.toUpperCase();
    const letters = [...name].map((ch, i) => this.add.text(0, 0, ch,
      { ...textStyle(70, i % 2 ? '#ffb000' : '#ffd23f'), strokeThickness: 12 }).setOrigin(0.5));
    const totalW = letters.reduce((w, t) => w + t.width - 10, 0);
    let x = WIDTH / 2 - totalW / 2;
    letters.forEach((t, i) => {
      x += (t.width - 10) / 2;
      t.setPosition(x, 102);
      x += (t.width - 10) / 2;
      this.tweens.add({ targets: t, y: 92, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 90 });
    });

    const sub = this.add.text(WIDTH / 2, 154, GAME_SUBTITLE, { ...textStyle(24, '#7ff6ff'), strokeThickness: 6 }).setOrigin(0.5);
    this.tweens.add({ targets: sub, alpha: 0.65, duration: 800, yoyo: true, repeat: -1 });

    const badge = this.add.image(WIDTH / 2 + totalW / 2 + 46, 84, 'pw67').setScale(1.6);
    this.tweens.add({ targets: badge, angle: 360, duration: 4000, repeat: -1 });
    this.tweens.add({ targets: badge, scale: 1.9, duration: 600, yoyo: true, repeat: -1 });
    const aura = this.add.image(WIDTH / 2 - totalW / 2 - 46, 84, 'aura').setScale(1.6);
    this.tweens.add({ targets: aura, scale: 2, alpha: 0.7, duration: 700, yoyo: true, repeat: -1 });
  }

  // ------------------------------------------------------------ Menu principal

  createMainPanel() {
    const panel = this.add.container(0, 0);
    const save = Progress.data().save;
    this.options = [];
    if (save) {
      this.options.push({ label: () => `CONTINUAR (fase ${save.level + 1})`, action: () => this.continueGame(save) });
    }
    this.options.push(
      { label: () => (save ? 'NOVO JOGO' : 'JOGAR'), action: () => this.startGame(0, true) },
      { label: () => 'ESCOLHER FASE', action: () => this.showMode('levels') },
      { label: () => { const a = Achievements.progress(); return `CONQUISTAS (${a.done}/${a.total})`; }, action: () => this.showMode('achievements') },
      { label: () => 'RANKING', action: () => this.showMode('ranking') },
      { label: () => 'OPÇÕES', action: () => this.openOptions() },
      { label: () => 'CRÉDITOS', action: () => this.openCredits() },
      { label: () => (OUTFITS[currentOutfit()].friend ? `AMIGO: ${OUTFITS[currentOutfit()].name}` : `ROUPA: ${OUTFITS[currentOutfit()].name}`), action: () => this.openWardrobe(), side: () => this.openWardrobe() },
    );
    this.selected = 0;
    this.optionTexts = this.options.map((opt, i) => {
      const t = this.add.text(WIDTH / 2, 204 + i * 33, '', textStyle(23)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (this.mode === 'main') { this.selected = i; this.refreshMain(); } });
      t.on('pointerdown', () => { if (this.mode === 'main') { this.selected = i; this.confirm(); } });
      panel.add(t);
      return t;
    });
    this.cursorL = this.add.text(0, 0, '▶', textStyle(24, '#ffd23f')).setOrigin(0.5);
    this.cursorR = this.add.text(0, 0, '◀', textStyle(24, '#ffd23f')).setOrigin(0.5);
    panel.add([this.cursorL, this.cursorR]);
    this.tweens.add({ targets: [this.cursorL, this.cursorR], alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });

    const best = Ranking.list()[0];
    if (best) panel.add(this.add.text(WIDTH - 16, 16, `Recorde: ${formatScore(best.score)}`, textStyle(16, '#9ff0ff')).setOrigin(1, 0));
    panel.add(this.add.text(16, 16, `${hint('↑↓ escolher · ENTER confirmar · O opções', 'toque numa opção')}\nDificuldade: ${difficulty().name}`, textStyle(14)).setAlpha(0.85));
    // tela cheia: Android usa a API; no iPhone mostra como instalar o jogo como app (nenhum dos dois aparece se já está em tela cheia)
    if (IS_TOUCH && !FS.standalone()) {
      const fs = this.add.text(WIDTH - 16, 46, '⛶ TELA CHEIA', { ...textStyle(16), backgroundColor: '#2b2b3a', padding: { x: 10, y: 5 } })
        .setOrigin(1, 0).setInteractive({ useHandCursor: true });
      const dica = this.add.text(WIDTH / 2, HEIGHT - 70, FS.iosTip, { ...textStyle(16, '#ffe9a0'), backgroundColor: '#1b1b2a', padding: { x: 12, y: 8 },
        align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setDepth(50).setVisible(false);
      fs.on('pointerup', () => {                       // pointerup: só aqui o navegador aceita pedir tela cheia
        if (FS.available(this.scale)) FS.toggle(this.scale);
        else { dica.setVisible(true); this.time.delayedCall(5000, () => dica.setVisible(false)); }
      });
      panel.add([fs, dica]);
    }
    this.refreshMain();
    return panel;
  }

  refreshMain() {
    this.optionTexts.forEach((t, i) => {
      const sel = i === this.selected;
      t.setText(this.options[i].label()).setColor(sel ? '#ffd23f' : '#ffffff').setScale(sel ? 1.12 : 1);
    });
    const t = this.optionTexts[this.selected];
    this.cursorL.setPosition(t.x - t.displayWidth / 2 - 24, t.y);
    this.cursorR.setPosition(t.x + t.displayWidth / 2 + 24, t.y);
  }

  // ------------------------------------------------------------ Escolher fase

  createLevelPanel() {
    const panel = this.add.container(0, 0);
    panel.add(this.add.rectangle(WIDTH / 2, 318, 940, 270, 0x1b1b2a, 0.8).setStrokeStyle(3, 0xffd23f));
    panel.add(this.add.text(WIDTH / 2, 202, 'ESCOLHA A FASE', textStyle(26, '#ffd23f')).setOrigin(0.5));
    this.levelSel = 0;
    this.levelGroups = [];
    this.levelCards = LEVELS.map((lv, i) => {
      const slot = i % LEVELS_PER_PAGE;
      const col = slot % LEVEL_COLS, row = Math.floor(slot / LEVEL_COLS);
      const x = WIDTH / 2 - 352 + col * 176, y = 262 + row * 96;
      const theme = THEMES[lv.theme] || THEMES.dia;
      const open = Progress.isUnlocked(i);
      const card = this.add.rectangle(x, y, 164, 82, open ? theme.skyTop : 0x333344, 1).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
      const num = this.add.text(x - 76, y - 6, open ? `${i + 1}` : '🔒', textStyle(open ? (i + 1 > 9 ? 24 : 30) : 22, '#ffd23f')).setOrigin(0, 0.5);
      const name = this.add.text(x + 14, y - 12, lv.name.replace(': Chefão Final', ''), { ...textStyle(lv.name.length > 16 ? 13 : 15), align: 'center', wordWrap: { width: 112 } }).setOrigin(0.5).setAlpha(open ? 1 : 0.5);
      const n = Progress.starCount(i);
      const stars = this.add.text(x + 12, y + 24, '★'.repeat(n) + '☆'.repeat(3 - n), textStyle(18, '#ffd23f')).setOrigin(0.5).setAlpha(open ? 1 : 0.3);
      card.on('pointerover', () => { if (this.mode === 'levels') { this.levelSel = i; this.refreshLevels(); } });
      card.on('pointerdown', () => { if (this.mode === 'levels') this.tryLevel(i); });
      const group = [card, num, name, stars];
      panel.add(group);
      this.levelGroups.push(group);
      return card;
    });
    // páginas (10 fases por página)
    const pages = Math.ceil(LEVELS.length / LEVELS_PER_PAGE);
    const arrow = (x, label, d) => {
      const t = this.add.text(x, 318, label, textStyle(34, '#ffd23f')).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { if (this.mode === 'levels') { this.levelSel = Phaser.Math.Clamp(this.levelSel + d * LEVELS_PER_PAGE, 0, LEVELS.length - 1); this.refreshLevels(); } });
      panel.add(t);
    };
    arrow(36, '◀', -1);
    arrow(WIDTH - 36, '▶', 1);
    this.pageText = this.add.text(WIDTH / 2, 442, '', textStyle(15)).setOrigin(0.5);
    panel.add(this.pageText);
    this.levelPages = pages;
    // botão de voltar (no celular não tem ESC)
    const back = this.add.text(WIDTH / 2, 488, '◀ VOLTAR AO MENU', { ...textStyle(22), backgroundColor: '#2b2b3a', padding: { x: 14, y: 6 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { if (this.mode === 'levels') this.time.delayedCall(1, () => this.showMode('main')); });
    panel.add(back);
    return panel;
  }

  refreshLevels() {
    const page = Math.floor(this.levelSel / LEVELS_PER_PAGE);
    this.levelGroups.forEach((grp, i) => grp.forEach((o) => o.setVisible(Math.floor(i / LEVELS_PER_PAGE) === page)));
    this.levelCards.forEach((c, i) => c.setStrokeStyle(i === this.levelSel ? 5 : 2, i === this.levelSel ? 0xffd23f : 0xffffff)
      .setScale(i === this.levelSel ? 1.06 : 1));
    this.pageText.setText(`página ${page + 1}/${this.levelPages}  ·  ★ passou  ★ sem morrer  ★ todas as moedas  ·  ${hint('ESC voltar', 'use o botão VOLTAR')}`);
  }

  tryLevel(i) {
    if (!Progress.isUnlocked(i)) {
      Sfx.tone(160, 0.2, { type: 'sawtooth', vol: 0.06 });
      this.cameras.main.shake(120, 0.004);
      return;
    }
    this.startGame(i);
  }

  // ------------------------------------------------------------ Conquistas

  drawAchievements() {
    const p = this.achPanel;
    p.removeAll(true);
    const perPage = 16;
    const pages = Math.ceil(ACHIEVEMENTS.length / perPage);
    this.achPage = Phaser.Math.Clamp(this.achPage, 0, pages - 1);
    const got = Achievements.unlocked();
    const prog = Achievements.progress();

    p.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x0b0b14, 0.92));
    p.add(this.add.text(WIDTH / 2, 34, `🏆 CONQUISTAS  ${prog.done}/${prog.total}`, textStyle(32, '#ffd23f')).setOrigin(0.5));
    ACHIEVEMENTS.slice(this.achPage * perPage, (this.achPage + 1) * perPage).forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 40 + col * 450, y = 78 + row * 52;
      const has = !!got[a.id];
      p.add(this.add.rectangle(x - 6, y - 4, 438, 46, has ? 0x2b3a1e : 0x22222e, 1).setOrigin(0, 0).setStrokeStyle(2, has ? 0xffd23f : 0x444455));
      p.add(this.add.text(x + 18, y + 19, has ? a.icon : '🔒', { fontSize: '24px' }).setOrigin(0.5).setAlpha(has ? 1 : 0.6));
      p.add(this.add.text(x + 42, y + 2, a.name, textStyle(17, has ? '#ffd23f' : '#9a9aaa')));
      p.add(this.add.text(x + 42, y + 23, a.desc + (has ? `  ✔ ${got[a.id]}` : ''), textStyle(13, has ? '#ffffff' : '#77778a')));
    });
    // navegação que funciona no toque também
    const btn = (x, label, fn) => {
      const t = this.add.text(x, 515, label, { ...textStyle(18), backgroundColor: '#2b2b3a', padding: { x: 12, y: 4 } })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.time.delayedCall(1, fn)); // redesenha no próximo quadro
      p.add(t);
    };
    btn(WIDTH / 2 - 190, '◀ anterior', () => { this.achPage--; this.drawAchievements(); });
    p.add(this.add.text(WIDTH / 2, 515, `página ${this.achPage + 1}/${pages}`, textStyle(16)).setOrigin(0.5));
    btn(WIDTH / 2 + 190, 'próxima ▶', () => { this.achPage++; this.drawAchievements(); });
    btn(WIDTH - 70, 'VOLTAR', () => this.showMode('main'));
  }

  // ------------------------------------------------------------ Navegação

  showMode(mode) {
    this.mode = mode;
    this.mainPanel.setVisible(mode === 'main');
    this.levelPanel.setVisible(mode === 'levels');
    this.achPanel.setVisible(mode === 'achievements');
    this.rankingPanel.removeAll(true);
    if (mode === 'ranking') {
      this.rankingPanel.add(drawRanking(this, WIDTH / 2, 190));
      this.rankingPanel.add(this.add.text(WIDTH / 2, 420, 'ESC ou toque para voltar', textStyle(16)).setOrigin(0.5));
      this.time.delayedCall(100, () => this.input.once('pointerdown', () => { if (this.mode === 'ranking') this.showMode('main'); }));
    }
    if (mode === 'achievements') {
      this.drawAchievements();
    }
    if (mode === 'levels') this.refreshLevels();
    if (mode === 'main') this.refreshMain();
  }

  move(dir) {
    Sfx.unlock();
    if (this.mode === 'main') {
      this.selected = (this.selected + dir + this.options.length) % this.options.length;
      this.refreshMain();
      Sfx.tone(520, 0.05, { vol: 0.05 });
    } else if (this.mode === 'levels') {
      this.levelSel = Phaser.Math.Clamp(this.levelSel + dir * LEVEL_COLS, 0, LEVELS.length - 1);
      this.refreshLevels();
    }
  }

  side(dir) {
    if (this.mode === 'main') {
      const opt = this.options[this.selected];
      if (opt.side) opt.side();
    } else if (this.mode === 'levels') {
      this.levelSel = Phaser.Math.Clamp(this.levelSel + dir, 0, LEVELS.length - 1);
      this.refreshLevels();
    } else if (this.mode === 'achievements') {
      this.achPage += dir;
      this.drawAchievements();
    }
  }

  confirm() {
    Sfx.unlock();
    if (this.mode === 'main') this.options[this.selected].action();
    else if (this.mode === 'levels') this.tryLevel(this.levelSel);
    else this.showMode('main');
  }

  openOptions() {
    if (this.starting) return;
    Sfx.select();
    this.scene.pause();
    this.scene.launch('Options', { from: 'Menu' });
  }

  // Ao voltar das opções, redesenha (dificuldade, fases liberadas...)
  onOptionsClosed() { this.scene.restart(); }

  // withIntro: "JOGAR"/"NOVO JOGO" passa pela conversa com a mãe antes da fase 1
  startGame(level, withIntro = false, stats = undefined) {
    if (this.starting) return;
    this.starting = true;
    Sfx.unlock(); Sfx.select();
    if (withIntro) Progress.clearRun();
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (withIntro) this.scene.start('Intro');
      else this.scene.start('Game', { level, stats });
    });
  }

  openCredits() {
    if (this.starting) return;
    this.starting = true;
    Sfx.select();
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Credits', { next: 'Menu' }));
  }

  continueGame(save) { this.startGame(save.level, false, save.stats); }

  // O guarda-roupa abre por cima do menu (tecla C, tocar no Brunucho ou na opção ROUPA)
  openWardrobe() {
    if (this.starting) return;
    Sfx.unlock(); Sfx.select();
    this.scene.pause();
    this.scene.launch('Wardrobe');
  }

  nextOutfit() { this.openWardrobe(); }

  // ------------------------------------------------------------ Animação de fundo

  update(time, delta) {
    this.scrollX += delta * 0.18;
    this.backdrop.update(this.scrollX, time);
    this.groundTop.tilePositionX = this.scrollX;
    this.groundFill.tilePositionX = this.scrollX;
    this.chaser.y = HEIGHT - TILE * 2 - Math.abs(Math.sin(time * 0.012 + 1)) * 8;
    this.chaser.x = 70 + Math.sin(time * 0.0015) * 25;
  }
}
