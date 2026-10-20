// Transforma o mapa em texto (levels.js) em blocos do tilemap + lista de objetos.
function parseLevel(rows, theme = {}) {
  const [topTile, fillTile] = GROUNDS[theme.ground] || GROUNDS.grama;
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(width, ' '));
  const tiles = [];
  const objects = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const ch = grid[y][x];
      if (ch === '#') row.push(y > 0 && grid[y - 1][x] === '#' ? fillTile : topTile);
      else if (ch === '=') row.push(BLOCKS[theme.block] !== undefined ? BLOCKS[theme.block] : TILES.BRICK);
      else if (ch === 'R') row.push(TILES.ROCK);
      else if (ch === '-') row.push(TILES.ONEWAY);
      else {
        row.push(-1);
        if (ch !== ' ') objects.push({ ch, x, y });
      }
    }
    tiles.push(row);
  }
  return { width, height, tiles, objects };
}

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.levelIndex = data.level || 0;
    this.stats = { coins: 0, deaths: 0, time: 0, score: 0, lives: difficulty().lives, lifeCoins: 0, ...data.stats };
    this.hasDoubleJump = false; // Tênis de Mola
    this.airJumps = 0;
    this.magnetTime = 0;        // Ímã de Aura
    this.mogsIn67 = 0;
    this.stareTime = 0;         // Olhar de Mil Jardas (tempo parado)
    this.hasWings = false;      // Anjo Caído: planar
    this.haloAvailable = false; // Anjo Caído: salva de uma queda
    this.lastSafe = null;       // último chão firme (pra auréola te levar de volta)
    this.glideTime = 0;
    this.boss = null;
    this.bossSpawn = null;
    this.fog = null;
    this.levelDeaths = 0;
    this.totalText = null;
    this.combo = 0;       // inimigos seguidos sem tocar o chão
    this.startStats = { ...this.stats };
    this.levelTime = 0;
    this.levelCoins = 0;
    this.totalCoins = 0;
    this.dead = false;
    this.finished = false;
    this.checkpoint = null;
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumping = false;
    this.wasOnGround = true;
    this.squash = 0;
    this.powerTime = 0;   // tempo restante do modo 67
    this.hasAura = false; // escudo de aura ativo
    this.invuln = 0;      // segundos piscando depois de perder a aura
    this.touch ={ left: false, right: false, jump: false, jumpPressed: false };
  }

  create() {
    const def = LEVELS[this.levelIndex];
    const theme = THEMES[def.theme] || THEMES.dia;
    const level = parseLevel(def.map, theme);
    this.mapW = level.width * TILE;
    this.mapH = level.height * TILE;

    this.backdrop = createBackdrop(this, theme, true);
    this.themeKey = def.theme;
    this.levelSong = theme.music || (SONGS[def.theme] ? def.theme : 'dia');
    Music.play(this.levelSong);
    Progress.saveRun(this.levelIndex, this.startStats); // para o "Continuar" do menu

    // --- Tilemap ---
    const map = this.make.tilemap({ data: level.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles');
    this.layer = map.createLayer(0, tileset, 0, 0);
    const solid = Object.values(TILES).filter((i) => i !== TILES.ONEWAY);
    this.layer.setCollision(solid);
    // Plataforma de madeira: só colide por cima (dá pra pular através dela por baixo).
    this.layer.forEachTile((t) => { if (t.index === TILES.ONEWAY) t.setCollision(false, false, true, false); });

    // Sem chão embaixo do mapa: cair = morrer.
    this.physics.world.setBounds(0, 0, this.mapW, this.mapH + 400, true, true, true, false);

    // --- Objetos ---
    this.coins = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.powerups = this.physics.add.staticGroup();
    this.shots = this.physics.add.group({ allowGravity: false }); // bolas do Galvão
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true }); // plataformas que se movem
    this.springs = this.physics.add.staticGroup(); // trampolins
    this.crumbles = this.physics.add.staticGroup(); // plataformas que caem
    this.spawn = { x: 2 * TILE, y: 13 * TILE };

    for (const o of level.objects) {
      const cx = o.x * TILE + TILE / 2;
      const cy = o.y * TILE + TILE / 2;
      const bottom = o.y * TILE + TILE;
      switch (o.ch) {
        case 'P':
          this.spawn = { x: cx, y: bottom };
          break;
        case 'O': { // plataforma que vai e volta (3 blocos de largura)
          const m = this.movers.create(cx, cy, 'plataforma');
          m.body.setAllowGravity(false).setImmovable(true).setSize(96, 12).setOffset(0, 2);
          m.startX = cx; m.range = 2.5 * TILE; m.speed = 70;
          m.setVelocityX(m.speed);
          break;
        }
        case 'X': { // plataforma que cai (some meio segundo depois que você pisa)
          const c = this.crumbles.create(cx, cy, 'crumble');
          c.homeX = cx; c.homeY = cy; c.state = 'idle';
          break;
        }
        case 'Z': // trampolim
          this.springs.create(cx, bottom, 'mola').setOrigin(0.5, 1).refreshBody();
          break;
        case 'F': { // pombo voador
          const e = this.spawnEnemy('pombo', cx, cy + 10, { behavior: 'flyer', speed: 75 });
          e.body.setAllowGravity(false);
          e.startX = cx; e.baseY = cy; e.range = 4 * TILE; e.phase = Math.random() * 6;
          e.play('pombo_fly');
          break;
        }
        case 'B': // meio da arena do chefão final
          this.bossSpawn = { x: cx, y: bottom };
          break;
        case 'C': {
          const coin = this.coins.create(cx, cy, 'coin');
          this.tweens.add({ targets: coin, scaleX: 0.25, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (o.x * 60) % 500 });
          this.totalCoins++;
          break;
        }
        case 'E': {
          const e = this.spawnEnemy(theme.enemy || 'slime', cx, bottom, { behavior: 'walker', speed: PHYS.enemySpeed });
          this.tweens.add({ targets: e, angle: { from: -5, to: 5 }, duration: 300, yoyo: true, repeat: -1 });
          break;
        }
        case 'b': case 'p': case 'c': case 'l': case 'r': { // memes brainrot
          const m = MEMES[o.ch];
          const e = this.spawnEnemy(m.key, cx, bottom, m);
          e.famous = m;   // reaproveita as falas
          e.hp = m.hp || 1;
          e.timer = Phaser.Math.FloatBetween(1, 2.5);
          e.talkTimer = Phaser.Math.FloatBetween(1, 5);
          if (m.behavior === 'bomber') {
            e.body.setAllowGravity(false);
            e.startX = cx; e.range = 6 * TILE;
            e.play('bombardiro_fly');
          } else if (m.behavior === 'walker') {
            this.tweens.add({ targets: e, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1 });
          }
          break;
        }
        case 'N': case 'V': case 'J': case 'D': { // famosos
          const f = FAMOUS[o.ch];
          const e = this.spawnEnemy(f.key, cx, bottom, f);
          e.faceRight = true;
          e.famous = f;
          e.timer = Phaser.Math.FloatBetween(0.5, 2);
          e.talkTimer = Phaser.Math.FloatBetween(1, 4);
          break;
        }
        case '^': {
          this.add.image(cx, cy, theme.spike || 'spike');
          // Hitbox menor que o desenho, para ser justo com o jogador.
          const hit = this.add.zone(cx, bottom - 7, 24, 12);
          this.spikes.add(hit);
          break;
        }
        case '6': // poder 67
        case 'A': { // poder aura
          const p = this.powerups.create(cx, cy, o.ch === '6' ? 'pw67' : 'aura');
          p.kind = o.ch === '6' ? '67' : 'aura';
          this.tweens.add({ targets: p, y: cy - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          if (p.kind === 'aura') this.tweens.add({ targets: p, scale: 1.15, alpha: 0.8, duration: 400, yoyo: true, repeat: -1 });
          break;
        }
        case 'H': case 'T': case 'M': case 'Q': case 'W': { // coxinha, tênis, ímã, olhar de mil jardas, anjo caído
          const kind = { H: 'coxinha', T: 'tenis', M: 'ima', Q: 'olhar', W: 'anjo' }[o.ch];
          const tex = { olhar: 'pw_olhar', anjo: 'pw_anjo' }[kind] || kind;
          const p = this.powerups.create(cx, cy, tex);
          p.kind = kind;
          this.tweens.add({ targets: p, y: cy - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          break;
        }
        case 'Y': // coqueiro (só enfeite, não colide)
          this.add.image(cx, bottom + 4, 'palm').setOrigin(0.5, 1).setDepth(-1);
          break;
        case 'L': // poste de luz (enfeite)
          this.add.image(cx + 6, bottom, 'poste').setOrigin(0.5, 1).setDepth(-1);
          break;
        case 'S': // Escola Zacarias (enfeite grandão)
          this.add.image(cx, bottom, 'escola').setOrigin(0.5, 1).setDepth(-2);
          break;
        case 'K':
          this.checkpoints.create(cx, bottom, 'cp_off').setOrigin(0.5, 1).refreshBody();
          break;
        case 'G':
          this.goal = this.physics.add.staticImage(cx, bottom, 'goal').setOrigin(0.5, 1).refreshBody();
          break;
      }
    }

    // --- Jogador ---
    // O corpo físico fica invisível; o desenho (playerGfx) segue o corpo e pode esticar/achatar à vontade.
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y - 16, playerTexture()).setVisible(false);
    this.player.body.setSize(20, 28);
    this.player.body.setMaxVelocity(500, 900);
    this.player.setCollideWorldBounds(true);
    this.decorate(level, def.theme);
    // sombrinha embaixo do Brunucho
    this.shadow = this.add.ellipse(0, 0, 24, 7, 0x000000, 0.28).setDepth(4);
    this.playerGfx = this.add.sprite(0, 0, playerTexture()).setOrigin(0.5, 1).setDepth(5);
    this.playerBase = playerTexture();
    // Habilidades: asas e auréola (Anjo Caído), cara de "olhar vazio" (Olhar de Mil Jardas)
    this.wings = this.add.sprite(0, 0, 'asas').setDepth(4.8).setVisible(false);
    this.haloImg = this.add.image(0, 0, 'aureola').setDepth(6).setVisible(false);
    this.stareFace = this.add.image(0, 0, 'olhar_face').setOrigin(0, 0).setDepth(5.5).setVisible(false);
    this.fxFeather = this.add.particles(0, 0, 'pena', {
      lifespan: 900, speed: { min: 20, max: 80 }, gravityY: 60, rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(6);
    // sombreado suave nos cantos da tela
    if (this.cameras.main.postFX) this.cameras.main.postFX.addVignette(0.5, 0.5, 0.92, 0.28);
    // Plaquinha com o nome em cima do personagem (some depois de alguns segundos)
    this.nameTag = this.add.text(0, 0, PLAYER_NAME, textStyle(14, '#ffd23f')).setOrigin(0.5, 1).setDepth(6);
    this.tweens.add({ targets: this.nameTag, alpha: 0, delay: 3500, duration: 800 });
    // Brilho do escudo de aura (fica escondido até pegar o poder)
    this.auraGlow = this.add.ellipse(0, 0, 46, 54, 0x8f6bff, 0.35).setStrokeStyle(3, 0x7ff6ff, 0.9)
      .setDepth(4).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.auraGlow, scale: 1.12, alpha: 0.6, duration: 450, yoyo: true, repeat: -1 });

    // --- Colisões ---
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.spikes, () => this.die('espinho'), null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPower, null, this);
    // Plataforma móvel: só segura quem cai por cima (dá pra atravessar por baixo)
    this.physics.add.collider(this.player, this.movers, null,
      (pl, m) => pl.body.velocity.y >= 0 && pl.body.bottom <= m.body.top + 10, this);
    this.physics.add.overlap(this.player, this.springs, this.bounceSpring, null, this);
    this.physics.add.collider(this.player, this.crumbles, this.stepCrumble,
      (pl, c) => c.state !== 'gone' && pl.body.velocity.y >= 0 && pl.body.bottom <= c.body.top + 10, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.shots, (pl, shot) => {
      if (this.powerTime > 0) { shot.destroy(); return; }
      shot.destroy();
      this.die('inimigo');
    }, null, this);
    this.physics.add.collider(this.shots, this.layer, (shot) => {
      if (shot.isBomb) this.explode(shot.x, shot.y);
      shot.destroy();
    });
    this.physics.add.overlap(this.player, this.checkpoints, this.reachCheckpoint, null, this);
    if (this.goal) this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // --- Partículas ---
    const burst = (tint, extra = {}) => this.add.particles(0, 0, 'px', {
      lifespan: 500, speed: { min: 60, max: 220 }, scale: { start: 1, end: 0 }, gravityY: 500, tint, emitting: false, ...extra,
    }).setDepth(6);
    this.fxDust = burst(0xe8e0c8, { lifespan: 350, speed: { min: 20, max: 90 }, angle: { min: 200, max: 340 }, gravityY: 100 });
    this.fxCoin = burst(0xffd23f, { lifespan: 400 });
    this.fxHit = burst([0xff7a3d, 0xd94f1e, 0xffffff], { lifespan: 700, speed: { min: 100, max: 320 } });
    const enemyColors = {
      caramelo: [0xd9963f, 0xf2c27e], capivara: [0x8a6142, 0xff9a1f], tralalero: [0x5d97d6, 0xffffff],
      tungtung: [0xc89a5e, 0x7a4a24], crab: [0xe84a2f, 0xff7a5c],
    };
    this.fxSlime = burst(enemyColors[theme.enemy] || [0x9b4dca, 0xc58af0]);
    this.fxPower = burst([0xffd23f, 0xff5e00, 0xffffff], { lifespan: 300, speed: { min: 10, max: 60 }, gravityY: -100 });
    this.fxAura = burst([0x7ff6ff, 0x9f7bff, 0xffffff], { lifespan: 700, speed: { min: 80, max: 260 }, gravityY: 0 });
    this.fxParty = burst([0xffd23f, 0x2ecc71, 0x34d1ff, 0xff4f6d], { lifespan: 1400, speed: { min: 150, max: 400 }, angle: { min: 240, max: 300 }, gravityY: 400 });

    // Garoa paulistana
    if (theme.rain) {
      this.add.particles(0, -20, 'px', {
        x: { min: 0, max: WIDTH + 100 }, lifespan: 1100, speedY: { min: 520, max: 640 }, speedX: { min: -90, max: -60 },
        scaleX: 0.25, scaleY: 1.6, alpha: 0.35, tint: 0xd5dde8, frequency: 12, quantity: 2,
      }).setScrollFactor(0).setDepth(50);
    }

    this.addAmbient(theme);
    this.addWelcomeSign(def, theme);

    // --- Câmera ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapW, this.mapH);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(60, 80);
    cam.fadeIn(300);

    // --- Controles ---
    this.keys = this.input.keyboard.addKeys('W,A,D,UP,LEFT,RIGHT,SPACE,R');
    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard.on('keydown-P', () => this.pauseGame());
    this.input.keyboard.on('keydown-M', () => Sfx.toggle());
    // O pulo é registrado no evento da tecla: assim nem um toque rapidinho se perde
    this.jumpQueued = false;
    ['SPACE', 'UP', 'W'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, (ev) => { if (!ev.repeat) this.jumpQueued = true; }));    this.createTouchControls();

    this.createHud(def);
    if (this.bossSpawn) this.setupBoss(); // fase do chefão final (boss.js)

    // Modo de visualização: index.html?fase=1&mapa=1 mostra a fase inteira.
    if (new URLSearchParams(window.location.search).get('mapa')) {
      cam.stopFollow();
      cam.removeBounds();
      cam.setZoom(WIDTH / this.mapW);
      cam.centerOn(this.mapW / 2, this.mapH / 2);
    }
  }

  // ---------------------------------------------------------------- Clima e placa de boas-vindas

  // theme.ambient: 'neblina', 'poeira', 'folhas' ou 'vagalumes' (a chuva é o theme.rain)
  addAmbient(theme) {
    const a = theme.ambient;
    if (!a) return;
    const fix = (e) => e.setScrollFactor(0).setDepth(45);
    if (a === 'neblina') {
      this.fog = [0, 1].map((i) => this.add.tileSprite(0, 200 + i * 70, WIDTH, 240, 'fog').setOrigin(0)
        .setScrollFactor(0).setDepth(30).setAlpha(0.5 - i * 0.18));
    } else if (a === 'poeira') {
      fix(this.add.particles(-10, 0, 'px', {
        y: { min: 240, max: 520 }, speedX: { min: 150, max: 260 }, speedY: { min: -12, max: 12 }, lifespan: 4800,
        scale: { start: 1.4, end: 0.6 }, alpha: { start: 0.55, end: 0 }, tint: theme.dust || 0xe0c090, frequency: 70,
      }));
    } else if (a === 'folhas') {
      fix(this.add.particles(0, -10, 'px', {
        x: { min: 0, max: WIDTH + 60 }, speedY: { min: 30, max: 75 }, speedX: { min: -45, max: 20 }, lifespan: 7000,
        rotate: { min: 0, max: 360 }, scale: { start: 1.4, end: 1 }, tint: [0x4caf50, 0x8bc34a, 0xc0a030, 0x2e7d32], frequency: 380,
      }));
    } else if (a === 'vagalumes') {
      fix(this.add.particles(0, 0, 'px', {
        x: { min: 0, max: WIDTH }, y: { min: 220, max: 440 }, speed: { min: 6, max: 22 }, lifespan: 3200,
        scale: { start: 1.6, end: 0.8 }, alpha: { start: 1, end: 0 }, tint: [0xeaff7a, 0xfff3a0], frequency: 260,
        blendMode: Phaser.BlendModes.ADD,
      }));
    }
  }

  // Placa de madeira "BEM-VINDO" logo depois do começo das fases dos estados e das cidades
  addWelcomeSign(def, theme) {
    if (!(theme.uf || ['sp', 'rio', 'bahia'].includes(def.theme))) return;
    const x = this.spawn.x + 4 * TILE, y = this.spawn.y;
    const g = this.add.graphics().setDepth(-1.5);
    g.fillStyle(0x4a2e14); g.fillRect(x - 38, y - 64, 6, 64); g.fillRect(x + 32, y - 64, 6, 64);
    g.fillStyle(0x3b2410); g.fillRoundedRect(x - 60, y - 100, 120, 50, 7);
    g.fillStyle(0x8a5a2b); g.fillRoundedRect(x - 58, y - 98, 116, 46, 6);
    g.lineStyle(2, 0xffd23f); g.strokeRoundedRect(x - 55, y - 95, 110, 40, 5);
    this.add.text(x, y - 88, 'BEM-VINDO', { ...textStyle(10, '#ffe9a0'), strokeThickness: 2 }).setOrigin(0.5).setDepth(-1.4);
    this.add.text(x, y - 71, def.name.replace(': Chefão Final', ''),
      { ...textStyle(def.name.length > 12 ? 12 : 15, '#ffffff'), align: 'center', wordWrap: { width: 104 }, strokeThickness: 3 })
      .setOrigin(0.5).setDepth(-1.4);
  }

  // ---------------------------------------------------------------- Decoração automática

  decorate(level, themeKey) {
    const set = DECOR_SETS[(THEMES[themeKey] || {}).decor || themeKey] || DECOR_SETS.dia;
    const { tiles, width: W, height: H } = level;
    const solid = (x, y) => x >= 0 && x < W && y >= 0 && y < H && tiles[y][x] !== -1 && tiles[y][x] !== TILES.ONEWAY;
    const empty = (x, y) => x >= 0 && x < W && y >= 0 && y < H && tiles[y][x] === -1;
    const used = new Set(level.objects.map((o) => `${o.x},${o.y}`));
    const keepClear = level.objects.filter((o) => 'PKGSB'.includes(o.ch)).map((o) => o.x);
    // número "aleatório" fixo por posição (a fase fica sempre igual)
    const rnd = (x, y, k) => {
      let h = Math.imul(x * 374761393 + y * 668265263 + (this.levelIndex + 1) * 2246822519 + k * 3266489917, 1);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    let lastBig = -99;
    for (let y = 1; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!solid(x, y)) continue;
        // sombra nas laterais e embaixo dos blocos
        if (empty(x - 1, y)) this.add.image(x * TILE, y * TILE, 'edgeL').setOrigin(0).setDepth(0.5);
        if (empty(x + 1, y)) this.add.image(x * TILE, y * TILE, 'edgeR').setOrigin(0).setDepth(0.5);
        if (y + 1 < H && empty(x, y + 1)) this.add.image(x * TILE, y * TILE, 'edgeB').setOrigin(0).setDepth(0.5);
        // decoração em cima do chão
        if (!empty(x, y - 1) || used.has(`${x},${y - 1}`) || used.has(`${x},${y - 2}`)) continue;
        if (keepClear.some((cx) => Math.abs(cx - x) <= 2)) continue;
        if (rnd(x, y, 1) > 0.24) continue;
        let key = set[Math.floor(rnd(x, y, 2) * set.length)];
        if (BIG_DECOR.has(key)) {
          const roomy = solid(x - 1, y) && solid(x + 1, y) && empty(x - 1, y - 1) && empty(x + 1, y - 1);
          if (!roomy || x - lastBig < 6) key = set.find((k) => !BIG_DECOR.has(k));
          else lastBig = x;
        }
        const jitter = (rnd(x, y, 3) - 0.5) * 12;
        this.add.image(x * TILE + TILE / 2 + jitter, y * TILE + 1, key).setOrigin(0.5, 1).setDepth(-1)
          .setFlipX(rnd(x, y, 4) < 0.5);
      }
    }
  }

  // ---------------------------------------------------------------- HUD

  createHud(def) {
    const fixed = (obj) => obj.setScrollFactor(0).setDepth(100);
    // painéis escurinhos atrás do HUD (fica mais fácil de ler em qualquer cenário)
    const panel = this.add.graphics().setScrollFactor(0).setDepth(99);
    panel.fillStyle(0x0b0b14, 0.35);
    panel.fillRoundedRect(6, 6, 222, 96, 12);
    panel.fillRoundedRect(WIDTH - 166, 6, 160, 66, 12);
    fixed(this.add.image(30, 30, 'coin'));
    this.coinText = fixed(this.add.text(48, 18, '', textStyle(22)));
    this.timeText = fixed(this.add.text(WIDTH - 16, 16, '', textStyle(22)).setOrigin(1, 0));
    this.deathText = fixed(this.add.text(WIDTH - 16, 46, '', textStyle(18, '#ffb3b3')).setOrigin(1, 0));
    this.scoreText = fixed(this.add.text(16, 48, '', textStyle(22, '#ffe9a0')));
    this.auraText = fixed(this.add.text(16, 108, '', textStyle(16, '#7ff6ff')));
    fixed(this.add.image(28, 92, 'heart'));
    this.livesText = fixed(this.add.text(44, 80, '', textStyle(20, '#ff9aae')));
    this.shownScore = this.stats.score;
    this.powerText = fixed(this.add.text(WIDTH / 2, 20, '', textStyle(26, '#ffb000')).setOrigin(0.5, 0));
    this.updateHud();

    const banner = fixed(this.add.text(WIDTH / 2, HEIGHT / 2 - 60, `Fase ${this.levelIndex + 1}\n${def.name}`,
      { ...textStyle(44, '#ffd23f'), align: 'center', strokeThickness: 8 }).setOrigin(0.5));
    this.tweens.add({ targets: banner, alpha: 0, y: banner.y - 30, delay: 1300, duration: 600, onComplete: () => banner.destroy() });
  }

  updateHud() {
    this.coinText.setText(`${this.levelCoins}/${this.totalCoins}`);
    this.timeText.setText(formatTime(this.levelTime));
    this.deathText.setText(`Mortes: ${this.stats.deaths}`);
    // O placar "corre" até o valor certo
    this.shownScore += (this.stats.score - this.shownScore) * 0.2;
    if (Math.abs(this.stats.score - this.shownScore) < 1) this.shownScore = this.stats.score;
    this.scoreText.setText(`PONTOS ${formatScore(this.shownScore)}`);
    if (this.totalText) this.totalText.setText(`TOTAL  ${formatScore(this.shownScore)}`);
    this.livesText.setText(`x${this.stats.lives}`);
    const status = [];
    if (this.hasAura) status.push('✦ escudo de aura');
    if (this.hasDoubleJump) status.push('👟 pulo duplo');
    if (this.magnetTime > 0) status.push(`🧲 ímã ${this.magnetTime.toFixed(0)}s`);
    if (this.stareTime > 0) status.push(`👁️ ${this.stareTime.toFixed(0)}s`);
    if (this.hasWings) status.push(this.haloAvailable ? '😇 asas + auréola' : '🪽 asas');
    this.auraText.setText(status.join('   '));
    this.powerText.setText(this.powerTime > 0 && !this.finished ? `SIX SEVEN! ${this.powerTime.toFixed(1)}s` : '');
  }

  addScore(points, x, y, label) {
    this.stats.score = Math.max(0, this.stats.score + points);
    if (x !== undefined) {
      const sign = points >= 0 ? '+' : '';
      this.floatText(x, y, label || `${sign}${points}`, points >= 0 ? '#ffe9a0' : '#ff6b6b', 18);
    }
  }

  // "MOGGADO!" estourando em cima do inimigo derrotado
  moggedText(x, y) {
    if (Math.random() < 0.6) Sfx.say('moggado!', { rate: 1.3, pitch: 1.3 });
    const t = this.add.text(x, y, 'MOGGADO!', { ...textStyle(26, '#ff3df2'), strokeThickness: 6 })
      .setOrigin(0.5).setDepth(125).setScale(0.2).setAngle(Phaser.Math.Between(-12, 12));
    t.setShadow(0, 0, '#7ff6ff', 12, true, true);
    this.tweens.add({ targets: t, scale: 1.15, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, delay: 650, duration: 450, ease: 'Quad.in', onComplete: () => t.destroy() });
  }

  // Texto que sobe e some (ex.: "+100 aura")
  floatText(x, y, text, color = '#ffffff', size = 18) {
    const t = this.add.text(x, y, text, textStyle(size, color)).setOrigin(0.5).setDepth(120);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1000, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  createTouchControls() {
    if (!this.sys.game.device.input.touch) return;
    this.input.addPointer(2);
    const button = (x, label, onDown, onUp) => {
      const c = this.add.circle(x, HEIGHT - 70, 46, 0xffffff, 0.18).setScrollFactor(0).setDepth(200).setInteractive();
      this.add.text(x, HEIGHT - 70, label, textStyle(30)).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0.8);
      c.on('pointerdown', onDown);
      c.on('pointerup', onUp);
      c.on('pointerout', onUp);
    };
    button(80, '◀', () => { this.touch.left = true; }, () => { this.touch.left = false; });
    button(195, '▶', () => { this.touch.right = true; }, () => { this.touch.right = false; });
    button(WIDTH - 80, '▲', () => { this.touch.jump = true; this.touch.jumpPressed = true; }, () => { this.touch.jump = false; });
    // botão de pausa (canto de cima, abaixo do tempo)
    const pause = this.add.circle(WIDTH - 40, 104, 26, 0xffffff, 0.22).setScrollFactor(0).setDepth(200).setInteractive();
    this.add.text(WIDTH - 40, 104, 'II', textStyle(22)).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    pause.on('pointerdown', () => this.pauseGame());
  }

  // ---------------------------------------------------------------- Loop principal

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.backdrop.update(this.cameras.main.scrollX, time);
    if (this.fog) this.fog.forEach((f, i) => { f.tilePositionX = time * 0.012 * (i + 1) + this.cameras.main.scrollX * (0.35 + i * 0.25); });
    this.updateEnemies(Math.min(delta, 50) / 1000);
    const pb = this.player.body;
    this.movers.children.iterate((m) => {
      if (!m) return;
      if (m.x > m.startX + m.range) m.setVelocityX(-m.speed);
      else if (m.x < m.startX - m.range) m.setVelocityX(m.speed);
      // Quem está em pé em cima vai junto com a plataforma
      const mb = m.body;
      const onTop = !this.dead && pb.touching.down && Math.abs(pb.bottom - mb.top) < 3
        && pb.right > mb.left && pb.left < mb.right;
      if (onTop) this.player.x += mb.deltaX();
    });
    if (this.boss) this.updateBoss(dt);

    if (this.dead || this.finished) { this.syncPlayerGfx(time); this.updateHud(); return; }

    const k = this.keys;
    const JustDown = Phaser.Input.Keyboard.JustDown;
    if (JustDown(k.R)) { this.restartLevel(); return; }

    const p = this.player;
    const b = p.body;
    const left = k.LEFT.isDown || k.A.isDown || this.touch.left;
    const right = k.RIGHT.isDown || k.D.isDown || this.touch.right;
    const jumpHeld = k.SPACE.isDown || k.UP.isDown || k.W.isDown || this.touch.jump;
    const jumpPressed = this.jumpQueued || this.touch.jumpPressed;
    this.jumpQueued = false;
    this.touch.jumpPressed = false;
    const onGround = b.blocked.down || b.touching.down;

    // Poderes: modo 67 deixa mais rápido e com pulo maior
    this.updatePowers(dt, time);
    const boosted = this.powerTime > 0;
    const maxSpeed = PHYS.maxSpeed * (boosted ? 1.35 : 1);
    const jumpForce = PHYS.jump * (boosted ? 1.15 : 1);

    // Movimento horizontal com aceleração e freio
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    let vx = b.velocity.x;
    if (dir !== 0) {
      let accel = onGround ? PHYS.groundAccel : PHYS.airAccel;
      if (vx !== 0 && Math.sign(vx) !== dir) accel *= 2; // virar rápido
      vx = Phaser.Math.Clamp(vx + dir * accel * dt, -maxSpeed, maxSpeed);
      this.facing = dir;
    } else {
      const decel = (onGround ? PHYS.groundDecel : PHYS.airDecel) * dt;
      vx = Math.abs(vx) <= decel ? 0 : vx - Math.sign(vx) * decel;
    }
    p.setVelocityX(vx);

    // Pulo com "coyote time" e "jump buffer" (deixa o controle bem mais gostoso)
    this.coyote = onGround ? PHYS.coyote : this.coyote - dt;
    this.jumpBuffer = jumpPressed ? PHYS.jumpBuffer : this.jumpBuffer - dt;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      p.setVelocityY(-jumpForce);
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.jumping = true;
      this.squash = 0.3;
      Sfx.jump();
      this.fxDust.explode(6, b.center.x, b.bottom);
    } else if (jumpPressed && this.coyote <= 0 && this.hasDoubleJump && this.airJumps > 0) {
      // Pulo duplo do Tênis de Mola
      p.setVelocityY(-jumpForce * 0.9);
      this.airJumps--;
      this.jumpBuffer = 0;
      this.jumping = true;
      this.squash = 0.35;
      Sfx.doubleJump();
      this.fxAura.explode(10, b.center.x, b.bottom);
    }
    if (onGround) this.airJumps = 1;
    // Soltou o botão no meio da subida: pulo mais curto
    if (this.jumping && !jumpHeld && b.velocity.y < 0) {
      p.setVelocityY(b.velocity.y * PHYS.jumpCut);
      this.jumping = false;
    }
    if (b.velocity.y >= 0) this.jumping = false;

    if (onGround) this.combo = 0;

    // Anjo Caído: segurando pular enquanto cai, plana devagar
    if (this.hasWings && !onGround && jumpHeld && b.velocity.y > 70) {
      p.setVelocityY(70);
      this.glideTime += dt;
      if (Math.random() < 0.15) this.fxFeather.emitParticleAt(b.center.x + Phaser.Math.Between(-14, 14), b.center.y);
      if (this.glideTime > 3) Achievements.unlock('planador');
    } else if (onGround) {
      this.glideTime = 0;
    }
    // guarda o último chão firme (pra auréola te levar de volta se cair num buraco)
    if (b.blocked.down) this.lastSafe = { x: b.center.x, y: b.bottom };

    // Aterrissagem
    if (onGround && !this.wasOnGround) {
      this.squash = -0.25;
      this.fxDust.explode(5, b.center.x, b.bottom);
    }
    this.wasOnGround = onGround;

    if (b.top > this.mapH) this.die('queda');

    this.levelTime += dt;
    this.updateHud();
    this.syncPlayerGfx(time);
  }

  updatePowers(dt, time) {
    const g = this.playerGfx;
    if (this.powerTime > 0) {
      this.powerTime -= dt;
      // Pisca em cores do arco-íris e solta faísca
      g.setTint(Phaser.Display.Color.HSVToRGB((time * 0.002) % 1, 0.6, 1).color);
      if (Math.random() < 0.5) this.fxPower.emitParticleAt(g.x + Phaser.Math.Between(-8, 8), g.y - Phaser.Math.Between(0, 30));
      if (this.powerTime <= 0) {
        this.powerTime = 0;
        g.clearTint();
        this.floatText(g.x, g.y - 50, 'acabou o 67...', '#ffd9a0', 16);
        Music.play(this.levelSong);
      }
    }
    // Olhar de Mil Jardas: conta o tempo parado
    if (this.stareTime > 0) {
      this.stareTime -= dt;
      if (this.stareTime <= 0) this.endStare();
    }
    // Ímã de Aura: puxa as moedas por perto
    if (this.magnetTime > 0) {
      this.magnetTime -= dt;
      const pb = this.player.body;
      this.coins.children.iterate((c) => {
        if (!c || !c.body || !c.body.enable) return;
        const dx = pb.center.x - c.x, dy = pb.center.y - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 190 && dist > 1) {
          const sp = Math.min(dist, 520 * dt);
          c.x += (dx / dist) * sp; c.y += (dy / dist) * sp;
          c.body.updateFromGameObject();
        }
      });
    }
    if (this.invuln > 0) {
      this.invuln -= dt;
      g.setAlpha(this.invuln > 0 && Math.floor(time / 80) % 2 ? 0.3 : 1);
    }
  }

  // O desenho do jogador estica no pulo, achata na queda e balança ao correr.
  syncPlayerGfx(time) {
    const b = this.player.body;
    this.squash *= 0.85;
    let bob = 0;
    if (!this.dead && b.blocked.down && Math.abs(b.velocity.x) > 30) bob = Math.sin(time * 0.03) * 0.06;
    const s = this.squash + bob;
    // Animação: parado, andando ou pulando
    const g = this.playerGfx;
    if (!b.blocked.down && !this.dead) {
      g.anims.stop(); g.setTexture(`${this.playerBase}_jump`);
    } else if (Math.abs(b.velocity.x) > 30 && !this.dead) {
      if (!g.anims.isPlaying) g.play(`${this.playerBase}_walk`);
      g.anims.timeScale = Math.abs(b.velocity.x) / PHYS.maxSpeed * 1.4;
    } else {
      g.anims.stop(); g.setTexture(this.playerBase);
    }
    this.playerGfx
      .setPosition(b.x + b.halfWidth, b.y + b.height)
      .setScale(1 - s * 0.6, 1 + s)
      .setFlipX(this.facing < 0)
      .setAngle(b.blocked.down ? 0 : Phaser.Math.Clamp(b.velocity.x * 0.02, -6, 6));
    this.nameTag.setPosition(this.playerGfx.x, this.playerGfx.y - 40).setVisible(this.playerGfx.visible);
    // sombra no chão logo abaixo (fica menor quanto mais alto ele está)
    let groundY = null;
    for (let y = b.bottom; y < b.bottom + 8 * TILE && y < this.mapH; y += 8) {
      const t = this.layer.getTileAtWorldXY(b.center.x, y);
      if (t && t.collides) { groundY = t.pixelY; break; }
    }
    if (groundY !== null && this.playerGfx.visible) {
      const k = Phaser.Math.Clamp(1 - (groundY - b.bottom) / (6 * TILE), 0.3, 1);
      this.shadow.setVisible(true).setPosition(b.center.x, groundY).setScale(k).setAlpha(k);
    } else {
      this.shadow.setVisible(false);
    }
    this.auraGlow.setPosition(this.playerGfx.x, this.playerGfx.y - 18).setVisible(this.hasAura && this.playerGfx.visible);
    const gx = this.playerGfx.x, gy = this.playerGfx.y, vis = this.playerGfx.visible;
    // asas: batem quando está no ar
    this.wings.setVisible(this.hasWings && vis).setPosition(gx, gy - 20);
    if (this.hasWings && vis && !b.blocked.down) { if (!this.wings.anims.isPlaying) this.wings.play('asas_flap'); }
    else { this.wings.anims.stop(); this.wings.setTexture('asas_2'); }
    this.haloImg.setVisible(this.haloAvailable && vis).setPosition(gx, gy - 41 + Math.sin(time * 0.005) * 2);
    // cara de olhar vazio por cima do rosto
    this.stareFace.setVisible(this.stareTime > 0 && vis).setFlipX(this.facing < 0)
      .setPosition(this.facing < 0 ? gx - 13 : gx + 1, gy - 28);
  }

  spawnEnemy(key, cx, bottom, cfg) {
    const h = this.textures.getFrame(key).height;
    const e = this.enemies.create(cx, bottom - h / 2, key);
    e.body.setSize(Math.min(24, e.width - 4), h - 2);
    e.setCollideWorldBounds(true);
    e.dir = -1;
    e.behavior = cfg.behavior;
    e.speed = cfg.speed * difficulty().enemySpeed;
    if (this.anims.exists(`${key}_walk`) && e.speed > 0) e.play(`${key}_walk`);
    e.state = 'walk';
    return e;
  }

  updateEnemies(dt) {
    const pb = this.player.body;
    this.enemies.children.iterate((e) => {
      if (!e || e.dead) return;
      const b = e.body;
      // Olhar de Mil Jardas: todo mundo parado
      if (this.stareTime > 0) {
        e.setVelocityX(0);
        if (!b.allowGravity) e.setVelocityY(0);
        if (e.anims && e.anims.isPlaying) e.anims.pause();
        return;
      }
      if (e.anims && e.anims.isPaused) e.anims.resume();
      const dx = pb.center.x - b.center.x;
      const near = Math.abs(dx) < 300 && Math.abs(pb.center.y - b.center.y) < 120 && !this.dead;

      // Famosos falam de vez em quando
      if (e.famous) {
        e.talkTimer -= dt;
        if (e.talkTimer <= 0 && Math.abs(dx) < 520) {
          e.talkTimer = Phaser.Math.FloatBetween(3, 6);
          this.speech(e, Phaser.Utils.Array.GetRandom(e.famous.lines));
        }
      }

      // Neymar caído/rolando: não segue a lógica de andar
      if (e.state === 'roll') {
        e.timer -= dt;
        e.angle += e.dir * 900 * dt;
        e.setVelocityX(e.dir * 200);
        if (b.blocked.left || b.blocked.right || this.atLedge(e)) e.timer = 0;
        if (e.timer <= 0) { e.state = 'fallen'; e.timer = 0.7; e.setVelocityX(0); e.setAngle(e.dir * 90); }
        return;
      }
      if (e.state === 'fallen') {
        e.timer -= dt;
        if (e.timer <= 0) { e.state = 'walk'; e.setAngle(0); e.timer = Phaser.Math.FloatBetween(2, 3.5); }
        return;
      }

      if (e.behavior === 'bomber') {
        // Bombardiro: voa reto e solta bomba quando passa por cima do Brunucho
        if (e.x > e.startX + e.range || b.blocked.right) e.dir = -1;
        else if (e.x < e.startX - e.range || b.blocked.left) e.dir = 1;
        e.setVelocity(e.dir * e.speed, 0);
        e.setFlipX(e.dir > 0);
        e.timer -= dt;
        if (e.timer <= 0 && Math.abs(dx) < 40 && pb.center.y > b.center.y && !this.dead) {
          e.timer = 2;
          this.dropBomb(e);
        }
        return;
      }
      if (e.behavior === 'hopper') {
        // Patapim: anda dando pulinhos (e não pula em buraco)
        if (b.blocked.down) {
          e.setVelocityX(0);
          if (b.blocked.left) e.dir = 1;
          if (b.blocked.right) e.dir = -1;
          e.timer -= dt;
          if (e.timer <= 0) {
            const landX = b.center.x + e.dir * 2 * TILE;
            if (!this.layer.getTileAtWorldXY(landX, b.bottom + 4)) e.dir *= -1;
            e.timer = Phaser.Math.FloatBetween(0.5, 1.1);
            e.setVelocity(e.dir * e.speed, -430);
          }
        }
        e.setFlipX(e.dir > 0);
        return;
      }
      if (e.behavior === 'dancer') {
        // Ballerina: fica dançando e, quando você chega perto, gira e avança
        e.timer -= dt;
        if (e.state === 'dash') {
          e.angle += 1080 * dt * e.dir;
          e.setVelocityX(e.dir * 260);
          if (b.blocked.left || b.blocked.right || this.atLedge(e) || e.timer <= 0) {
            e.state = 'walk'; e.setAngle(0); e.setVelocityX(0); e.timer = 2.2;
          }
          return;
        }
        e.setVelocityX(0);
        e.dir = dx > 0 ? 1 : -1;
        e.setFlipX(e.dir > 0);
        e.setAngle(Math.sin(this.time.now * 0.008) * 8);
        if (near && e.timer <= 0) {
          e.state = 'dash'; e.timer = 0.7;
          this.speech(e, 'Mi mi mi!');
        }
        return;
      }
      if (e.behavior === 'flyer') {
        // Pombo: vai e volta voando em ondinha
        if (e.x > e.startX + e.range || b.blocked.right) e.dir = -1;
        else if (e.x < e.startX - e.range || b.blocked.left) e.dir = 1;
        e.setVelocityX(e.dir * e.speed);
        e.setVelocityY(Math.cos(this.time.now * 0.004 + e.phase) * 50);
        e.setFlipX(e.dir > 0);
        return;
      }
      if (e.behavior === 'shooter') {
        // Galvão: fica parado, vira para o jogador e chuta bola
        e.setVelocityX(0);
        e.dir = dx > 0 ? 1 : -1;
        e.timer -= dt;
        if (near && e.timer <= 0) {
          e.timer = 2.2;
          this.shoot(e);
        }
      } else {
        if (b.blocked.left) e.dir = 1;
        else if (b.blocked.right) e.dir = -1;
        else if (b.blocked.down && this.atLedge(e)) e.dir *= -1;
        e.setVelocityX(e.dir * e.speed);

        if (e.behavior === 'jumper' && b.blocked.down) {
          // Cazé: pula do nada
          e.timer -= dt;
          if (e.timer <= 0) {
            e.timer = Phaser.Math.FloatBetween(1.2, 2.4);
            e.setVelocityY(-480);
            if (Math.random() < 0.5) this.speech(e, 'VAMO!');
          }
        }
        if (e.behavior === 'caicai' && b.blocked.down) {
          // Neymar: quando o jogador chega perto, se joga e sai rolando na direção dele
          e.timer -= dt;
          if (near && e.timer <= 0) {
            e.state = 'roll';
            e.timer = 1.1;
            e.dir = dx > 0 ? 1 : -1;
            this.speech(e, Phaser.Utils.Array.GetRandom(['AIIII!', 'FOI PÊNALTI!', 'CAI-CAI!']));
          }
        }
      }
      e.setFlipX(e.faceRight ? e.dir < 0 : e.dir > 0);
    });
  }

  // Tem chão na frente do inimigo?
  atLedge(e) {
    const b = e.body;
    const aheadX = e.dir > 0 ? b.right + 2 : b.left - 2;
    return !this.layer.getTileAtWorldXY(aheadX, b.bottom + 4);
  }

  // Bombardiro solta uma bomba
  dropBomb(e) {
    const bomb = this.shots.create(e.x, e.y + 14, 'bomba');
    bomb.body.setAllowGravity(true);
    bomb.setVelocity(e.dir * 40, 0);
    bomb.isBomb = true;
    Sfx.tone(900, 0.3, { type: 'sine', to: 200, vol: 0.05 });
  }

  explode(x, y) {
    this.fxHit.explode(18, x, y);
    this.shake(150, 0.008);
    Sfx.tone(120, 0.3, { type: 'sawtooth', to: 40, vol: 0.15 });
    const pb = this.player.body;
    if (Phaser.Math.Distance.Between(x, y, pb.center.x, pb.center.y) < 48) this.die('inimigo');
  }

  // Galvão chuta uma bola em direção ao jogador
  shoot(e) {
    const ball = this.shots.create(e.x + e.dir * 16, e.y - 4, 'gol_ball');
    ball.body.setCircle(7, 1, 1);
    ball.setVelocityX(e.dir * 230);
    this.tweens.add({ targets: ball, angle: e.dir * 720, duration: 1000, repeat: -1 });
    this.time.delayedCall(2600, () => ball.active && ball.destroy());
    this.speech(e, 'GOOOL!');
    Sfx.tone(700, 0.08, { vol: 0.05 });
  }

  // Balão de fala em cima de alguém
  speech(target, text) {
    const t = this.add.text(target.x, target.y - target.displayHeight / 2 - 8, text, {
      fontFamily: FONT, fontSize: '13px', color: '#1b1b2a', backgroundColor: '#ffffff', padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 1).setDepth(110);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  // ---------------------------------------------------------------- Eventos

  collectCoin(player, coin) {
    coin.disableBody(false, false);
    this.tweens.killTweensOf(coin);
    this.tweens.add({ targets: coin, y: coin.y - 30, alpha: 0, scale: 1.4, duration: 250, onComplete: () => coin.destroy() });
    this.fxCoin.explode(8, coin.x, coin.y);
    this.levelCoins++;
    this.stats.coins++;
    this.addScore(SCORE.coin);
    Sfx.coin();
    Achievements.count('coins');
    this.stats.lifeCoins++;
    if (this.stats.lifeCoins >= COINS_PER_LIFE) {
      this.stats.lifeCoins = 0;
      this.gainLife(coin.x, coin.y, `${COINS_PER_LIFE} MOEDAS = +1 VIDA!`);
    }
  }

  hitEnemy(player, enemy) {
    if (this.dead || enemy.dead) return;
    const pb = player.body;
    const eb = enemy.body;
    if (this.powerTime > 0) {
      // No modo 67 é só encostar
      this.defeatEnemy(enemy, true);
    } else if (pb.velocity.y > 0 && pb.bottom <= eb.top + 12) {
      // Caindo e vindo de cima = pisou no inimigo
      if (enemy.hp > 1) {
        // inimigo duro (Lirilì): perde uma vida, pisca e o Brunucho quica
        if (this.time.now < (enemy.hurtUntil || 0)) return;
        enemy.hp--;
        enemy.hurtUntil = this.time.now + 400;
        enemy.setTexture(`${enemy.texture.key}_hit`);
        this.time.delayedCall(120, () => enemy.active && enemy.setTexture(enemy.famous.key));
        player.setVelocityY(-PHYS.stomp);
        this.squash = 0.3;
        this.speech(enemy, 'Ai! Mais uma!');
        Sfx.stomp();
        return;
      }
      this.defeatEnemy(enemy, false);
      const held = this.keys.SPACE.isDown || this.keys.UP.isDown || this.keys.W.isDown || this.touch.jump;
      player.setVelocityY(held ? -PHYS.jump : -PHYS.stomp); // segurando pulo = quique mais alto
      this.jumping = held;
      this.squash = 0.3;
    } else if (this.stareTime > 0) {
      // congelado pelo olhar: não machuca
    } else {
      this.die('inimigo');
    }
  }

  defeatEnemy(enemy, launched) {
    enemy.dead = true;
    enemy.disableBody(false, false);
    this.tweens.killTweensOf(enemy);
    if (launched) {
      // Sai voando girando
      this.tweens.add({ targets: enemy, y: enemy.y - 120, x: enemy.x + this.facing * 80, angle: 540, alpha: 0, duration: 600, ease: 'Quad.out', onComplete: () => enemy.destroy() });
    } else {
      this.tweens.add({ targets: enemy, scaleY: 0.2, scaleX: 1.5, y: enemy.y + 8, alpha: 0, angle: 0, duration: 250, onComplete: () => enemy.destroy() });
    }
    this.fxSlime.explode(10, enemy.x, enemy.y);
    // Combo: cada inimigo seguido sem pisar no chão vale mais
    this.combo++;
    const pts = SCORE.enemy * this.combo;
    this.addScore(pts, enemy.x, enemy.y - 16, this.combo > 1 ? `+${pts}  COMBO x${this.combo}!` : `+${pts}`);
    this.moggedText(enemy.x, enemy.y - 44);
    this.shake(80, 0.004);
    Sfx.stomp();

    // Conquistas de mog
    Achievements.count('mogs');
    if (this.combo >= 3) Achievements.unlock('combo3');
    if (this.combo >= 5) Achievements.unlock('combo5');
    if (this.powerTime > 0 && ++this.mogsIn67 >= 5) Achievements.unlock('mog67');
    const f = enemy.famous && enemy.famous.key;
    if (f === 'galvao') Achievements.unlock('galvao');
    if (f === 'ednaldo') Achievements.unlock('ednaldo');
    if (f === 'neymar' && (enemy.state === 'roll' || enemy.state === 'fallen')) Achievements.unlock('neymar');
    if (f === 'caze' && !enemy.body.blocked.down) Achievements.unlock('caze');
    if (enemy.famous && Object.values(MEMES).some((m) => m.key === f)) {
      const seen = new Set(Storage.get('pp_brainrot', []));
      seen.add(f);
      Storage.set('pp_brainrot', [...seen]);
      if (seen.size >= Object.keys(MEMES).length) Achievements.unlock('brainrot');
    }
  }

  bounceSpring(player, spring) {
    if (player.body.velocity.y < 0 || this.dead) return;
    player.setVelocityY(-PHYS.jump * 1.55);
    this.jumping = false;          // soltar o botão não corta esse pulo
    this.airJumps = 1;
    this.combo = 0;
    this.squash = 0.45;
    spring.setTexture('mola_on');
    this.time.delayedCall(150, () => spring.setTexture('mola'));
    Sfx.tone(180, 0.25, { type: 'triangle', to: 720, vol: 0.12 });
  }

  // ---- Olhar de Mil Jardas ----
  startStare() {
    this.stareTime = 8;
    this.shots.clear(true, true);
    if (this.bossShots) this.bossShots.clear(true, true);
    const cam = this.cameras.main;
    if (cam.postFX && !this.stareFx) { this.stareFx = cam.postFX.addColorMatrix(); this.stareFx.grayscale(0.9); }
    cam.flash(250, 255, 255, 255);
    if (Sfx.musicGain) Sfx.musicGain.gain.value = Settings.get('music') * 0.25;   // música abafada
    Sfx.tone(110, 1.2, { type: 'sine', to: 55, vol: 0.2 });
    Sfx.say('olhar de mil jardas', { rate: 0.8, pitch: 0.7 });
    const t = this.add.text(WIDTH / 2, HEIGHT / 2 - 40, 'OLHAR DE MIL JARDAS', { ...textStyle(48, '#e8e8e8'), strokeThickness: 8 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(130).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 500, hold: 900, yoyo: true, onComplete: () => t.destroy() });
    Achievements.unlock('olhar');
  }

  endStare() {
    if (this.stareTime <= 0 && !this.stareFx) return;
    this.stareTime = 0;
    if (this.stareFx) { this.cameras.main.postFX.remove(this.stareFx); this.stareFx = null; }
    Sfx.applyVolumes();
  }

  // ---- Anjo Caído: a auréola te tira do buraco ----
  angelRescue() {
    this.haloAvailable = false;
    const sp = this.lastSafe;
    this.player.body.reset(sp.x, sp.y - 16);
    this.player.setVelocityY(-380);
    this.invuln = 1.5;
    this.fxFeather.explode(30, sp.x, sp.y - 20);
    this.floatText(sp.x, sp.y - 70, 'O ANJO CAÍDO TE SALVOU!', '#fff3b0', 22);
    this.cameras.main.flash(300, 255, 255, 220);
    Sfx.aura();
    Achievements.unlock('anjo');
  }

  // Plataforma que cai: treme por meio segundo, some, e volta depois de uns 3 segundos
  stepCrumble(player, c) {
    if (c.state !== 'idle') return;
    c.state = 'shaking';
    this.tweens.add({ targets: c, x: c.homeX + 2, duration: 40, yoyo: true, repeat: 5 });
    Sfx.tone(140, 0.2, { type: 'triangle', vol: 0.06 });
    this.time.delayedCall(450, () => {
      if (!c.active) return;
      c.state = 'gone';
      c.disableBody(false, false);
      this.fxDust.explode(10, c.x, c.y);
      this.tweens.add({ targets: c, y: c.homeY + 70, alpha: 0, duration: 350 });
      this.time.delayedCall(2800, () => {
        if (!c.active) return;
        c.setAlpha(1).setPosition(c.homeX, c.homeY);
        c.enableBody(true, c.homeX, c.homeY, true, true);
        c.state = 'idle';
      });
    });
  }

  gainLife(x, y, label = '+1 VIDA!') {
    this.stats.lives++;
    this.floatText(x, y - 30, label, '#ff9aae', 22);
    Sfx.life();
    this.updateHud();
  }

  shake(duration, intensity) {
    if (Settings.get('shake')) this.cameras.main.shake(duration, intensity);
  }

  collectPower(player, p) {
    if (this.dead) return;
    p.disableBody(false, false);
    this.tweens.killTweensOf(p);
    this.tweens.add({ targets: p, scale: 2, alpha: 0, duration: 250, onComplete: () => p.destroy() });

    if (p.kind === '67') {
      this.powerTime = 6.7;
      this.mogsIn67 = 0;
      this.addScore(SCORE.power67);
      Sfx.sixSeven();
      Sfx.say('six seven!', { lang: 'en-US', rate: 1.1, pitch: 1.4 });
      Music.play('poder67');
      Achievements.unlock('sixseven');
      Achievements.count('p67');
      this.cameras.main.flash(200, 255, 176, 0);
      // "SIX SEVEN!" gigante na tela, com as mãozinhas subindo e descendo
      const big = this.add.text(WIDTH / 2, HEIGHT / 2 - 40, 'SIX SEVEN!', { ...textStyle(64, '#ffb000'), strokeThickness: 10 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(130).setScale(0.3);
      this.tweens.add({ targets: big, scale: 1, duration: 250, ease: 'Back.out' });
      this.tweens.add({ targets: big, alpha: 0, y: big.y - 40, delay: 900, duration: 400, onComplete: () => big.destroy() });
      ['6', '7', '6', '7'].forEach((n, i) => this.time.delayedCall(i * 180, () =>
        this.floatText(this.playerGfx.x + (i % 2 ? 18 : -18), this.playerGfx.y - 40, n, '#ffd23f', 26)));
    } else if (p.kind === 'aura') {
      this.hasAura = true;
      this.addScore(SCORE.aura);
      Sfx.aura();
      this.fxAura.explode(30, p.x, p.y);
      this.floatText(p.x, p.y - 20, '+1000 AURA', '#7ff6ff', 24);
    } else if (p.kind === 'olhar') {
      this.startStare();
    } else if (p.kind === 'anjo') {
      this.hasWings = true;
      this.haloAvailable = true;
      this.fxFeather.explode(20, p.x, p.y);
      Sfx.aura();
      Sfx.say('anjo caído', { rate: 1, pitch: 0.9 });
      this.floatText(p.x, p.y - 20, 'ANJO CAÍDO! segure pular no ar para planar', '#ffffff', 18);
      Achievements.unlock('anjo_pegou');
    } else if (p.kind === 'coxinha') {
      this.gainLife(p.x, p.y, 'COXINHA! +1 VIDA');
      Achievements.unlock('coxinha');
    } else if (p.kind === 'tenis') {
      this.hasDoubleJump = true;
      this.airJumps = 1;
      Sfx.powerUp();
      this.floatText(p.x, p.y - 20, 'TÊNIS DE MOLA! (pulo duplo)', '#ff3df2', 20);
      Achievements.unlock('tenis');
    } else if (p.kind === 'ima') {
      this.magnetTime = 12;
      Sfx.powerUp();
      this.floatText(p.x, p.y - 20, 'ÍMÃ DE AURA!', '#ff6b6b', 22);
      Achievements.unlock('ima');
    }
    this.updateHud();
  }

  // A aura segura um golpe no lugar do Brunucho
  breakAura() {
    this.hasAura = false;
    this.invuln = 1.2;
    const b = this.player.body;
    this.player.setVelocityY(-320);
    this.fxAura.explode(30, b.center.x, b.center.y);
    this.floatText(b.center.x, b.top - 10, 'a aura protegeu!', '#7ff6ff', 18);
    this.shake(120, 0.006);
    Sfx.auraBreak();
    Achievements.unlock('escudo');
    this.updateHud();
  }

  reachCheckpoint(player, cp) {
    if (cp.activated) return;
    cp.activated = true;
    cp.setTexture('cp_on');
    this.checkpoint = { x: cp.x, y: cp.y };
    this.tweens.add({ targets: cp, scaleY: 1.2, duration: 120, yoyo: true });
    this.fxCoin.explode(12, cp.x, cp.y - 40);
    this.addScore(SCORE.checkpoint, cp.x, cp.y - 60, `CHECKPOINT +${SCORE.checkpoint}`);
    Sfx.checkpoint();
  }

  // cause: 'queda', 'espinho' ou 'inimigo'. Poderes só protegem do que não é queda.
  die(cause = 'queda') {
    if (this.dead || this.finished) return;
    if (cause !== 'queda') {
      if (this.powerTime > 0 || this.invuln > 0) return;
      if (this.hasAura) { this.breakAura(); return; }
    }
    if (cause === 'queda' && this.haloAvailable && this.lastSafe) {
      this.angelRescue();
      return;
    }
    this.dead = true;
    this.hasWings = false;
    this.haloAvailable = false;
    this.endStare();
    this.stats.deaths++;
    this.levelDeaths++;
    this.stats.lives--;
    this.addScore(SCORE.death);
    Achievements.count('deaths');
    if (this.powerTime > 0) Music.play(this.levelSong);
    this.powerTime = 0;
    this.hasAura = false;
    this.invuln = 0;
    this.playerGfx.clearTint().setAlpha(1);
    this.updateHud();
    const b = this.player.body;
    this.floatText(b.center.x, Math.min(b.top, this.mapH - 40), `-1000 aura  (${SCORE.death})`, '#ff6b6b', 20);
    this.fxHit.explode(24, b.center.x, Math.min(b.center.y, this.mapH - 10));
    this.player.disableBody(false, false);
    this.playerGfx.setVisible(false);
    this.shake(200, 0.01);
    Sfx.die();
    if (this.stats.lives <= 0) {
      // Acabaram as vidas: a Andreia te achou...
      this.time.delayedCall(1100, () => {
        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('GameOver', { level: this.levelIndex, stats: this.stats, startStats: this.startStats }));
      });
    } else {
      this.time.delayedCall(700, () => this.respawn());
    }
  }

  respawn() {
    const sp = this.bossRespawnPoint() || this.checkpoint || this.spawn;
    this.player.enableBody(true, sp.x, sp.y - 16, true, false);
    this.player.setVelocity(0, 0);
    this.playerGfx.setVisible(true);
    this.dead = false;
    this.jumping = false;
    this.jumpQueued = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.squash = -0.3;
    // Renasce protegido: 2 segundos invencível (piscando)...
    this.invuln = 2;
    // ...e quem estiver em cima do ponto de renascer é empurrado pra longe
    this.enemies.children.iterate((e) => {
      if (!e || e.dead || !e.body) return;
      const dx = e.x - sp.x;
      if (Math.abs(dx) < 4 * TILE && Math.abs(e.y - sp.y) < 3 * TILE) {
        e.dir = dx >= 0 ? 1 : -1;
        if (e.state === 'roll' || e.state === 'fallen') { e.state = 'walk'; e.setAngle(0); }
        // só empurra se o lugar novo tiver chão embaixo e estiver livre
        for (const dist of [4, 5, 6, 3]) {
          const tx = sp.x + e.dir * dist * TILE;
          const free = !this.layer.getTileAtWorldXY(tx, e.y);
          const floor = e.behavior === 'flyer' || !!this.layer.getTileAtWorldXY(tx, e.body.bottom + 6);
          if (free && floor) { e.x = tx; e.body.reset(tx, e.y); break; }
        }
      }
    });
    if (this.shots) this.shots.clear(true, true);
    // Mostra o nome de novo por um instante ao renascer
    this.tweens.killTweensOf(this.nameTag);
    this.nameTag.setAlpha(1);
    this.tweens.add({ targets: this.nameTag, alpha: 0, delay: 1200, duration: 600 });
  }

  reachGoal() {
    if (this.finished || this.dead) return;
    this.finished = true;
    this.stats.time += this.levelTime;
    this.player.setVelocityX(0);
    this.fxParty.explode(60, this.goal.x, this.goal.y - 60);
    Sfx.win();

    // Bônus de fim de fase
    const bonuses = [['Fase concluída', SCORE.levelClear]];
    const timeBonus = Math.max(0, Math.round((SCORE.parTime - this.levelTime) * SCORE.timeBonus));
    if (timeBonus > 0) bonuses.push([`Tempo (${formatTime(this.levelTime)})`, timeBonus]);
    if (this.levelDeaths === 0) bonuses.push(['Sem morrer', SCORE.noDeath]);
    const allCoins = this.levelCoins === this.totalCoins && this.totalCoins > 0;
    if (allCoins) bonuses.push(['Todas as moedas', SCORE.allCoins]);

    // Progresso (libera a próxima fase, estrelas) e conquistas da fase
    Progress.completeLevel(this.levelIndex, { noDeath: this.levelDeaths === 0, allCoins });
    if (this.powerTime > 0) Music.play(this.levelSong);
    if (this.levelIndex === 0) Achievements.unlock('fase1');
    if (THEME_ACHIEVEMENT[this.themeKey]) Achievements.unlock(THEME_ACHIEVEMENT[this.themeKey]);
    visitState(this.themeKey);
    if (this.levelDeaths === 0) Achievements.unlock('intocavel');
    if (allCoins) Achievements.unlock('todasmoedas');
    if (this.levelTime < 40) Achievements.unlock('speedrun');
    const finalScore = this.stats.score + bonuses.reduce((s, [, pts]) => s + pts, 0);
    if (finalScore >= 50000) Achievements.unlock('pontos50k');
    if (finalScore >= 100000) Achievements.unlock('pontos100k');

    const fixed = (obj) => obj.setScrollFactor(0).setDepth(150);
    const boxH = 150 + bonuses.length * 30;
    fixed(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 560, boxH, 0x1b1b2a, 0.85).setStrokeStyle(3, 0xffd23f));
    const top = HEIGHT / 2 - boxH / 2;
    fixed(this.add.text(WIDTH / 2, top + 34, `${PLAYER_NAME} passou de fase!`, textStyle(36, '#ffd23f')).setOrigin(0.5));
    bonuses.forEach(([label, pts], i) => {
      const y = top + 80 + i * 30;
      const row = [
        fixed(this.add.text(WIDTH / 2 - 230, y, label, textStyle(20)).setOrigin(0, 0.5)),
        fixed(this.add.text(WIDTH / 2 + 230, y, `+${pts}`, textStyle(20, '#ffe9a0')).setOrigin(1, 0.5)),
      ];
      row.forEach((t) => t.setAlpha(0));
      // cada linha aparece com um "plim" e soma no placar
      this.time.delayedCall(500 + i * 450, () => {
        row.forEach((t) => t.setAlpha(1));
        this.addScore(pts);
        Sfx.coin();
      });
    });
    const totalY = top + 80 + bonuses.length * 30 + 12;
    this.totalText = fixed(this.add.text(WIDTH / 2, totalY, '', textStyle(26, '#ffffff')).setOrigin(0.5));

    this.time.delayedCall(1200 + bonuses.length * 450 + 1200, () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.levelIndex + 1 < LEVELS.length) this.scene.restart({ level: this.levelIndex + 1, stats: this.stats });
        else {
          Progress.clearRun();
          Achievements.unlock('zerou');
          if (Settings.get('difficulty') === 'dificil') Achievements.unlock('zerou_dif');
          this.scene.start('End', { stats: { ...this.stats, score: Math.round(this.stats.score) } });
        }
      });
    });
  }

  restartLevel() {
    // Moedas e tempo voltam ao início da fase; as mortes continuam contando.
    this.scene.restart({ level: this.levelIndex, stats: { ...this.startStats, deaths: this.stats.deaths, lives: this.stats.lives } });
  }

  pauseGame() {
    if (this.finished || this.dead) return;
    this.scene.pause();
    this.scene.launch('Pause');
  }
}
