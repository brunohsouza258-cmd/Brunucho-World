class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    generateTextures(this);
    this.createAnimations();

    // A cena dos avisos de conquista fica rodando por cima de tudo
    this.scene.launch('Toast');

    // Atalho de teste: index.html?fase=2 abre direto na fase 2.
    const params = new URLSearchParams(window.location.search);
    const fase = parseInt(params.get('fase'), 10);
    if (fase >= 1 && fase <= LEVELS.length) {
      this.scene.start('Game', { level: fase - 1 });
    } else {
      this.scene.start('Menu');
    }
  }

  // Animação de andar: passo 1 → parado → passo 2 → parado
  createAnimations() {
    const bases = [...OUTFIT_KEYS.map((k) => `player_${k}`), 'neymar', 'galvao', 'caze', 'ednaldo', 'lula', 'flavio'];
    for (const base of bases) {
      this.anims.create({
        key: `${base}_walk`,
        frames: [{ key: `${base}_walk1` }, { key: base }, { key: `${base}_walk2` }, { key: base }],
        frameRate: 10,
        repeat: -1,
      });
    }
    this.anims.create({ key: 'bombardiro_fly', frames: [{ key: 'bombardiro' }, { key: 'bombardiro_2' }], frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'pombo_fly', frames: [{ key: 'pombo' }, { key: 'pombo_2' }], frameRate: 8, repeat: -1 });
  }
}
