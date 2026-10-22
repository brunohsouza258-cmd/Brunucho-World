// RANKING: 🌎 GLOBAL (todo mundo que joga, em qualquer celular) e 📱 AQUI (só neste aparelho).
//   ← → trocar de aba · ↑ ↓ ordenar por pontos / tempo · N mudar o nome · ESC voltar
class RankScene extends Phaser.Scene {
  constructor() { super('Rank'); }

  create() {
    this.tab = 'global';
    this.sort = 'score';
    this.token = 0;                                          // descarta resposta atrasada de uma consulta antiga
    this.rowObjs = [];

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, VIEW_W, HEIGHT, 0x0b0b14, 1);
    this.add.text(WIDTH / 2, 36, '🏆 RANKING', { ...textStyle(40, '#ffd23f'), strokeThickness: 7 }).setOrigin(0.5);

    const btn = (x, y, label, fn, size = 18) => {
      const t = this.add.text(x, y, label, { ...textStyle(size), padding: { x: 12, y: 5 }, strokeThickness: 0 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.time.delayedCall(1, fn));
      return t;
    };
    this.tabBtns = { global: btn(300, 88, '🌎 GLOBAL', () => this.setTab('global'), 20), local: btn(660, 88, '📱 AQUI', () => this.setTab('local'), 20) };
    this.sortBtns = { score: btn(380, 128, 'PONTOS', () => this.setSort('score')), time: btn(580, 128, 'TEMPO', () => this.setSort('time')) };

    this.status = this.add.text(WIDTH / 2, 300, '', { ...textStyle(20, '#ffe9a0'), align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5);
    this.info = this.add.text(WIDTH / 2, 462, '', textStyle(16, '#9ff0ff')).setOrigin(0.5);

    this.nameBtn = btn(190, 505, '', () => this.editName(), 16);
    btn(WIDTH - 90, 505, '◀ VOLTAR', () => this.close(), 20).setBackgroundColor('#2b2b3a');
    if (!IS_TOUCH) this.add.text(WIDTH / 2 + 20, 505, '← → aba · ↑ ↓ ordem · N nome · ESC voltar', textStyle(13)).setOrigin(0.5).setAlpha(0.8);

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.setTab('global'));
    kb.on('keydown-RIGHT', () => this.setTab('local'));
    kb.on('keydown-UP', () => this.setSort('score'));
    kb.on('keydown-DOWN', () => this.setSort('time'));
    kb.on('keydown-N', () => this.editName());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-BACKSPACE', () => this.close());

    this.refresh();
  }

  setTab(t) { if (this.tab !== t) { this.tab = t; Sfx.tone(620, 0.06, { vol: 0.05 }); this.refresh(); } }
  setSort(s) { if (this.tab === 'global' && this.sort !== s) { this.sort = s; Sfx.tone(520, 0.05, { vol: 0.05 }); this.refresh(); } }

  // Muda o nome e reenvia o melhor placar com o nome novo
  editName() {
    const v = window.prompt('Seu nome no ranking (até 12 letras):', GlobalRank.name() || '');
    if (v === null) return;
    if (!GlobalRank.setName(v)) return;
    GlobalRank.submit(null).then(() => this.refresh());
    this.refresh();
  }

  clearRows() { this.rowObjs.forEach((o) => o.destroy()); this.rowObjs = []; }

