class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create(data) {
    const stats = { coins: 0, deaths: 0, time: 0, score: 0, ...data.stats };
    const totalCoins = LEVELS.reduce((sum, l) => sum + l.map.join('').split('C').length - 1, 0);

    const backdrop = createBackdrop(this, THEMES.noite);
    backdrop.update(0, 0);
    this.cameras.main.fadeIn(400);
    Music.play('vitoria');

    const best = Storage.get('pp_best', null);
    if (!best || stats.time < best.time) Storage.set('pp_best', { time: stats.time, deaths: stats.deaths, coins: stats.coins });
    this.stats = stats;

    this.add.text(WIDTH / 2, 60, `${heroName().toUpperCase()} VENCEU!`, { ...textStyle(54, '#ffd23f'), strokeThickness: 10 }).setOrigin(0.5);

    // Pontuação final contando do zero
    const scoreText = this.add.text(WIDTH / 2, 130, '', { ...textStyle(40, '#ffe9a0'), strokeThickness: 8 }).setOrigin(0.5);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: stats.score, duration: 1600, ease: 'Cubic.out',
      onUpdate: () => scoreText.setText(`${formatScore(counter.v)} PONTOS`) });

    this.add.text(WIDTH / 2, 182,
      `Tempo ${formatTime(stats.time)}   ·   Moedas ${stats.coins}/${totalCoins}   ·   Mortes ${stats.deaths}`,
      textStyle(20)).setOrigin(0.5);

    this.askName();

    this.add.particles(0, -10, 'px', {
      x: { min: 0, max: WIDTH }, lifespan: 4000, speedY: { min: 60, max: 140 }, speedX: { min: -30, max: 30 },
      rotate: { min: 0, max: 360 }, tint: [0xffd23f, 0x2ecc71, 0x34d1ff, 0xff4f6d], frequency: 60,
    }).setDepth(-1);
    Sfx.win();

  }

  // ------------------------------------------------------------ Nome para o ranking
  // Teclado: digite e aperte ENTER (ou ESPAÇO). Celular: toque na caixa para abrir o teclado.
  askName() {
    this.name = Storage.get('pp_lastName', PLAYER_NAME);
    this.nameUI = this.add.container(0, 0);
    this.nameUI.add(this.add.text(WIDTH / 2, 250, 'Seu nome para o ranking:', textStyle(22, '#9ff0ff')).setOrigin(0.5));
    const box = this.add.rectangle(WIDTH / 2, 300, 380, 54, 0x1b1b2a, 0.95).setStrokeStyle(3, 0xffd23f).setInteractive({ useHandCursor: true });
    this.nameText = this.add.text(WIDTH / 2, 300, '', textStyle(30)).setOrigin(0.5);
    const ok = this.add.text(WIDTH / 2, 370, '  CONFIRMAR  ', { ...textStyle(24, '#1b1b2a'), backgroundColor: '#ffd23f', padding: { x: 10, y: 6 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.nameUI.add([box, this.nameText, ok,
      this.add.text(WIDTH / 2, 420, 'digite o nome e aperte ENTER  ·  no celular, toque na caixa', textStyle(15)).setOrigin(0.5).setAlpha(0.8)]);
    this.cursorOn = true;
    this.time.addEvent({ delay: 450, loop: true, callback: () => { this.cursorOn = !this.cursorOn; this.refreshName(); } });
    this.refreshName();

    box.on('pointerdown', () => {
      // celular: abre o teclado do aparelho
      const typed = window.prompt('Seu nome para o ranking:', this.name);
      if (typed !== null) { this.name = typed.trim().slice(0, 12) || this.name; this.refreshName(); }
    });
    ok.on('pointerdown', () => this.time.delayedCall(1, () => this.confirmName()));
    this.keyHandler = (ev) => {
      if (this.nameDone) return;
      if (ev.key === 'Enter' || ev.key === ' ') { this.confirmName(); return; }
      if (ev.key === 'Backspace') { this.name = this.name.slice(0, -1); }
      else if (ev.key && ev.key.length === 1 && /[\p{L}\p{N}_.-]/u.test(ev.key) && this.name.length < 12) { this.name += ev.key; }
      this.refreshName();
    };
    this.input.keyboard.on('keydown', this.keyHandler);
  }

  refreshName() {
    if (this.nameDone) return;
    this.nameText.setText(this.name + (this.cursorOn ? '_' : ' '));
  }

  confirmName() {
    if (this.nameDone) return;
    const name = this.name.trim() || PLAYER_NAME;
    this.nameDone = true;
    Storage.set('pp_lastName', name);
    this.input.keyboard.off('keydown', this.keyHandler);
    this.nameUI.destroy(true);
    Sfx.select();

    const st = this.stats;
    const position = Ranking.add({ name, score: st.score, time: st.time, deaths: st.deaths });
    if (position === 0) {
      const rec = this.add.text(WIDTH / 2, 222, '★ NOVO RECORDE! ★', textStyle(28, '#9ff0ff')).setOrigin(0.5);
      this.tweens.add({ targets: rec, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
    } else if (position > 0) {
      this.add.text(WIDTH / 2, 222, `Você ficou em ${position + 1}º no ranking!`, textStyle(24, '#9ff0ff')).setOrigin(0.5);
    } else {
      this.add.text(WIDTH / 2, 222, 'Não entrou no top 5... dá pra farmar mais aura!', textStyle(20, '#cccccc')).setOrigin(0.5);
    }
    drawRanking(this, WIDTH / 2, 262, position);

    const again = this.add.text(WIDTH / 2, 500, 'ESPAÇO ou toque para voltar ao menu', textStyle(22)).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    const go = () => { Sfx.select(); this.scene.start('Menu'); };
    this.time.delayedCall(800, () => {
      this.input.keyboard.once('keydown-SPACE', go);
      this.input.keyboard.once('keydown-ENTER', go);
      this.input.once('pointerdown', go);
    });
  }
}

// Tabela do ranking (usada no fim do jogo e no menu)
function drawRanking(scene, x, y, highlight = -1) {
  const list = Ranking.list();
  const objs = [];
  const add = (o) => { objs.push(o); return o; };
  add(scene.add.rectangle(x, y + 100, 520, 210, 0x1b1b2a, 0.7).setStrokeStyle(2, 0xffd23f).setOrigin(0.5, 0.5));
  add(scene.add.text(x, y + 14, '🏆 RANKING 🏆', textStyle(22, '#ffd23f')).setOrigin(0.5));
  if (list.length === 0) {
    add(scene.add.text(x, y + 100, 'Ninguém jogou ainda.\nSeja o primeiro!', { ...textStyle(20), align: 'center' }).setOrigin(0.5));
    return objs;
  }
  const medals = ['🥇', '🥈', '🥉', '4º', '5º'];
  list.forEach((e, i) => {
    const color = i === highlight ? '#9ff0ff' : '#ffffff';
    const ry = y + 50 + i * 32;
    add(scene.add.text(x - 235, ry, `${medals[i]}  ${e.name}`, textStyle(20, color)).setOrigin(0, 0.5));
    add(scene.add.text(x + 60, ry, formatScore(e.score), textStyle(20, i === highlight ? '#9ff0ff' : '#ffe9a0')).setOrigin(0.5));
    add(scene.add.text(x + 235, ry, `${formatTime(e.time)} · ${e.date}`, textStyle(14, '#cccccc')).setOrigin(1, 0.5));
  });
  return objs;
}
