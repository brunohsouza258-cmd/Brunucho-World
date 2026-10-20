const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#12121c',
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYS.gravity }, debug: false },
  },
  // A ordem importa: quem vem depois aparece por cima (Toast = avisos de conquista, sempre no topo)
  scene: [BootScene, MenuScene, IntroScene, EndingScene, CreditsScene, GameScene, PauseScene, EndScene, GameOverScene, OptionsScene, VoiceScene, ToastScene],
});
