// Chefão final: a dupla LULA & FLÁVIO, na arena de Brasília.
// No mapa, a letra "B" marca o meio da arena. A arena tem 30 blocos (uma tela) de largura.
// Estes métodos são "colados" na GameScene (veja o final do arquivo).

const BOSS_HP = { facil: 3, normal: 4, dificil: 5 };

const BOSSES = [
  { key: 'lula', name: 'LULA', color: 0xff4d4d, attack: 'picanha', speed: 80,
    lines: ['Companheiro!', 'Faz o L!', 'Picanha pra todo mundo!', 'Olha a cervejinha!'],
    hurt: ['Ai, companheiro!', 'Isso é golpe!'], angry: 'Agora é pessoal, companheiro!' },
  { key: 'flavio', name: 'FLÁVIO', color: 0x4dd2ff, attack: 'ovo', speed: 95, jumper: true,
    lines: ['Aqui é o 01!', 'Ovo não, pô!', 'Vamo junto!', 'Respeita!'],
    hurt: ['Ai!', 'Isso não vale!'], angry: 'Você vai ver só!' },
];

const BossMixin = {
  setupBoss() {
    this.boss = { started: false, fighting: false, done: false, list: [], deathsAtStart: 0 };
    this.arenaLeft = this.bossSpawn.x - 18 * TILE;
    this.bossShots = this.physics.add.group();
    this.physics.add.collider(this.bossShots, this.layer, (s) => this.breakShot(s));
    this.physics.add.overlap(this.player, this.bossShots, (pl, s) => {
      this.breakShot(s);
      this.die('inimigo');
    });
    this.fxEgg = this.add.particles(0, 0, 'px', {
      lifespan: 400, speed: { min: 40, max: 160 }, scale: { start: 0.8, end: 0 }, gravityY: 400,
      tint: [0xffffff, 0xffd23f], emitting: false,
    }).setDepth(6);
  },

  // ------------------------------------------------------------ Começo da luta

  startBoss() {
    const b = this.boss;
    b.started = true;
    b.deathsAtStart = this.levelDeaths;
    const cam = this.cameras.main;

    // Parede de tijolo fecha a arena atrás do jogador
    const wallX = this.arenaLeft - TILE / 2;
    for (let y = 0; y < 14; y++) this.add.image(wallX, y * TILE + TILE / 2, 'tiles', TILES.BRICK).setDepth(1);
    const wall = this.add.zone(wallX, this.mapH / 2, TILE, this.mapH);
    this.physics.add.existing(wall, true);
    this.physics.add.collider(this.player, wall);
    this.arenaWall = wall;

    // Câmera vai para a arena e fica parada
    cam.stopFollow();
    cam.pan(this.arenaLeft + WIDTH / 2, cam.midPoint.y, 700, 'Sine.easeInOut', false, (c, p) => {
      if (p === 1) cam.setBounds(this.arenaLeft, 0, WIDTH, this.mapH);
    });

    Music.play('chefao');
    this.shake(300, 0.008);

    // Os dois chegam caindo do céu
    const hp = BOSS_HP[Settings.get('difficulty')] || 3;
    BOSSES.forEach((cfg, i) => {
      const x = this.bossSpawn.x + (i === 0 ? -3 : 5) * TILE;
      const s = this.physics.add.sprite(x, -80, cfg.key).setScale(2.2);
      s.cfg = cfg; s.hp = hp; s.maxHp = hp; s.inv = 0; s.dir = i === 0 ? -1 : 1;
      s.state = 'intro'; s.timer = 2.4; s.speedMul = 1; s.dead = false;
      s.setCollideWorldBounds(true);
      this.physics.add.collider(s, this.layer);
      this.physics.add.collider(s, wall);
      this.physics.add.overlap(this.player, s, (pl, boss) => this.bossTouch(boss));
      b.list.push(s);
    });

    // Barras de vida
    const fixed = (o) => o.setScrollFactor(0).setDepth(140);
    b.bars = BOSSES.map((cfg, i) => {
      const x = WIDTH / 2 + (i === 0 ? -170 : 170);
      fixed(this.add.text(x, 72, cfg.name, textStyle(18, i === 0 ? '#ff8a8a' : '#8ae6ff')).setOrigin(0.5));
      fixed(this.add.rectangle(x, 96, 220, 14, 0x1b1b2a).setStrokeStyle(2, 0xffffff));
      return fixed(this.add.rectangle(x - 108, 96, 216, 10, cfg.color).setOrigin(0, 0.5));
    });

    // Apresentação
    const banner = this.add.text(WIDTH / 2, HEIGHT / 2 - 70, 'CHEFÃO FINAL\nLULA & FLÁVIO',
      { ...textStyle(50, '#ffd23f'), align: 'center', strokeThickness: 10 }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setScale(0.3);
    this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.out' });
    this.tweens.add({ targets: banner, alpha: 0, delay: 1900, duration: 400, onComplete: () => banner.destroy() });
    this.time.delayedCall(1200, () => this.speech(b.list[0], 'Companheiro Brunucho... a aura é do povo!'));
    this.time.delayedCall(1900, () => this.speech(b.list[1], 'Aqui quem manda é o 01!'));
    this.time.delayedCall(2600, () => { b.fighting = true; });
  },

  // ------------------------------------------------------------ Inteligência dos chefões

  updateBoss(dt) {
    const b = this.boss;
    if (!b || b.done) return;
    if (!b.started) {
      if (this.player.body.center.x > this.arenaLeft + 3 * TILE) this.startBoss();
      return;
    }
    const pb = this.player.body;
    for (const s of b.list) {
      if (s.dead) continue;
      const body = s.body;
      const dx = pb.center.x - body.center.x;
      s.inv -= dt;
      s.setAlpha(s.inv > 0 && Math.floor(this.time.now / 70) % 2 ? 0.35 : 1);
      s.setFlipX(dx < 0);
      if (!b.fighting || this.dead || this.stareTime > 0) { s.setVelocityX(0); s.anims.stop(); s.setTexture(s.cfg.key); continue; }

      s.timer -= dt;
      if (s.state === 'intro') { s.state = 'walk'; s.timer = Phaser.Math.FloatBetween(1, 2); }

      if (s.state === 'walk') {
        if (body.blocked.left) s.dir = 1;
        if (body.blocked.right) s.dir = -1;
        if (Math.random() < 0.006) s.dir *= -1;
        s.setVelocityX(s.dir * s.cfg.speed * s.speedMul * difficulty().enemySpeed);
        if (body.blocked.down) { if (!s.anims.isPlaying) s.play(`${s.cfg.key}_walk`); }
        if (s.timer <= 0 && body.blocked.down) {
          if (s.cfg.jumper && Math.random() < 0.4) {
            // Flávio: pulão na direção do Brunucho
            s.state = 'jump';
            s.setVelocityY(-720);
            s.setVelocityX(Phaser.Math.Clamp(dx * 1.2, -320, 320));
            this.speech(s, 'Vamo junto!');
          } else {
            s.state = 'windup';
            s.timer = 0.55;
            s.setVelocityX(0);
            s.anims.stop(); s.setTexture(`${s.cfg.key}_jump`);
            this.speech(s, Phaser.Utils.Array.GetRandom(s.cfg.lines));
          }
        }
      } else if (s.state === 'windup') {
        s.setVelocityX(0);
        if (s.timer <= 0) {
          this.bossThrow(s);
          s.state = 'walk';
          s.timer = Phaser.Math.FloatBetween(1.6, 2.6) / s.speedMul;
        }
      } else if (s.state === 'jump') {
        s.anims.stop(); s.setTexture(`${s.cfg.key}_jump`);
        if (body.blocked.down && body.velocity.y >= 0 && s.timer < 1.5) {
          // aterrissou: chão treme
          this.shake(200, 0.01);
          Sfx.stomp();
          this.fxDust.explode(16, body.center.x, body.bottom);
          s.state = 'walk';
          s.timer = Phaser.Math.FloatBetween(1.4, 2.2) / s.speedMul;
        }
        if (s.timer < -3) s.state = 'walk'; // segurança
      }
    }
  },

  bossThrow(s) {
    const pb = this.player.body;
    const many = s.speedMul > 1 ? 3 : 1; // com raiva, joga 3 de uma vez
    for (let i = 0; i < many; i++) {
      const shot = this.bossShots.create(s.x, s.y - 30, s.cfg.attack);
      const flight = 0.9 + i * 0.18;
      const dx = pb.center.x - s.x + (i - (many - 1) / 2) * 90;
      const dy = pb.center.y - (s.y - 30);
      shot.setVelocity(Phaser.Math.Clamp(dx / flight, -420, 420), Phaser.Math.Clamp(dy / flight - 0.5 * PHYS.gravity * flight, -900, 200));
      shot.setAngularVelocity(Phaser.Math.Between(-500, 500));
      shot.body.setSize(shot.width - 4, shot.height - 4);
      this.time.delayedCall(4000, () => shot.active && shot.destroy());
    }
    Sfx.tone(260, 0.12, { type: 'triangle', to: 520, vol: 0.08 });
  },

  breakShot(s) {
    if (!s.active) return;
    this.fxEgg.explode(8, s.x, s.y);
    s.destroy();
  },

  // ------------------------------------------------------------ Dano

  bossTouch(s) {
    if (s.dead || s.inv > 0 || this.dead || !this.boss.fighting) return;
    const pb = this.player.body;
    const stomp = pb.velocity.y > 0 && pb.bottom <= s.body.top + 22;
    if (!stomp && this.stareTime > 0 && this.powerTime <= 0) return; // congelado: não machuca
    if (stomp || this.powerTime > 0) {
      this.hurtBoss(s);
      this.player.setVelocityY(-PHYS.jump * 1.05);
      this.jumping = true;
      this.squash = 0.35;
    } else {
      this.die('inimigo');
    }
  },

  hurtBoss(s) {
    s.hp--;
    s.inv = 1.3;
    s.setVelocityX(s.x > this.player.x ? 260 : -260);
    s.setVelocityY(-260);
    this.addScore(1000, s.x, s.y - 70, '+1000');
    this.moggedText(s.x, s.y - 100);
    this.shake(180, 0.01);
    Sfx.stomp();
    this.fxSlime.explode(14, s.x, s.y);
    const i = this.boss.list.indexOf(s);
    this.tweens.add({ targets: this.boss.bars[i], scaleX: Math.max(0, s.hp / s.maxHp), duration: 250 });
    if (s.hp <= 0) this.defeatBoss(s);
    else this.speech(s, Phaser.Utils.Array.GetRandom(s.cfg.hurt));
  },

  defeatBoss(s) {
    s.dead = true;
    s.disableBody(false, false);
    s.anims.stop();
    this.tweens.add({ targets: s, y: s.y - 260, x: s.x + (s.x > this.player.x ? 200 : -200), angle: 720, alpha: 0, duration: 1100, ease: 'Quad.out' });
    this.addScore(5000, s.x, s.y - 40, `${s.cfg.name} MOGGADO! +5000`);
    Sfx.win();
    const rest = this.boss.list.filter((x) => !x.dead);
    if (rest.length) {
      // o outro fica bravo: mais rápido e joga 3 de uma vez
      const other = rest[0];
      other.speedMul = 1.6;
      other.setTint(0xffb0b0);
      this.speech(other, other.cfg.angry);
    } else {
      this.bossDefeated();
    }
  },

  bossDefeated() {
    const b = this.boss;
    b.done = true;
    this.finished = true;
    this.stats.time += this.levelTime;
    this.bossShots.clear(true, true);
    this.player.setVelocityX(0);
    Music.play('vitoria');
    Progress.completeLevel(this.levelIndex, { noDeath: this.levelDeaths === 0, allCoins: this.levelCoins === this.totalCoins });
    Progress.clearRun();
    Achievements.unlock('chefao');
    visitState('brasilia');
    if (this.levelDeaths === b.deathsAtStart) Achievements.unlock('chefao_limpo');
    Achievements.unlock('zerou');
    if (Settings.get('difficulty') === 'dificil') Achievements.unlock('zerou_dif');
    this.addScore(10000);

    const fixed = (o) => o.setScrollFactor(0).setDepth(150);
    const t1 = fixed(this.add.text(WIDTH / 2, HEIGHT / 2 - 60, 'MOGGADOS!', { ...textStyle(80, '#ff3df2'), strokeThickness: 12 }).setOrigin(0.5).setScale(0.2));
    t1.setShadow(0, 0, '#7ff6ff', 16, true, true);
    const t2 = fixed(this.add.text(WIDTH / 2, HEIGHT / 2 + 20, 'AURA INFINITA DESBLOQUEADA  +10000', textStyle(28, '#7ff6ff')).setOrigin(0.5).setAlpha(0));
    this.tweens.add({ targets: t1, scale: 1, duration: 400, ease: 'Back.out' });
    this.tweens.add({ targets: t2, alpha: 1, delay: 600, duration: 400 });
    Sfx.say('moggados!', { rate: 1.1, pitch: 1.2 });
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 350, () => this.fxParty.explode(50, this.arenaLeft + Phaser.Math.Between(200, 760), 300));

    this.time.delayedCall(4200, () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('Ending', { stats: { ...this.stats, score: Math.round(this.stats.score) } }));
    });
  },

  // Ao morrer durante a luta, volta dentro da arena
  bossRespawnPoint() {
    if (this.boss && this.boss.started && !this.boss.done) {
      this.bossShots.clear(true, true);
      return { x: this.arenaLeft + 3 * TILE, y: this.bossSpawn.y };
    }
    return null;
  },
};

Object.assign(GameScene.prototype, BossMixin);
