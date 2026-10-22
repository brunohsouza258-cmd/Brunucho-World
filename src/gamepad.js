// Controle de videogame (Xbox, PlayStation e genéricos).
// Truque: cada botão do controle "aperta" uma tecla do teclado. Assim o jogo inteiro
// (menu, fases, pausa, intro...) funciona com o controle sem mudar mais nada.
//
//   A / X (PlayStation: X / □) ...... Espaço  (pular / confirmar)
//   B (PlayStation: ○) .............. Backspace (voltar nos menus)
//   Y / RB (PlayStation: △ / R1) .... X (poder do amigo, ex.: a saia da Lara)
//   Start / Options ................. ESC (pausar / voltar)
//   Direcional e analógico esquerdo . Setas

(function () {
  const KEYS = {
    space: [' ', 'Space', 32],
    back: ['Backspace', 'Backspace', 8],
    esc: ['Escape', 'Escape', 27],
    up: ['ArrowUp', 'ArrowUp', 38],
    down: ['ArrowDown', 'ArrowDown', 40],
    left: ['ArrowLeft', 'ArrowLeft', 37],
    right: ['ArrowRight', 'ArrowRight', 39],
    power: ['x', 'KeyX', 88],
    power2: ['c', 'KeyC', 67],
  };
  // número do botão no padrão "standard" dos navegadores → tecla
  const BUTTONS = { 0: 'space', 2: 'space', 1: 'back', 3: 'power', 5: 'power', 4: 'power2', 7: 'power2', 9: 'esc', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

  const down = {};      // fonte (botão/eixo) → apertado?
  const keyCount = {};  // tecla → quantas fontes estão segurando

  function send(type, [key, code, keyCode]) {
    const e = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true });
    Object.defineProperty(e, 'keyCode', { get: () => keyCode });
    Object.defineProperty(e, 'which', { get: () => keyCode });
    window.dispatchEvent(e);
  }

  function set(source, pressed, keyName) {
    if (!!down[source] === pressed) return;
    down[source] = pressed;
    const before = keyCount[keyName] || 0;
    keyCount[keyName] = before + (pressed ? 1 : -1);
    if (pressed && before === 0) send('keydown', KEYS[keyName]);
    if (!pressed && keyCount[keyName] === 0) send('keyup', KEYS[keyName]);
  }

  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads).find((p) => p && p.connected);
    if (pad) {
      for (const [i, name] of Object.entries(BUTTONS)) {
        const b = pad.buttons[i];
        set(`b${i}`, !!(b && b.pressed), name);
      }
      const ax = pad.axes[0] || 0;
      const ay = pad.axes[1] || 0;
      set('ax-', ax < -0.5, 'left');
      set('ax+', ax > 0.5, 'right');
      set('ay-', ay < -0.75, 'up');
      set('ay+', ay > 0.75, 'down');
    }
    requestAnimationFrame(poll);
  }

  window.addEventListener('gamepadconnected', (e) => console.log('Controle conectado:', e.gamepad.id));
  requestAnimationFrame(poll);
})();
