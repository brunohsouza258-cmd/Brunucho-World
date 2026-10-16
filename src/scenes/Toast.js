// Fica sempre por cima de tudo, mostrando "Conquista desbloqueada!" quando acontece.
class ToastScene extends Phaser.Scene {
  constructor() { super('Toast'); }

  create() {
    this.queue = [];
    this.busy = false;
  }

  show(a) {
    this.queue.push(a);
    if (!this.busy) this.nextToast();
  }

  nextToast() {
    const a = this.queue.shift();
    if (!a) { this.busy = false; return; }
    this.busy = true;
    this.scene.bringToTop();
    Sfx.achievement();

    const box = this.add.container(WIDTH / 2, -60);
    const bg = this.add.rectangle(0, 0, 420, 64, 0x1b1b2a, 0.95).setStrokeStyle(3, 0xffd23f);
    const icon = this.add.text(-180, 0, a.icon, { fontSize: '32px' }).setOrigin(0.5);
    const title = this.add.text(-150, -14, 'CONQUISTA DESBLOQUEADA!', textStyle(14, '#ffd23f')).setOrigin(0, 0.5);
    const name = this.add.text(-150, 10, a.name, textStyle(20)).setOrigin(0, 0.5);
    box.add([bg, icon, title, name]);
    box.setDepth(1000);

    this.tweens.add({ targets: box, y: 46, duration: 350, ease: 'Back.out' });
    const hold = this.queue.length > 0 ? 1300 : 2600; // com fila, mostra mais rápido
    this.tweens.add({ targets: box, y: -60, delay: hold, duration: 300, ease: 'Quad.in', onComplete: () => {
      box.destroy(true);
      this.nextToast();
    } });
  }
}
