// Cena de abertura: a mãe proíbe o Brunucho de sair para farmar aura... e ele sai.
// Para mudar as falas, edite INTRO_SCRIPT. "action" dispara algo depois da fala aparecer.

const MOM_NAME = 'Andreia';
const FULL_NAME = 'BRUNO HENRIQUE';

const INTRO_SCRIPT = [
  { who: 'mae', text: `${FULL_NAME}! Onde você pensa que vai?`, action: 'angry' },
  { who: 'bru', text: 'Ué, mãe... só vou ali rapidinho.' },
  { who: 'mae', text: 'Rapidinho? Ontem você sumiu o dia INTEIRO pra "farmar aura"!' },
  { who: 'bru', text: 'Mas mãe, minha aura tá muito baixa. Tô quase no negativo...' },
  { who: 'mae', text: 'Aura nada! Você vai ficar em casa, fazer a lição da Escola Zacarias e arrumar esse quarto!', action: 'angry' },
  { who: 'bru', text: 'Mas, Dona Andreia... e os caramelos... as capivaras... o Galvão...' },
  { who: 'mae', text: 'NÃO QUERO SABER! Você NÃO vai sair dessa casa. Entendeu?', action: 'shake' },
  { who: 'bru', text: 'Entendi, mãe.' },
  { who: 'mae', text: 'Ótimo. Vou ali na cozinha ver o feijão.', action: 'momLeaves' },
  { who: 'bru', text: '...', small: true },
  { who: 'bru', text: '...six seven.', small: true, action: 'escape' },
  { who: 'mae', text: `${FULL_NAME}!!! VOLTA AQUI AGORA!!!`, action: 'chinelo' },
];

class IntroScene extends Phaser.Scene {
  // A cena final (Ending.js) reaproveita esta classe com outro roteiro
  constructor(key = 'Intro') { super(key); }

  getScript() { return INTRO_SCRIPT; }
  getMusic() { return 'intro'; }
  watchedAllAchievement() { return 'fugiu'; }

