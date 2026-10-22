// A PROFESSORA EVA: a chefona da fase 2 (Escola Zacarias).
// A porta da escola (onde ficava a bandeira da fase) leva pra DENTRO da sala de aula. A Eva dá aula com slide e fala "ERRADO!"
// TODA vez (até quando está certo). Ela anda, joga giz e, quando mostra o slide, cai uma chuva de "X" de errado.
// Depois de corrigir tanta lição ela fica CANSADA por uns segundos: é a hora de pisar nela. Estes métodos são "colados" na GameScene.

const EVA_HP = { facil: 4, normal: 5, dificil: 6 };

const EVA_SLIDES = [
  ['MATEMÁTICA', '2 + 2 = 4'], ['HISTÓRIA', 'O Brasil foi descoberto em 1500'], ['TABUADA', '7 × 8 = 56'],
  ['GEOGRAFIA', 'Cotia fica em São Paulo'], ['CIÊNCIAS', 'A água ferve a 100 °C'], ['PORTUGUÊS', 'Eu gosto de aula'],
  ['ÁLGEBRA', 'x + 1 = 4   →   x = 3'], ['INGLÊS', 'Cat = gato'],
];
const EVA_LINES = ['TÁ ERRADO!', 'REFAZ!', 'De novo, de novo!', 'Não foi isso que eu expliquei!', 'Tá errado, refaz essa lição!', 'ERRADO! Caderno aberto!'];

// A sala é uma tela só (sem rolar): tem a largura da tela do aparelho. Letras: P início · e a Eva · C moeda · A aura · H coxinha · - carteira (plataforma)
// O corredor da escola: inimigos normais até o fim, onde fica a porta do 3º D. Letras: P início · E inimigo · C moeda · K checkpoint ·
// ^ cone de piso molhado · = armário (sólido) · - banco (plataforma) · H coxinha · A aura · G a porta do 3º D
function corridorDef() {
  const W = 112;
  const rows = Array.from({ length: 17 }, () => Array(W).fill(' '));
  const set = (x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < 17) rows[y][x] = ch; };
  for (let y = 0; y < 14; y++) { set(0, y, '='); set(W - 1, y, '='); }
  for (let y = 14; y < 17; y++) for (let x = 0; x < W; x++) set(x, y, '#');
  set(3, 13, 'P');
  [14, 22, 31, 41, 53, 62, 71, 80, 92].forEach((x) => set(x, 13, 'E'));          // inimigos normais
  set(50, 13, 'K'); set(88, 13, 'K');                                              // checkpoints
  [27, 47, 67, 85].forEach((x) => set(x, 13, '^'));                                // cones de piso molhado
  [19, 37, 58, 76].forEach((x) => { for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) set(x + i, 13 - k, '='); set(x, 11, 'C'); set(x + 1, 11, 'C'); });   // armários
  [[34, 12], [56, 11], [73, 12]].forEach(([x, y]) => { for (let i = 0; i < 4; i++) set(x + i, y - 1, '-'); });   // bancos
  [10, 11, 12, 26, 45, 46, 48, 64, 65, 66, 83, 84, 98, 99, 100, 101].forEach((x) => set(x, 13, 'C'));
  set(57, 8, 'H'); set(96, 13, 'A');
  set(W - 5, 13, 'G');
  return { name: 'Corredor', theme: 'corredor', map: rows.map((r) => r.join('')) };
}

function classroomDef(widthTiles) {
  const W = Math.max(30, widthTiles);
  const rows = Array.from({ length: 17 }, () => Array(W).fill(' '));
  const set = (x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < 17) rows[y][x] = ch; };
  for (let y = 0; y < 14; y++) { set(0, y, '='); set(W - 1, y, '='); }          // paredes dos lados
  for (let y = 14; y < 17; y++) for (let x = 0; x < W; x++) set(x, y, '#');       // piso de madeira
  set(3, 13, 'P');
  set(W - 7, 13, 'e');
  const desk = (x, y, len) => { for (let i = 0; i < len; i++) set(x + i, y, '-'); };
  const step = Math.floor((W - 14) / 4);
  const dx = [5, 5 + step, 5 + step * 2, 5 + step * 3];
  desk(dx[0], 11, 3); desk(dx[1], 9, 3); desk(dx[2], 11, 3); desk(dx[3], 9, 3);   // carteiras em degraus
  [dx[0], dx[2]].forEach((x) => { set(x, 10, 'C'); set(x + 1, 10, 'C'); set(x + 2, 10, 'C'); });
  [dx[1], dx[3]].forEach((x) => { set(x, 8, 'C'); set(x + 2, 8, 'C'); });
  set(dx[1] + 1, 8, 'H');                                                          // coxinha numa carteira alta
  set(dx[3] + 1, 8, 'A');                                                          // aura na outra
  return { name: 'Sala de Aula', theme: 'sala', map: rows.map((r) => r.join('')) };
}

