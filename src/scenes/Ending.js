// Cena final: depois de moggar o Lula e o Flávio, o Brunucho volta pra casa...
// e a Andreia está esperando. Reaproveita a sala e o sistema de diálogo da intro.

const ENDING_SCRIPT = [
  { who: 'mae', text: 'BRUNO HENRIQUE DE SOUZA. Isso são horas de chegar?', action: 'angry' },
  { who: 'bru', text: 'Mãe! Eu passei pela Escola Zacarias, por São Paulo, pelo Rio, pela Bahia...' },
  { who: 'bru', text: '...e moggei o Lula e o Flávio AO MESMO TEMPO!' },
  { who: 'mae', text: 'Você o QUÊ?!', action: 'shake' },
  { who: 'bru', text: 'Minha aura agora é infinita, mãe. Six seven.', action: 'glow' },
  { who: 'mae', text: 'Aura infinita, é?...' },
  { who: 'mae', text: 'Então usa essa aura toda pra arrumar o quarto. AGORA!', action: 'shake' },
  { who: 'bru', text: '...sim, senhora.' },
  { who: 'mae', text: 'E toma esse chinelo de lembrança!', action: 'bonk' },
];

class EndingScene extends IntroScene {
  constructor() { super('Ending'); }

  init(data) { this.finalStats = data.stats; }

  getScript() { return ENDING_SCRIPT; }
  getMusic() { return 'intro'; }
  watchedAllAchievement() { return 'casa'; }

  // A mãe fica de frente pra porta; o Brunucho entra por ela
  setupActors() {
    this.startDelay = 1800;
    this.mae.setX(520).setFlipX(false);
    this.tweens.add({ targets: this.door, scaleX: 0.15, duration: 300, delay: 300 });
    this.doorKnob.setVisible(false);
    this.bru.setX(845).setAlpha(0).setFlipX(true);
    this.bru.play(`${playerTexture()}_walk`);
    this.tweens.add({ targets: this.bru, alpha: 1, duration: 200, delay: 500 });
    this.tweens.add({ targets: this.bru, x: 690, duration: 900, delay: 600, onComplete: () => {
      this.bru.anims.stop(); this.bru.setTexture(playerTexture());
      this.tweens.add({ targets: this.door, scaleX: 1, duration: 150 });
      this.doorKnob.setVisible(true);
    } });
  }

  act_glow() {
    const glow = this.add.ellipse(this.bru.x, this.floorY - 54, 110, 140, 0x8f6bff, 0.35)
      .setStrokeStyle(4, 0x7ff6ff).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.6, duration: 450, yoyo: true, repeat: -1 });
    Sfx.aura();
    Sfx.say('six seven', { lang: 'en-US', rate: 0.9, pitch: 1 });
  }

  act_bonk() {
    // a chinelada certeira
    this.busy = true;
    const c = this.add.image(this.mae.x + 30, this.floorY - 100, 'chinelo').setScale(3);
    this.tweens.add({ targets: c, x: this.bru.x, y: this.floorY - 90, angle: 720, duration: 450, ease: 'Quad.in', onComplete: () => {
      Sfx.stomp();
      this.cameras.main.shake(250, 0.015);
      this.tweens.killTweensOf(this.bru);
      this.tweens.add({ targets: this.bru, angle: 90, y: this.floorY + 10, duration: 250 });
      this.tweens.add({ targets: c, x: this.bru.x + 60, y: this.floorY - 6, angle: 1000, duration: 500, ease: 'Bounce.out' });
      const stars = this.add.text(this.bru.x, this.floorY - 70, '⭐ 💫 ⭐', { fontSize: '26px' }).setOrigin(0.5);
      this.tweens.add({ targets: stars, angle: 360, duration: 1200, repeat: -1 });
      this.time.delayedCall(1000, () => { this.busy = false; });
    } });
  }

  // Letreiro final + créditos, depois a tela de pontuação/ranking
  afterScene() {
    this.children.removeAll(true);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000);
    Music.play('vitoria');
    const fim = this.add.text(WIDTH / 2, 110, 'FIM', { ...textStyle(90, '#ffd23f'), strokeThickness: 12 }).setOrigin(0.5).setAlpha(0);
    const sub = this.add.text(WIDTH / 2, 190, 'O Brunucho farmou aura infinita...\nmas ficou de castigo.',
      { ...textStyle(24, '#7ff6ff'), align: 'center', lineSpacing: 8 }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: fim, alpha: 1, duration: 600 });
    this.tweens.add({ targets: sub, alpha: 1, delay: 700, duration: 600 });
    // Depois do FIM: créditos rolando, aviso de brincadeira e por fim o ranking
    this.time.delayedCall(4000, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Credits', { next: 'End', stats: this.finalStats }));
    });
  }
}