  create() {
    this.index = -1;
    this.typing = false;
    this.busy = false;
    this.done = false;
    this.script = this.getScript();
    this.startDelay = 500;
    this.cameras.main.fadeIn(400);
    Music.play(this.getMusic());

    this.drawRoom();

    // Personagens (escala 3)
    this.floorY = 392;
    this.bru = this.add.sprite(330, this.floorY, playerTexture()).setOrigin(0.5, 1).setScale(3);
    this.mae = this.add.image(560, this.floorY, 'mae').setOrigin(0.5, 1).setScale(3).setFlipX(true);
    this.tweens.add({ targets: [this.bru, this.mae], scaleY: 3.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.setupActors();

    // Caixa de diálogo
    this.box = this.add.rectangle(WIDTH / 2, 470, 900, 120, 0x1b1b2a, 0.92).setStrokeStyle(3, 0xffd23f);
    this.nameTag = this.add.text(40, 398, '', textStyle(22, '#ffd23f'));
    this.lineText = this.add.text(50, 432, '', { ...textStyle(22), wordWrap: { width: 860 }, lineSpacing: 6 });
    this.hint = this.add.text(WIDTH - 30, 515, '▼', textStyle(18, '#ffd23f')).setOrigin(1, 0.5);
    this.tweens.add({ targets: this.hint, y: 509, duration: 350, yoyo: true, repeat: -1 });
    this.add.text(WIDTH - 12, 10, 'ESPAÇO: continuar   ·   ESC: pular', textStyle(14)).setOrigin(1, 0).setAlpha(0.85);

    // Controles
    const kb = this.input.keyboard;
    kb.on('keydown-SPACE', () => this.advance());
    kb.on('keydown-ENTER', () => this.advance());
    kb.on('keydown-ESC', () => this.finish(false));
    this.input.on('pointerdown', () => this.advance());

    this.time.delayedCall(this.startDelay, () => this.next());
  }

  // ------------------------------------------------------------ Cenário: sala de casa

  drawRoom() {
    const g = this.add.graphics();
    // parede e rodapé
    g.fillStyle(0xf6e7c8); g.fillRect(0, 0, WIDTH, 392);
    g.fillStyle(0xeedcb6); for (let x = 0; x < WIDTH; x += 40) g.fillRect(x, 0, 20, 392); // listras do papel de parede
    g.fillStyle(0xd9c39a); g.fillRect(0, 380, WIDTH, 12);
    // chão de madeira
    g.fillStyle(0xa8743f); g.fillRect(0, 392, WIDTH, 148);
    g.fillStyle(0x8f5f30); for (let y = 400; y < 540; y += 18) g.fillRect(0, y, WIDTH, 2);
    g.fillStyle(0x8f5f30); for (let x = 0; x < WIDTH; x += 90) g.fillRect(x + ((x / 90) % 2) * 45, 392, 2, 148);
    // janela com céu e sol
    g.fillStyle(0xffffff); g.fillRect(70, 70, 170, 140);
    g.fillStyle(0x7fc3ff); g.fillRect(78, 78, 154, 124);
    g.fillStyle(0xffd23f); g.fillCircle(200, 110, 18);
    g.fillStyle(0xffffff); g.fillEllipse(120, 120, 60, 20); g.fillEllipse(150, 150, 50, 16);
    g.fillStyle(0x5cb85c); g.fillRect(78, 180, 154, 22);
    g.fillStyle(0xffffff); g.fillRect(152, 78, 6, 124); g.fillRect(78, 136, 154, 6);
    g.fillStyle(0xd9534f); g.fillRect(56, 62, 26, 160); g.fillRect(228, 62, 26, 160); // cortinas
    // quadro da família
    g.fillStyle(0x8a5a2b); g.fillRect(330, 90, 110, 80);
    g.fillStyle(0xbfe6ff); g.fillRect(338, 98, 94, 64);
    g.fillStyle(0xf0cc5a); g.fillCircle(368, 122, 9); g.fillStyle(0x5a3a22); g.fillCircle(402, 120, 10);
    g.fillStyle(0x1e3f8f); g.fillRect(360, 132, 16, 30); g.fillStyle(0xe91e63); g.fillRect(394, 132, 16, 30);
    // TV na estante
    g.fillStyle(0x6b4a2a); g.fillRect(470, 290, 170, 90);
    g.fillStyle(0x1b1b2a); g.fillRect(490, 200, 130, 86);
    g.fillStyle(0x2b6cd4); g.fillRect(497, 207, 116, 72);
    // sofá
    g.fillStyle(0x2e7d6b); g.fillRoundedRect(40, 300, 220, 80, 14);
    g.fillStyle(0x3b9a85); g.fillRoundedRect(56, 280, 188, 56, 12);
    g.fillStyle(0x2e7d6b); g.fillRect(52, 370, 10, 22); g.fillRect(238, 370, 10, 22);
    // vaso de planta
    g.fillStyle(0xb5532e); g.fillRect(690, 340, 36, 42);
    g.fillStyle(0x4caf50); g.fillCircle(708, 322, 24); g.fillCircle(692, 334, 14); g.fillCircle(724, 334, 14);
    // porta (com a rua lá fora quando abrir)
    g.fillStyle(0x7fc3ff); g.fillRect(790, 180, 110, 212);
    g.fillStyle(0x5cb85c); g.fillRect(790, 340, 110, 52);
    g.fillStyle(0xffffff); g.fillRect(782, 172, 126, 8); g.fillRect(782, 172, 8, 220); g.fillRect(900, 172, 8, 220);
    this.door = this.add.rectangle(790, 180, 110, 212, 0x7a4a24).setOrigin(0, 0);
    this.doorKnob = this.add.circle(880, 290, 6, 0xffd23f);
    // texto da TV
    const tv = this.add.text(555, 243, 'AURA\n+1000', { ...textStyle(16, '#ffffff'), align: 'center' }).setOrigin(0.5);
    this.tweens.add({ targets: tv, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  // ------------------------------------------------------------ Diálogo

  advance() {
    if (this.done || this.busy) return;
    Sfx.unlock();
    if (this.typing) { this.completeLine(); return; }
    this.next();
  }

  next() {
    if (this.done) return;
    this.index++;
    if (this.index >= this.script.length) { this.finish(true); return; }
    const line = this.script[this.index];
    const isMom = line.who === 'mae';
    this.nameTag.setText(isMom ? MOM_NAME : PLAYER_NAME).setColor(isMom ? '#ff8ab3' : '#ffd23f');
    this.lineText.setFontSize(line.small ? 18 : 22).setColor(line.small ? '#cfcfcf' : '#ffffff');
    this.full = line.text;
    this.shown = 0;
    this.typing = true;
    this.hint.setVisible(false);
    // quem fala dá um pulinho
    const speaker = isMom ? this.mae : this.bru;
    if (speaker.visible) this.tweens.add({ targets: speaker, y: this.floorY - 10, duration: 90, yoyo: true });

    if (this.typer) this.typer.remove();
    this.typer = this.time.addEvent({
      delay: 28, loop: true, callback: () => {
        this.shown++;
        this.lineText.setText(this.full.slice(0, this.shown));
        if (this.shown % 2 === 0 && this.full[this.shown] !== ' ') {
          Sfx.tone(isMom ? 520 + Math.random() * 80 : 330 + Math.random() * 60, 0.04, { type: 'square', vol: 0.03 });
        }
        if (this.shown >= this.full.length) this.completeLine();
      },
    });
  }

  completeLine() {
    if (this.typer) this.typer.remove();
    this.typing = false;
    this.lineText.setText(this.full);
    this.hint.setVisible(true);
    const action = this.script[this.index].action;
    if (action) this[`act_${action}`]();
  }

  // ------------------------------------------------------------ Ações da cena

  exclaim(target, text = '!') {
    const t = this.add.text(target.x, target.y - target.displayHeight - 10, text, textStyle(36, '#ff3b3b')).setOrigin(0.5, 1);
    this.tweens.add({ targets: t, y: t.y - 14, duration: 150, yoyo: true, repeat: 2, onComplete: () => t.destroy() });
  }

  act_angry() { this.exclaim(this.mae, '!'); Sfx.tone(300, 0.12, { vol: 0.06 }); }

  act_shake() { this.exclaim(this.mae, '!!'); this.cameras.main.shake(300, 0.012); Sfx.stomp(); }

  act_momLeaves() {
    // a mãe sai pela esquerda (vai pra cozinha)
    this.busy = true;
    this.mae.setFlipX(true);
    this.tweens.add({ targets: this.mae, x: -60, duration: 1400, ease: 'Sine.in', delay: 300, onComplete: () => {
      this.mae.setVisible(false); this.busy = false;
    } });
  }

  act_escape() {
    // o Brunucho olha pros lados... e sai correndo pela porta
    this.busy = true;
    this.hint.setVisible(false);
    const b = this.bru;
    this.time.delayedCall(400, () => b.setFlipX(true));
    this.time.delayedCall(800, () => b.setFlipX(false));
    this.time.delayedCall(1200, () => {
      this.exclaim(b, '67');
      Sfx.sixSeven();
      this.tweens.add({ targets: this.door, scaleX: 0.15, duration: 300 });  // porta abre
      this.doorKnob.setVisible(false);
      this.tweens.killTweensOf(b);
      b.setScale(3);
      b.play(`${playerTexture()}_walk`);
      this.tweens.add({ targets: b, x: 845, duration: 650, delay: 350, ease: 'Quad.in',
        onComplete: () => {
          this.tweens.add({ targets: b, scale: 2.2, alpha: 0, y: this.floorY - 30, duration: 300, onComplete: () => b.setVisible(false) });
          // a mãe volta correndo
          this.mae.setVisible(true).setX(-60).setFlipX(false);
          this.tweens.add({ targets: this.mae, x: 560, duration: 600, ease: 'Quad.out', onComplete: () => {
            this.busy = false;
            this.next();
          } });
        } });
    });
  }

  act_chinelo() {
    // a clássica chinelada voadora
    this.busy = true;
    this.cameras.main.shake(400, 0.015);
    this.exclaim(this.mae, '!!!');
    const c = this.add.image(this.mae.x + 30, this.floorY - 100, 'chinelo').setScale(3);
    this.tweens.add({ targets: c, x: 860, y: this.floorY - 70, angle: 1080, duration: 700, ease: 'Quad.out', onComplete: () => {
      this.cameras.main.shake(150, 0.01);
      Sfx.stomp();
      this.tweens.add({ targets: this.door, scaleX: 1, duration: 120 });   // porta bate
      this.tweens.add({ targets: c, y: this.floorY - 6, angle: 1150, duration: 400, ease: 'Bounce.out' });
      this.time.delayedCall(900, () => { this.busy = false; });
    } });
  }

  // ------------------------------------------------------------ Fim

  // watchedAll: chegou ao fim sem pular (vale conquista)
  finish(watchedAll = false) {
    if (this.done) return;
    this.done = true;
    if (watchedAll) Achievements.unlock(this.watchedAllAchievement());
    // para tudo que ainda estava animando (caso tenha pulado no meio)
    this.time.removeAllEvents();
    this.tweens.killAll();
    const cam = this.cameras.main;
    cam.fadeOut(500, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      cam.resetFX();
      this.afterScene();
    });
  }

  setupActors() { /* a intro usa as posições padrão */ }

  // Letreiro antes da fase 1
  afterScene() {
    this.children.removeAll(true);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000);
    const t = this.add.text(WIDTH / 2, HEIGHT / 2, 'E assim começou\nA LENDA DA AURA INFINITA...',
      { ...textStyle(32, '#7ff6ff'), align: 'center', lineSpacing: 12 }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 700, hold: 1500, yoyo: true, onComplete: () => {
      this.scene.start('Game', { level: 0 });
    } });
  }
}
