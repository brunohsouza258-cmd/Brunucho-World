const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
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
  scene: [BootScene, MenuScene, IntroScene, EndingScene, CreditsScene, GameScene, PauseScene, EndScene, GameOverScene, OptionsScene, VoiceScene, WardrobeScene, ToastScene],
});

// Menus e telas por cima: o desenho de 960px fica centralizado (a câmera anda UI_OFF para o lado). Só a fase usa a tela toda.
game.events.once('ready', () => {
  game.scene.scenes.forEach((s) => {
    if (s.sys.settings.key === 'Game') return;
    s.events.on('create', () => s.cameras.main.setScroll(-UI_OFF, 0));
  });
});

// Celular em pé: pede pra girar e pausa o jogo (e o som) até virar. Notebook/PC nunca mostra isso.
function checkOrientation() {
  const portrait = IS_TOUCH && window.innerHeight > window.innerWidth * 1.05;
  document.body.classList.toggle('retrato', portrait);
  if (portrait) { game.loop.sleep(); if (Sfx.ctx && Sfx.ctx.state === 'running') Sfx.ctx.suspend(); }
  else { game.loop.wake(); if (Sfx.ctx && Sfx.ctx.state === 'suspended') Sfx.ctx.resume(); }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));
checkOrientation();
window.addEventListener('contextmenu', (e) => e.preventDefault());   // sem menu de "copiar imagem" ao segurar o dedo