  refresh() {
    this.tabBtns.global.setColor(this.tab === 'global' ? '#1b1b2a' : '#ffffff').setBackgroundColor(this.tab === 'global' ? '#ffd23f' : '#2b2b3a');
    this.tabBtns.local.setColor(this.tab === 'local' ? '#1b1b2a' : '#ffffff').setBackgroundColor(this.tab === 'local' ? '#ffd23f' : '#2b2b3a');
    ['score', 'time'].forEach((k) => {
      const on = this.sort === k;
      this.sortBtns[k].setVisible(this.tab === 'global').setColor(on ? '#1b1b2a' : '#ffffff').setBackgroundColor(on ? '#9ff0ff' : '#2b2b3a');
    });
    this.nameBtn.setText(`✏ NOME: ${GlobalRank.name() || 'escolher'}`).setBackgroundColor('#2b2b3a');
    this.clearRows();
    this.info.setText('');
    const token = ++this.token;
    if (this.tab === 'local') {
      const list = Ranking.list().map((e, i) => ({ pos: i + 1, name: e.name, score: e.score, time: e.time, finished: true, level: 32 }));
      if (!list.length) { this.status.setText('Ninguém jogou até o fim neste aparelho ainda.\nO ranking de quem não zerou fica na aba GLOBAL.'); return; }
      this.status.setText('');
      this.drawTable(list);
      return;
    }
    this.status.setText('carregando o ranking global...');
    GlobalRank.flush().then(() => GlobalRank.top(this.sort, 10)).then((r) => {
      if (token !== this.token || !this.scene.isActive()) return;
      if (!r.ok) {
        this.status.setText(r.offline ? 'Sem conexão com o ranking global.\nConfira a internet. Seu placar fica guardado e é enviado depois.'
          : (/ligado/.test(r.error || '') ? 'O ranking global ainda não foi ligado no servidor.\n(O ranking da aba AQUI continua funcionando.)' : `Não deu pra abrir o ranking global: ${r.error}`));
        return;
      }
      if (!r.entries.length) { this.status.setText('Ninguém no ranking ainda.\nJogue uma fase e seja o primeiro! 🏁'); }
      else { this.status.setText(''); this.drawTable(r.entries); }
      const me = r.me || {};
      const partes = [];
      if (me.posScore) partes.push(`#${me.posScore} em pontos`);
      if (me.posTime) partes.push(`#${me.posTime} em tempo`);
      this.info.setText(partes.length ? `Você: ${partes.join('  ·  ')}   (${r.total} jogador${r.total === 1 ? '' : 'es'})` : `${r.total} jogador${r.total === 1 ? '' : 'es'} no ranking`);
    });
  }

  drawTable(rows) {
    const add = (o) => { this.rowObjs.push(o); return o; };
    const head = textStyle(14, '#8a8aa0');
    add(this.add.text(60, 166, '#', head).setOrigin(0.5));
    add(this.add.text(120, 166, 'JOGADOR', head).setOrigin(0, 0.5));
    add(this.add.text(480, 166, 'PONTOS', head).setOrigin(0.5));
    add(this.add.text(650, 166, 'TEMPO', head).setOrigin(0.5));
    add(this.add.text(820, 166, 'FASE', head).setOrigin(0.5));
    const medals = ['🥇', '🥈', '🥉'];
    rows.forEach((e, i) => {
      const y = 194 + i * 26;
      const col = e.mine ? '#9ff0ff' : '#ffffff';
      if (e.mine) add(this.add.rectangle(WIDTH / 2, y, 880, 24, 0x2b3b5a, 0.7));
      add(this.add.text(60, y, e.pos <= 3 ? medals[e.pos - 1] : `${e.pos}º`, textStyle(18, col)).setOrigin(0.5));
      const nm = add(this.add.text(120, y, e.name, textStyle(19, col)).setOrigin(0, 0.5));
      let fs = parseInt(nm.style.fontSize, 10);
      while (nm.width > 300 && fs > 10) nm.setFontSize(--fs);
      add(this.add.text(480, y, formatScore(e.score), textStyle(18, e.mine ? '#9ff0ff' : '#ffe9a0')).setOrigin(0.5));
      add(this.add.text(650, y, e.time ? formatTime(e.time) : '—', textStyle(18, this.sort === 'time' && e.time ? '#9ff0ff' : '#cccccc')).setOrigin(0.5));
      add(this.add.text(820, y, e.finished ? '🏁 zerou' : `${e.level}/32`, textStyle(16, e.finished ? '#8aff8a' : '#cccccc')).setOrigin(0.5));
    });
  }

  close() {
    this.token++;
    this.scene.stop();
    this.scene.resume('Menu');
    const m = this.scene.get('Menu');
    if (m && m.onOptionsClosed) m.onOptionsClosed();
  }
}
