// Créditos rolando estilo filme + aviso de que é tudo brincadeira.
// Abre no fim do jogo (depois vai pro ranking) ou pelo menu (depois volta pro menu).

const CREDITS = [
  ['title', `${GAME_TITLE}`],
  ['sub', GAME_SUBTITLE],
  ['gap'],
  ['head', 'CRIADO POR'],
  ['big', 'Bruno Henrique de Souza'],
  ['line', '(o próprio Brunucho)'],
  ['gap'],
  ['head', 'IDEIA, HISTÓRIA E DIREÇÃO'],
  ['line', 'Brunucho'],
  ['gap'],
  ['head', 'PERSONAGENS, MEMES E CENÁRIOS'],
  ['line', 'Ideias: Brunucho'],
  ['line', 'Desenhos em pixel: Claude, com ajuda do Brunucho'],
  ['line', '(foto de referência, roupas e visual do personagem: Brunucho)'],
  ['gap'],
  ['head', 'DESIGN DO JOGO'],
  ['line', 'Brunucho e Claude'],
  ['line', 'Poderes "67" e "Aura", MOGGADO!, inimigos famosos,'],
  ['line', 'cenários do Brasil e chefão final: ideias do Brunucho'],
  ['gap'],
  ['head', 'PROGRAMAÇÃO'],
  ['line', 'Claude (inteligência artificial da Anthropic)'],
  ['line', 'com ajuda e pedidos do Brunucho'],
  ['gap'],
  ['head', 'TRILHA SONORA ORIGINAL'],
  ['line', 'Composta e programada por Claude'],
  ['line', 'Ideia da música "Six Seven": Brunucho'],
  ['line', 'Hino "Six Seven" · Bossa do Rio · Axé da Bahia'],
  ['line', 'Lo-fi da Garoa · Reggae da Praia · Tema do Chefão'],
  ['gap'],
  ['head', 'HISTÓRIA E DIÁLOGOS'],
  ['line', 'Ideia da intro e do final com a Andreia: Brunucho'],
  ['line', 'Falas: Brunucho e Claude'],
  ['gap'],
  ['head', 'TESTES'],
  ['line', 'Claude (com um navegador robô apertando as teclas)'],
  ['line', 'Brunucho (o teste de verdade)'],
  ['gap'],
  ['head', 'ESTRELANDO'],
  ['line', 'Brunucho ........ ele mesmo'],
  ['line', 'Andreia ........ a mãe (e o chinelo)'],
  ['gap'],
  ['head', 'PARTICIPAÇÕES ESPECIAIS (paródias)'],
  ['line', 'Neymar "Cai-Cai" · Galvão Bueno · Casimiro · Ednaldo Pereira'],
  ['line', 'Chefões: Lula & Flávio'],
  ['gap'],
  ['head', 'MEMES'],
  ['line', 'Vira-lata Caramelo · Capivara · Tralalero Tralala'],
  ['line', 'Tung Tung Tung Sahur · Six Seven · Aura'],
  ['gap'],
  ['head', 'FEITO COM'],
  ['line', 'Phaser 3 · JavaScript · muita aura'],
  ['gap'], ['gap'],
  ['big', 'Obrigado por jogar!'],
];

// Lista dos créditos; ganha uma seção de NARRAÇÃO se o jogador gravou a própria voz
function creditsList() {
  if (typeof Voices === 'undefined' || Voices.count() === 0) return CREDITS;
  const out = [...CREDITS];
  const i = out.findIndex((c) => c[0] === 'head' && c[1] === 'TESTES');
  out.splice(i, 0, ['head', 'NARRAÇÃO'], ['line', 'A voz do próprio Brunucho!'], ['gap']);
  return out;
}

class CreditsScene extends Phaser.Scene {
  constructor() { super('Credits'); }

  create(data) {
    this.next = data.next || 'Menu';
    this.stats = data.stats;
    this.leaving = false;
    this.cameras.main.fadeIn(500);
    Music.play('vitoria');
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x07070f);