const EvaMixin = {
  // ------------------------------------------------------------ Entrar na escola: rua → corredor → sala do 3º D
  enterSchool(room) {
    if (this.entering) return;
    this.entering = true;
    this.player.setVelocityX(0);
    Sfx.tone(330, 0.12, { type: 'triangle', vol: 0.08 });
    Sfx.tone(262, 0.18, { type: 'triangle', vol: 0.08, delay: 0.12 });
    this.floatText(this.player.x, this.player.y - 50, room === 'corredor' ? 'Entrando na escola...' : 'Entrando na sala do 3º D...', '#ffe9a0', 20);
    Achievements.unlock(room === 'corredor' ? 'escola_entrou' : 'terceiro_d');
    const cam = this.cameras.main;
    cam.fadeOut(600, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        level: this.levelIndex, room, stats: this.stats, buffs: this.buffs,
        carry: { coins: this.levelCoins, total: this.totalCoins, deaths: this.levelDeaths, time: this.levelTime },
      });
    });
  },

  // A porta da sala do 3º D, no fim do corredor (no lugar da bandeira): chegar nela leva pra sala da Eva
  drawDoor3D(cx, bottom) {
    const g = this.add.graphics().setDepth(0.4);
    g.fillStyle(0x3a2a1a); g.fillRect(cx - 44, bottom - 142, 88, 142);
    g.fillStyle(0x2f7a4f); g.fillRect(cx - 38, bottom - 136, 38, 136); g.fillRect(cx, bottom - 136, 38, 136);
    g.fillStyle(0xbfe6ff); g.fillRect(cx - 30, bottom - 124, 22, 34); g.fillRect(cx + 8, bottom - 124, 22, 34);
    g.fillStyle(0xffffff, 0.4); g.fillRect(cx - 28, bottom - 122, 6, 30); g.fillRect(cx + 10, bottom - 122, 6, 30);
    g.fillStyle(0xffd23f); g.fillRect(cx - 5, bottom - 70, 4, 12); g.fillRect(cx + 1, bottom - 70, 4, 12);
    g.fillStyle(0x1b1b2a); g.fillRoundedRect(cx - 58, bottom - 196, 116, 44, 6);
    g.lineStyle(3, 0xffd23f); g.strokeRoundedRect(cx - 58, bottom - 196, 116, 44, 6);
    this.add.text(cx, bottom - 174, '3º D', { fontFamily: FONT, fontSize: '34px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(0.5);
    const tag = this.add.text(cx, bottom - 214, IS_TOUCH ? '🚪 entre aqui' : '🚪 ENTRAR', { ...textStyle(16, '#1b1b2a'), backgroundColor: '#ffd23f', padding: { x: 8, y: 3 }, strokeThickness: 0 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: tag, y: bottom - 222, duration: 450, yoyo: true, repeat: -1 });
  },

  // ------------------------------------------------------------ A sala de aula (desenho)
  drawClassroom() {
    const W = this.mapW, GY = 14 * TILE;
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0xf3e9cd); g.fillRect(0, 0, W, GY);                                // parede
    g.fillStyle(0x6fa38a); g.fillRect(0, GY - 120, W, 120);                        // faixa verde (rodapé alto)
    g.fillStyle(0x4d7f68); g.fillRect(0, GY - 124, W, 6);
    g.fillStyle(0xe2d6b4); g.fillRect(0, 0, W, 14);                                // sanca do teto
    // quadro-negro (esquerda, abaixo do painel de moedas): lição escrita no giz
    const bx = 36, by = 116;
    g.fillStyle(0x8a5a2e); g.fillRoundedRect(bx - 8, by - 8, 220, 124, 6);
    g.fillStyle(0x2f5d46); g.fillRect(bx, by, 204, 108);
    g.fillStyle(0xd8d0b8); g.fillRect(bx, by + 108, 204, 6);
    this.add.text(bx + 102, by + 18, 'LIÇÃO DE HOJE', { fontFamily: FONT, fontSize: '15px', color: '#f4f4f0' }).setOrigin(0.5).setDepth(-9);
    this.add.text(bx + 102, by + 54, 'prova surpresa!\n(vale nota)', { fontFamily: FONT, fontSize: '13px', color: '#d8d0b8', align: 'center' }).setOrigin(0.5).setDepth(-9);
    this.add.text(bx + 102, by + 92, 'Eva: "tá errado"', { fontFamily: FONT, fontSize: '11px', color: '#9ad0b0' }).setOrigin(0.5).setDepth(-9);
    // janelas (à direita, abaixo do painel de tempo)
    [W - 150].forEach((x) => {
      g.fillStyle(0x9a6a3a); g.fillRect(x - 6, 96, 108, 122);
      g.fillStyle(0xbfe6ff); g.fillRect(x, 102, 96, 110);
      g.fillStyle(0xffffff, 0.5); g.fillRect(x + 8, 108, 22, 94);
      g.fillStyle(0x9a6a3a); g.fillRect(x + 46, 102, 4, 110); g.fillRect(x, 154, 96, 4);
    });
    // cartazes dos dois lados do slide
    const mid = Math.floor(W / 2);
    g.fillStyle(0xffd23f); g.fillRect(mid - 250, 104, 66, 46); g.fillStyle(0xff7a8a); g.fillRect(mid + 186, 104, 66, 46);
    this.add.text(mid - 217, 127, 'NÃO\nCORRA!', { fontFamily: FONT, fontSize: '12px', color: '#3a2a10', align: 'center' }).setOrigin(0.5).setDepth(-9);
    this.add.text(mid + 219, 127, 'SILÊNCIO\nNA AULA', { fontFamily: FONT, fontSize: '11px', color: '#5a1020', align: 'center' }).setOrigin(0.5).setDepth(-9);
    // tela do projetor (o slide da Eva), abaixo da barra de vida, e o projetor no teto
    const sw = 320, sh = 156, sx = mid - sw / 2, sy = 66;
    g.fillStyle(0x3a3d46); g.fillRect(mid - 14, 0, 28, 12);                        // projetor
    g.fillStyle(0xfff3b0, 0.16); g.fillTriangle(mid, 12, sx + 10, sy + sh - 6, sx + sw - 10, sy + sh - 6);
    g.fillStyle(0x2a2c33); g.fillRect(sx - 6, sy - 4, sw + 12, sh + 8);
    g.fillStyle(0xfdfdf7); g.fillRect(sx, sy, sw, sh);
    this.slideBox = { x: sx, y: sy, w: sw, h: sh };
    this.slideTitle = this.add.text(sx + sw / 2, sy + 22, 'AULA DA PROFESSORA EVA', { fontFamily: FONT, fontSize: '19px', color: '#1b4f8a', fontStyle: 'bold' }).setOrigin(0.5).setDepth(-8);
    this.slideBody = this.add.text(sx + sw / 2, sy + 78, 'Hoje tem prova surpresa!', { fontFamily: FONT, fontSize: '21px', color: '#222222', align: 'center', wordWrap: { width: sw - 30 } }).setOrigin(0.5).setDepth(-8);
    this.slideStamp = this.add.text(sx + sw / 2, sy + 104, 'ERRADO!', { fontFamily: FONT, fontSize: '58px', color: '#e02020', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(-7).setAngle(-12).setAlpha(0);
    // mesa da professora (enfeite)
    this.add.rectangle(W - 3 * TILE, GY - 26, 96, 52, 0x8a5a2e).setDepth(-3).setStrokeStyle(3, 0x5a3a1e);
    this.add.rectangle(W - 3 * TILE, GY - 54, 108, 8, 0xa87038).setDepth(-3);
    this.add.text(W - 3 * TILE, GY - 28, 'EVA', { fontFamily: FONT, fontSize: '14px', color: '#f4e4c0' }).setOrigin(0.5).setDepth(-2);
    return { update() {} };
  },


  // O corredor: parede com portas das salas, cartazes, luzes no teto e armários por cima dos blocos de armário
  drawCorridor(level) {
    const W = this.mapW, GY = 14 * TILE;
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0xf0e6c8); g.fillRect(0, 0, W, GY);
    g.fillStyle(0x6fa38a); g.fillRect(0, GY - 120, W, 120);
    g.fillStyle(0x4d7f68); g.fillRect(0, GY - 124, W, 6);
    g.fillStyle(0xd9cba6); g.fillRect(0, 0, W, 22);
    for (let x = 80; x < W; x += 224) {                                             // luzes do teto
      g.fillStyle(0xfff8d0, 0.22); g.fillTriangle(x + 40, 22, x - 20, GY - 120, x + 100, GY - 120);
      g.fillStyle(0xfffbe8); g.fillRect(x, 16, 80, 8);
    }
    const plates = ['1º A', '1º B', '1º C', '2º A', '2º B', '2º C', '3º A', '3º B', '3º C'];
    const cartazes = [['FESTA\nJUNINA', 0xffd23f, '#3a2a10'], ['PROVA\nDIA 20', 0xff9aae, '#5a1020'], ['NÃO\nCORRA!', 0x9ad0ff, '#10305a'], ['SILÊNCIO\nPOR FAVOR', 0xb5f0c0, '#10401a']];
    plates.forEach((t, i) => {                                                      // portas das outras salas (e um cartaz entre cada duas)
      const x = 330 + i * 360;
      if (x > W - 480) return;
      g.fillStyle(0x7a4a22); g.fillRect(x - 30, GY - 118, 60, 118);
      g.fillStyle(0x9a6a3a); g.fillRect(x - 25, GY - 112, 50, 112);
      g.fillStyle(0xbfe6ff); g.fillRect(x - 11, GY - 100, 22, 32);
      g.fillStyle(0xffffff); g.fillRoundedRect(x - 20, GY - 150, 40, 22, 4);
      this.add.text(x, GY - 139, t, { fontFamily: FONT, fontSize: '15px', color: '#1b1b2a', fontStyle: 'bold' }).setOrigin(0.5).setDepth(-9);
      const [txt, cor, tc] = cartazes[i % 4], cxp = x + 180;
      g.fillStyle(cor); g.fillRect(cxp - 28, GY - 188, 56, 56);
      this.add.text(cxp, GY - 160, txt, { fontFamily: FONT, fontSize: '11px', color: tc, align: 'center' }).setOrigin(0.5).setDepth(-9);
    });
    const bx = 760;                                                                  // bebedouro
    g.fillStyle(0xb8c0cc); g.fillRoundedRect(bx - 14, GY - 62, 28, 62, 4); g.fillStyle(0x4aa3ff); g.fillRect(bx - 10, GY - 78, 20, 18);
    this.add.text(bx, GY - 92, 'BEBEDOURO', { fontFamily: FONT, fontSize: '9px', color: '#3a3d46' }).setOrigin(0.5).setDepth(-9);
    const lg = this.add.graphics().setDepth(0.5);                                    // armários por cima dos blocos de armário
    level.tiles.forEach((row, y) => row.forEach((t, x) => {
      if (t !== TILES.BRICK || x === 0 || x === level.width - 1) return;
      lg.fillStyle(0x4a7aa8); lg.fillRect(x * TILE, y * TILE, TILE, TILE);
      lg.fillStyle(0x365a80); lg.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      lg.fillStyle(0x24425f); [8, 13, 18].forEach((v) => lg.fillRect(x * TILE + 8, y * TILE + v, TILE - 16, 2));
    }));
    this.add.text(230, GY - 200, 'SALA DO 3º D  →  no fim do corredor', { fontFamily: FONT, fontSize: '16px', color: '#1b4f8a', fontStyle: 'bold' }).setOrigin(0.5).setDepth(-9);
    return { update() {} };
  },

  // desenha a carteira (tampo + pés) em cima de cada plataforma de madeira
  drawDesks(level) {
    const g = this.add.graphics().setDepth(0.5);
    const GY = 14 * TILE;
    const seen = new Set();
    level.tiles.forEach((row, y) => row.forEach((t, x) => {
      if (t !== TILES.ONEWAY || seen.has(`${x},${y}`)) return;
      let n = 0; while (row[x + n] === TILES.ONEWAY) { seen.add(`${x + n},${y}`); n++; }
      const px = x * TILE, py = y * TILE;
      g.fillStyle(0x6b4a2a, 0.55); g.fillRect(px + 6, py + TILE, 4, GY - py - TILE); g.fillRect(px + n * TILE - 10, py + TILE, 4, GY - py - TILE);   // pés
      g.fillStyle(0xc8964a); g.fillRoundedRect(px, py - 3, n * TILE, 8, 3);                                                                        // tampo
    }));
  },

  // ------------------------------------------------------------ A Eva
  setupEva() {
    if (!this.evaSpawn) return;
    const hp = EVA_HP[Settings.get('difficulty')] || 5;
    const e = this.spawnEnemy('eva', this.evaSpawn.x, this.evaSpawn.y, { behavior: 'eva', speed: 0 });
    e.body.setSize(26, 38).setOffset(8, 8);
    e.eva = true; e.hp = hp; e.maxHp = hp;
    e.state = 'intro'; e.timer = 2.2; e.vulnerable = false; e.slideN = 0; e.chalkT = 1.5;
    e.startX = e.x; e.range = 3 * TILE;
    e.dir = -1;
    this.eva = e;
    this.shake(250, 0.006);
    Music.play('chefao');
    const banner = this.add.text(VIEW_W / 2, HEIGHT / 2 - 60, 'PROFESSORA EVA', { ...textStyle(50, '#ffd23f'), strokeThickness: 10 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(150).setScale(0.3);
    this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.out' });
    this.tweens.add({ targets: banner, alpha: 0, delay: 1700, duration: 400, onComplete: () => banner.destroy() });
    this.speech(e, 'Hoje tem prova surpresa!');
    // barra de vida fixa em cima
    this.evaName = this.add.text(VIEW_W / 2, 14, 'PROFESSORA EVA', textStyle(16, '#ff8a8a')).setOrigin(0.5, 0).setScrollFactor(0).setDepth(140);
    this.evaBar = this.add.graphics().setScrollFactor(0).setDepth(140);
  },

  updateEva(e, dt) {
    const b = e.body, pb = this.player.body;
    const dx = pb.center.x - b.center.x;
    const rage = 1 + (e.maxHp - e.hp) * 0.18;
    e.timer -= dt;
    e.vulnerable = e.state === 'tired';
    e.setFlipX(dx > 0);
    if (e.state === 'intro') {
      e.setVelocityX(0);
      if (e.timer <= 0) { e.state = 'walk'; e.timer = 4; e.chalkT = 1.2; }
    } else if (e.state === 'walk') {                                 // passeia na frente do quadro e joga giz
      if (e.x > e.startX + e.range) e.dir = -1; else if (e.x < e.startX - e.range) e.dir = 1;
      e.setVelocityX(e.dir * 55 * rage);
      e.chalkT -= dt;
      if (e.chalkT <= 0 && !this.dead) { e.chalkT = 1.7 / rage; this.evaChalk(e); }
      if (e.timer <= 0) { e.state = 'slide'; e.timer = 1.7; e.stamped = false; e.setVelocityX(0); this.showSlide(e); }
    } else if (e.state === 'slide') {                                // mostra o slide e, "do nada", grita ERRADO
      e.setVelocityX(0);
      if (!e.stamped && e.timer < 0.9) { e.stamped = true; this.stampErrado(e); }
      if (e.timer <= 0) { e.state = 'rain'; e.timer = 3.4; e.dropT = 0; e.drops = 0; }
    } else if (e.state === 'rain') {                                 // chuva de X: cada um avisa antes de cair
      e.setVelocityX(0);
      e.dropT -= dt;
      if (e.dropT <= 0 && e.timer > 0.9) {
        e.dropT = 0.55 / Math.sqrt(rage);
        const near = e.drops % 2 === 0;
        this.evaDropX(near ? pb.center.x : Phaser.Math.Between(40, this.mapW - 40));
        e.drops++;
      }
      if (e.timer <= 0) { e.state = 'tired'; e.timer = 3.2; this.speech(e, Phaser.Utils.Array.GetRandom(['tá errado... tudo errado...', 'quanta lição pra corrigir...', 'preciso de um café...'])); }
    } else if (e.state === 'tired') {                                // cansada de corrigir: é a hora de pisar nela
      e.setVelocityX(0);
      e.setAngle(Math.sin(this.time.now * 0.012) * 5);
      e.setAlpha(0.75 + 0.25 * Math.sin(this.time.now * 0.02));
      if (e.timer <= 0) { e.state = 'walk'; e.timer = 3.6; e.setAngle(0); e.setAlpha(1); }
    } else if (e.state === 'stun') {                                 // levou uma pisada
      e.setVelocityX(0);
      e.setAngle(Math.sin(this.time.now * 0.05) * 8);
      if (e.timer <= 0) { e.state = 'walk'; e.timer = 3; e.setAngle(0); e.setAlpha(1); }
    }
    // barra de vida (fixa no topo)
    this.evaBar.clear();
    const bw = 300, bx = VIEW_W / 2 - bw / 2;
    this.evaBar.fillStyle(0x1b1b2a); this.evaBar.fillRect(bx - 2, 36, bw + 4, 14);
    this.evaBar.fillStyle(e.vulnerable ? 0xffd23f : 0xff4f6d); this.evaBar.fillRect(bx, 38, bw * Math.max(0, e.hp) / e.maxHp, 10);
    if (e.vulnerable) { e.cartaz = e.cartaz || this.add.text(0, 0, 'PISA AGORA!', textStyle(14, '#1b1b2a')).setOrigin(0.5, 1).setDepth(8); e.cartaz.setBackgroundColor('#ffd23f').setPosition(e.x, e.y - e.displayHeight / 2 - 4); }
    else if (e.cartaz) { e.cartaz.destroy(); e.cartaz = null; }
  },

  showSlide(e) {
    const [mat, txt] = EVA_SLIDES[e.slideN % EVA_SLIDES.length];
    e.slideN++;
    this.slideTitle.setText(mat);
    this.slideBody.setText(txt);
    this.slideStamp.setAlpha(0).setScale(2.2);
    this.speech(e, 'Quem sabe a resposta?');
    Sfx.tone(520, 0.08, { type: 'square', vol: 0.05 });
  },

  // ERRADO! carimbado em cima do slide (mesmo quando está certo)
  stampErrado(e) {
    this.tweens.add({ targets: this.slideStamp, alpha: 1, scale: 1, duration: 160, ease: 'Back.out' });
    this.shake(120, 0.005);
    Sfx.tone(160, 0.35, { type: 'sawtooth', to: 90, vol: 0.12 });
    Sfx.voice('eva');
    this.speech(e, Phaser.Utils.Array.GetRandom(EVA_LINES));
  },

  evaChalk(e) {
    const pb = this.player.body;
    const a = Math.atan2(pb.center.y - e.y, pb.center.x - e.x);
    const s = this.shots.create(e.x, e.y - 12, 'giz');
    s.body.setSize(12, 5);
    s.setRotation(a);
    s.setVelocity(Math.cos(a) * 250, Math.sin(a) * 250);
    this.time.delayedCall(2200, () => s.active && s.destroy());
    Sfx.tone(900, 0.05, { type: 'triangle', to: 500, vol: 0.05 });
  },

  // Um "X" de errado cai do teto; antes de cair, aparece a marca no chão
  evaDropX(x) {
    const GY = 14 * TILE;
    const mark = this.add.image(x, GY - 6, 'errado').setAlpha(0.15).setScale(0.8).setDepth(2).setTint(0xff6666);
    this.tweens.add({
      targets: mark, alpha: 0.75, duration: 650,
      onComplete: () => {
        mark.destroy();
        if (this.finished) return;
        const s = this.shots.create(x, 24, 'errado');
        s.body.setAllowGravity(false).setSize(22, 22).setOffset(4, 4);
        s.setVelocityY(320).setDepth(7);
        this.time.delayedCall(2200, () => s.active && s.destroy());
      },
    });
  },

  // Levou uma pisada (ela só leva dano quando está cansada)
  evaHurt(e) {
    e.state = 'stun'; e.timer = 1.1; e.vulnerable = false;
    this.speech(e, Phaser.Utils.Array.GetRandom(['Aluno não pisa na professora! TÁ ERRADO!', 'ISSO É ERRADO!', 'Vai pra diretoria!']));
    this.shake(160, 0.008);
    Sfx.tone(200, 0.25, { type: 'sawtooth', to: 60, vol: 0.1 });
  },

  evaDefeated(e) {
    if (e.cartaz) { e.cartaz.destroy(); e.cartaz = null; }
    if (this.evaBar) this.evaBar.destroy();
    if (this.evaName) this.evaName.destroy();
    this.shots.clear(true, true);
    this.slideTitle.setText('RESULTADO');
    this.slideBody.setText('Tá... certo!\nNOTA 10');
    this.slideStamp.setText('APROVADO!').setColor('#1a9a3a').setAlpha(1).setScale(1);
    this.speech(e, 'Tá certo! Pode passar de ano...');
    Achievements.unlock('eva');
    this.addScore(3000, e.x, e.y - 50, 'NOTA 10!  +3000');
    this.time.delayedCall(1500, () => { if (!this.finished) this.reachGoal(); });
  },
};

Object.assign(GameScene.prototype, EvaMixin);
