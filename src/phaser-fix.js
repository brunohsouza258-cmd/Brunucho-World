// Correção para o Phaser 3.80: quando várias teclas chegam mais rápido que os quadros do jogo,
// alguns eventos de tecla eram processados de novo (digitar "abc" virava "abbbc").
// Aqui garantimos que cada evento de tecla é tratado no máximo uma vez por cena.
(function () {
  const proto = Phaser.Input.Keyboard.KeyboardPlugin.prototype;
  const originalUpdate = proto.update;
  proto.update = function () {
    const manager = this.manager;
    if (!manager || !manager.queue.length) return originalUpdate.call(this);
    const full = manager.queue;
    const fresh = full.filter((ev) => {
      if (!ev.__seenBy) ev.__seenBy = new WeakSet();
      if (ev.__seenBy.has(this)) return false;
      ev.__seenBy.add(this);
      return true;
    });
    manager.queue = fresh;
    try { originalUpdate.call(this); } finally { manager.queue = full; }
  };
})();