    // estrelinhas no fundo
    this.add.particles(0, 0, 'px', {
      x: { min: 0, max: WIDTH }, y: { min: 0, max: HEIGHT }, lifespan: 3000, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 }, tint: [0xffffff, 0xffd23f, 0x7ff6ff], frequency: 120, speed: 0,
    });

    // Monta a lista de textos, um embaixo do outro
    this.roll = this.add.container(0, HEIGHT + 20);
    let y = 0;
    const styles = {
      title: () => ({ ...textStyle(44, '#ffd23f'), strokeThickness: 8 }),
      sub: () => textStyle(24, '#7ff6ff'),
      head: () => textStyle(18, '#ff9aae'),
      big: () => textStyle(30, '#ffffff'),
      line: () => textStyle(20, '#e8e8e8'),
    };
    for (const [kind, text] of creditsList()) {
      if (kind === 'gap') { y += 26; continue; }
      const t = this.add.text(WIDTH / 2, y, text, { ...styles[kind](), align: 'center' }).setOrigin(0.5, 0);
      this.roll.add(t);
      y += t.height + (kind === 'head' ? 4 : 6);
    }
    // Brunucho e a Andreia acenando no meio dos créditos
    this.roll.add(this.add.sprite(WIDTH / 2 - 60, y + 150, playerTexture()).setOrigin(0.5, 1).setScale(3).play(`${playerTexture()}_walk`));
    this.roll.add(this.add.image(WIDTH / 2 + 60, y + 150, 'mae').setOrigin(0.5, 1).setScale(3).setFlipX(true));
    this.rollHeight = y + 180;

    const skipC = this.add.text(WIDTH - 12, HEIGHT - 10, hint('segure ESPAÇO para acelerar · ESC pular   ', 'toque para acelerar   ') + '[ PULAR ▶▶ ]',
      { ...textStyle(14), backgroundColor: '#1b1b2a', padding: { x: 8, y: 4 } }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    skipC.on('pointerdown', () => this.showDisclaimer());
    this.keys = this.input.keyboard.addKeys('SPACE,ENTER');
    this.input.keyboard.on('keydown-ESC', () => this.showDisclaimer());
    this.input.on('pointerdown', (pointer, targets) => { if (!targets.length) this.fast = !this.fast; });
  }

  update(time, delta) {
    if (this.disclaimerShown) return;
    const fast = this.fast || this.keys.SPACE.isDown || this.keys.ENTER.isDown;
    this.roll.y -= delta * (fast ? 0.32 : 0.06);
    if (this.roll.y < -this.rollHeight) this.showDisclaimer();
  }

  // ------------------------------------------------------------ Aviso final
  showDisclaimer() {
    if (this.disclaimerShown) return;
    this.disclaimerShown = true;
    this.roll.setVisible(false);
    const box = this.add.container(WIDTH / 2, HEIGHT / 2).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 760, 360, 0x1b1b2a, 0.95).setStrokeStyle(4, 0xffd23f));
    box.add(this.add.text(0, -140, '⚠️  AVISO IMPORTANTE  ⚠️', textStyle(30, '#ffd23f')).setOrigin(0.5));
    box.add(this.add.text(0, -86, 'ESTE JOGO É SÓ BRINCADEIRA!', { ...textStyle(34, '#ff3df2'), strokeThickness: 7 }).setOrigin(0.5));
    box.add(this.add.text(0, 10,
      'Todos os famosos e políticos aparecem como paródia e caricatura,\n' +
      'sem nenhuma intenção de ofender ninguém.\n\n' +
      'Não leve a sério. Ninguém foi moggado de verdade.\n' +
      'Zoeira para todos os lados, sem preferência política.',
      { ...textStyle(19), align: 'center', lineSpacing: 6 }).setOrigin(0.5));
    box.add(this.add.text(0, 128, '(O chinelo da Andreia, porém, é 100% real.)', textStyle(18, '#ff9aae')).setOrigin(0.5));
    this.tweens.add({ targets: box, alpha: 1, duration: 600 });
    const cont = this.add.text(WIDTH / 2, HEIGHT - 30, 'ESPAÇO ou toque para continuar', textStyle(18)).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: cont, alpha: 1, delay: 1500, duration: 400, onComplete: () => {
      this.tweens.add({ targets: cont, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      this.input.keyboard.once('keydown-SPACE', () => this.leave());
      this.input.keyboard.once('keydown-ENTER', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    } });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.next === 'End') this.scene.start('End', { stats: this.stats });
      else this.scene.start('Menu');
    });
  }
}
