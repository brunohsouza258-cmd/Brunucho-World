// Os estados do Brasil: cartões-postais (fundo de cada fase) e temas.
// Cada fundo tem 960x300 e repete lado a lado. A base dos prédios fica perto de y=280.

function generateStateScenery(scene) {
  const tex = (key, draw) => {
    const t = scene.textures.createCanvas(key, 960, 300);
    const ctx = t.getContext();
    draw(ctx);
    t.refresh();
  };
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const circle = (ctx, c, x, y, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const ellipse = (ctx, c, x, y, rx, ry, a0 = 0, a1 = Math.PI * 2) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0, a1); ctx.fill(); };
  const poly = (ctx, c, pts) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill(); };
  const sea = (ctx, y, c1 = '#2a8fc4', c2 = '#52b7dc') => { R(ctx, c1, 0, y, 960, 300 - y); R(ctx, c2, 0, y, 960, 5); for (let x = 0; x < 960; x += 60) R(ctx, 'rgba(255,255,255,0.5)', x + 10, y + 18 + (x % 120 ? 8 : 0), 26, 2); };
  // morros que repetem sem emenda
  const hills = (ctx, c, base, amp, k, phase = 0) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 300);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, base - amp * Math.abs(Math.sin((x / 960) * Math.PI * k + phase)));
    ctx.lineTo(960, 300); ctx.closePath(); ctx.fill();
  };
  // floresta (copas redondas) que repete
  const forest = (ctx, base, c1, c2) => {
    for (let x = -20; x < 990; x += 34) {
      const h = 40 + ((x * 7) % 30);
      R(ctx, '#5e3e22', x + 12, base - 20, 6, 30);
      circle(ctx, c1, x + 15, base - h + 18, 24);
      circle(ctx, c2, x + 8, base - h + 10, 12);
    }
    R(ctx, c1, 0, base, 960, 300 - base);
  };
  const palm = (ctx, x, base, h, c = '#2e7d4a') => {
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 10, base - h / 2, x + 4, base - h); ctx.stroke();
    ctx.fillStyle = c;
    [[-40, 10], [-30, -12], [0, -20], [30, -12], [40, 10]].forEach(([dx, dy]) => poly(ctx, c, [[x + 4, base - h], [x + 4 + dx, base - h + dy], [x + 4 + dx * 0.6, base - h + dy + 8]]));
  };
  const jangada = (ctx, x, y, sail = '#ffffff') => {
    R(ctx, '#8a5a2b', x, y, 40, 5);
    poly(ctx, sail, [[x + 20, y - 46], [x + 20, y], [x + 46, y - 6]]);
    R(ctx, '#5e3e22', x + 19, y - 48, 2, 48);
  };
  const windows = (ctx, x, y, w, h, c = '#3a4a6a') => { for (let wy = y + 8; wy < y + h - 10; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 14) R(ctx, c, wx, wy, 7, 9); };

  // ---------------- SUDESTE ----------------
  tex('uf_es', (ctx) => {   // Convento da Penha no alto do morro + Terceira Ponte
    hills(ctx, '#6b9a6e', 250, 30, 3);
    sea(ctx, 262);
    poly(ctx, '#5f7d5a', [[300, 290], [380, 150], [430, 110], [470, 104], [520, 130], [600, 290]]);
    poly(ctx, '#8a8a80', [[400, 140], [430, 110], [470, 104], [500, 120], [470, 150]]);
    R(ctx, '#f4f1ea', 432, 70, 70, 36); R(ctx, '#f4f1ea', 486, 46, 16, 60);
    poly(ctx, '#c45a3a', [[430, 70], [467, 52], [504, 70]]); poly(ctx, '#c45a3a', [[484, 46], [494, 32], [504, 46]]);
    R(ctx, '#3a4a6a', 448, 84, 8, 12); R(ctx, '#3a4a6a', 470, 84, 8, 12);
    ctx.strokeStyle = '#d9d4cc'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(620, 262); ctx.quadraticCurveTo(780, 170, 940, 262); ctx.stroke();
    [660, 720, 780, 840, 900].forEach((x) => R(ctx, '#d9d4cc', x, 200 + Math.abs(780 - x) * 0.45, 6, 70));
  });
  tex('uf_mg', (ctx) => {   // Ouro Preto: igreja barroca e casarões na serra
    hills(ctx, '#7a8f6a', 200, 60, 2);
    hills(ctx, '#5f7d4a', 240, 30, 4, 1);
    const house = (x, y, w, h, c) => { R(ctx, c, x, y, w, h); poly(ctx, '#a0522d', [[x - 3, y], [x + w / 2, y - 12], [x + w + 3, y]]); R(ctx, '#2e5d8a', x + 6, y + 8, 6, 10); R(ctx, '#2e5d8a', x + w - 12, y + 8, 6, 10); };
    [[60, 236, 50, 50, '#ffffff'], [120, 226, 44, 60, '#f2c14e'], [700, 230, 50, 56, '#ffffff'], [760, 222, 46, 64, '#9ccf6a'], [820, 234, 52, 52, '#ffffff']].forEach((h) => house(...h));
    // igreja barroca com duas torres
    R(ctx, '#ffffff', 410, 160, 140, 126); R(ctx, '#ffffff', 396, 110, 34, 176); R(ctx, '#ffffff', 530, 110, 34, 176);
    poly(ctx, '#ffffff', [[410, 160], [480, 120], [550, 160]]);
    ellipse(ctx, '#2e5d8a', 413, 110, 17, 14, Math.PI, 0); ellipse(ctx, '#2e5d8a', 547, 110, 17, 14, Math.PI, 0);
    R(ctx, '#c8a24a', 410, 160, 140, 4); R(ctx, '#6b3a1e', 466, 230, 28, 56);
    circle(ctx, '#c8a24a', 480, 180, 9); R(ctx, '#2e5d8a', 404, 140, 18, 24); R(ctx, '#2e5d8a', 538, 140, 18, 24);
  });
  // ---------------- SUL ----------------
  tex('uf_pr', (ctx) => {   // Jardim Botânico de Curitiba + araucárias
    hills(ctx, '#6b9a6e', 240, 24, 3);
    const arau = (x, s) => { R(ctx, '#5e3e22', x - 3, 280 - 110 * s, 6, 110 * s); [0, 1, 2].forEach((i) => ellipse(ctx, '#2f5d3a', x, 280 - 110 * s + i * 14 * s, 44 * s - i * 6 * s, 9 * s)); };
    [60, 150, 240, 720, 810, 900].forEach((x, i) => arau(x, 0.8 + (i % 3) * 0.15));
    // estufa de vidro
    R(ctx, '#e8f4f8', 360, 190, 240, 92);
    ellipse(ctx, '#e8f4f8', 480, 190, 120, 60, Math.PI, 0); ellipse(ctx, '#d4ecf4', 480, 120, 34, 26, Math.PI, 0); R(ctx, '#d4ecf4', 446, 118, 68, 20);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    for (let x = 372; x < 600; x += 24) { ctx.beginPath(); ctx.moveTo(x, 282); ctx.lineTo(x, 190 - Math.sqrt(Math.max(0, 1 - ((x - 480) / 120) ** 2)) * 60); ctx.stroke(); }
    for (let y = 200; y < 282; y += 20) { ctx.beginPath(); ctx.moveTo(360, y); ctx.lineTo(600, y); ctx.stroke(); }
    R(ctx, '#8fbc8f', 360, 270, 240, 12);
  });
  tex('uf_sc', (ctx) => {   // Ponte Hercílio Luz (Florianópolis)
    hills(ctx, '#5f8a5a', 220, 50, 2, 0.5);
    sea(ctx, 250);
    R(ctx, '#9aa7b8', 300, 70, 12, 190); R(ctx, '#9aa7b8', 648, 70, 12, 190);
    R(ctx, '#7a8798', 296, 66, 20, 8); R(ctx, '#7a8798', 644, 66, 20, 8);
    ctx.strokeStyle = '#7a8798'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(306, 72); ctx.quadraticCurveTo(480, 230, 654, 72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 220); ctx.quadraticCurveTo(220, 150, 306, 72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(654, 72); ctx.quadraticCurveTo(740, 150, 820, 220); ctx.stroke();
    ctx.lineWidth = 1; for (let x = 320; x < 650; x += 16) { ctx.beginPath(); ctx.moveTo(x, 222); ctx.lineTo(x, 150 + Math.abs(x - 480) * -0.5 + 80); ctx.stroke(); }
    R(ctx, '#6a7788', 100, 220, 760, 7);
  });
  tex('uf_rs', (ctx) => {   // Pampa + Usina do Gasômetro + casinhas de Gramado
    hills(ctx, '#7fae6a', 250, 30, 2);
    R(ctx, '#a0522d', 380, 170, 180, 112); windows(ctx, 380, 170, 180, 112, '#5a2a1a');
    R(ctx, '#8a4a2a', 520, 40, 26, 140); R(ctx, '#6a3a1a', 516, 36, 34, 8);   // chaminé
    const gram = (x) => { R(ctx, '#f4efe2', x, 220, 60, 62); poly(ctx, '#6b3a1e', [[x - 6, 222], [x + 30, 180], [x + 66, 222]]); ctx.strokeStyle = '#6b3a1e'; ctx.lineWidth = 3; [[x, 240, x + 60, 240], [x + 30, 222, x + 30, 282], [x, 222, x + 60, 282]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }); };
    [60, 160, 700, 800].forEach(gram);
  });
  // ---------------- CENTRO-OESTE ----------------
  tex('uf_ms', (ctx) => {   // Pantanal: água, capim e tuiuiús
    hills(ctx, '#8fae6a', 240, 14, 3);
    for (let x = 0; x < 960; x += 160) ellipse(ctx, '#4a90b8', x + 80, 270, 70, 14);
    for (let x = 0; x < 960; x += 12) R(ctx, '#6b8a3a', x, 250 + (x % 24 ? 4 : 0), 3, 30);
    const tuiuiu = (x) => { R(ctx, '#1b1b1b', x + 6, 236, 2, 30); R(ctx, '#1b1b1b', x + 12, 236, 2, 30); ellipse(ctx, '#ffffff', x + 10, 228, 14, 9); R(ctx, '#d62828', x + 2, 214, 6, 8); R(ctx, '#1b1b1b', x, 198, 6, 18); R(ctx, '#1b1b1b', x - 12, 202, 14, 3); };
    [180, 220, 600, 760].forEach(tuiuiu);
    [100, 420, 880].forEach((x) => palm(ctx, x, 270, 90, '#3f7a3a'));
  });
  tex('uf_mt', (ctx) => {   // Chapada dos Guimarães: paredões vermelhos e cachoeira Véu de Noiva
    poly(ctx, '#b8572e', [[0, 300], [0, 120], [300, 110], [360, 100], [400, 300]]);
    poly(ctx, '#c86a3a', [[560, 300], [600, 96], [960, 110], [960, 300]]);
    R(ctx, '#d98a5a', 0, 118, 380, 8); R(ctx, '#d98a5a', 600, 104, 360, 8);
    R(ctx, '#3f7a3a', 0, 108, 400, 10); R(ctx, '#3f7a3a', 560, 92, 400, 12);
    R(ctx, '#e8f4ff', 392, 112, 20, 168); R(ctx, '#ffffff', 398, 112, 6, 168);
    ellipse(ctx, '#bfe6ff', 402, 282, 50, 10);
    for (let x = 420; x < 560; x += 30) { R(ctx, '#5e3e22', x, 230, 4, 50); circle(ctx, '#4f7a3a', x + 2, 226, 14); }
  });
  tex('uf_go', (ctx) => {   // Chapada dos Veadeiros: cerrado, mesas e cachoeira
    poly(ctx, '#9a7a5a', [[200, 300], [240, 140], [420, 130], [460, 300]]);
    poly(ctx, '#8a6a4a', [[600, 300], [650, 160], [820, 150], [860, 300]]);
    R(ctx, '#6b8a3a', 240, 132, 180, 10); R(ctx, '#6b8a3a', 650, 152, 170, 10);
    R(ctx, '#e8f4ff', 330, 140, 14, 150);
    for (let x = 0; x < 960; x += 70) { ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 20, 290); ctx.quadraticCurveTo(x + 10, 260, x + 26, 240); ctx.stroke(); circle(ctx, x % 140 ? '#6b8a3a' : '#f5c518', x + 26, 236, 16); }
  });
  // ---------------- NORTE ----------------
  tex('uf_ro', (ctx) => {   // Três Caixas d'Água + locomotiva da Madeira-Mamoré
    forest(ctx, 270, '#2f6b3a', '#3f8a4a');
    [380, 450, 520].forEach((x) => { R(ctx, '#9aa0a8', x + 14, 120, 6, 150); R(ctx, '#7a8088', x, 80, 34, 50); poly(ctx, '#5a6068', [[x - 4, 80], [x + 17, 58], [x + 38, 80]]); });
    R(ctx, '#1b1b22', 600, 236, 90, 34); R(ctx, '#1b1b22', 610, 210, 30, 30); R(ctx, '#1b1b22', 672, 196, 14, 40);
    circle(ctx, '#d62828', 620, 272, 12); circle(ctx, '#d62828', 654, 272, 12); circle(ctx, '#d62828', 680, 272, 9);
    R(ctx, '#ffd23f', 604, 244, 8, 6);
    circle(ctx, 'rgba(220,220,220,0.8)', 680, 180, 12); circle(ctx, 'rgba(220,220,220,0.6)', 696, 160, 16);
  });
  tex('uf_ac', (ctx) => {   // Floresta + Palácio Rio Branco
    forest(ctx, 272, '#2a6a38', '#3a8a48');
    R(ctx, '#f4f1ea', 360, 170, 240, 110); R(ctx, '#e0dbd0', 360, 170, 240, 8);
    poly(ctx, '#f4f1ea', [[400, 170], [480, 130], [560, 170]]);
    for (let x = 376; x < 590; x += 26) R(ctx, '#ffffff', x, 190, 10, 80);
    ellipse(ctx, '#e0dbd0', 480, 132, 22, 18, Math.PI, 0);
    R(ctx, '#1f9d55', 470, 100, 3, 20); R(ctx, '#ffd23f', 473, 100, 14, 9);
  });
  tex('uf_am', (ctx) => {   // Teatro Amazonas + rio
    forest(ctx, 262, '#2a6a38', '#3a8a48');
    R(ctx, '#3a6a7a', 0, 270, 960, 30);
    R(ctx, '#f2a5a0', 340, 150, 280, 120); R(ctx, '#ffffff', 340, 150, 280, 8);
    for (let x = 360; x < 610; x += 30) R(ctx, '#ffffff', x, 175, 10, 90);
    poly(ctx, '#f2a5a0', [[400, 150], [480, 120], [560, 150]]);
    // cúpula colorida (verde, amarelo e azul)
    const cols = ['#2e9d4a', '#ffd23f', '#2b6cd4'];
    for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.moveTo(480, 50); ctx.arc(480, 118, 52, Math.PI + i * Math.PI / 9, Math.PI + (i + 1) * Math.PI / 9); ctx.closePath(); ctx.fill(); }
    R(ctx, '#ffd23f', 476, 40, 8, 14);
  });
  tex('uf_rr', (ctx) => {   // Monte Roraima (tepui) com cachoeiras + lavrado
    hills(ctx, '#9aae6a', 270, 10, 4);
    poly(ctx, '#5a5a6a', [[160, 300], [220, 100], [300, 80], [700, 76], [780, 96], [840, 300]]);
    R(ctx, '#4a4a5a', 220, 92, 560, 12); R(ctx, '#3f7a4a', 230, 80, 540, 10);
    for (let x = 260; x < 760; x += 90) R(ctx, '#e8f4ff', x, 104, 4, 170);
    for (let x = 0; x < 960; x += 50) { R(ctx, '#7a5a3a', x + 10, 260, 4, 26); circle(ctx, '#6b8a3a', x + 12, 256, 10); }
  });
  tex('uf_ap', (ctx) => {   // Marco Zero do Equador + Fortaleza de São José
    hills(ctx, '#6b9a6e', 260, 12, 3);
    R(ctx, '#3a6a7a', 0, 276, 960, 24);
    R(ctx, '#e8e8e8', 470, 70, 20, 210); poly(ctx, '#e8e8e8', [[466, 70], [480, 40], [494, 70]]);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(480, 150, 54, 0, Math.PI * 2); ctx.stroke();
    R(ctx, '#d62828', 0, 278, 960, 3);
    ctx.font = 'bold 13px Verdana'; ctx.fillStyle = '#ffffff'; ctx.fillText('LINHA DO EQUADOR  0°', 520, 270);
    poly(ctx, '#9a8a70', [[80, 280], [100, 230], [260, 230], [280, 280]]); R(ctx, '#8a7a60', 100, 226, 160, 6);
    poly(ctx, '#9a8a70', [[90, 232], [70, 210], [110, 210]]); poly(ctx, '#9a8a70', [[250, 232], [230, 210], [270, 210]]);
  });
  tex('uf_pa', (ctx) => {   // Ver-o-Peso (mercado de ferro azul com torrezinhas) + barcos
    forest(ctx, 250, '#3a7a48', '#4a9a58');
    R(ctx, '#4a7a8a', 0, 270, 960, 30);
    R(ctx, '#7a9ab0', 330, 170, 300, 100); windows(ctx, 330, 170, 300, 100, '#4a6a80');
    [330, 410, 530, 610].forEach((x) => { R(ctx, '#5a7a90', x, 120, 20, 60); poly(ctx, '#3a5a70', [[x - 4, 120], [x + 10, 92], [x + 24, 120]]); });
    const boat = (x, c) => { poly(ctx, c, [[x, 274], [x + 70, 274], [x + 60, 290], [x + 10, 290]]); R(ctx, '#ffffff', x + 16, 260, 36, 14); };
    boat(100, '#d62828'); boat(720, '#2b6cd4'); boat(820, '#ffd23f');
  });
  tex('uf_to', (ctx) => {   // Jalapão: dunas laranja e Serra do Espírito Santo
    poly(ctx, '#c4703a', [[0, 300], [0, 150], [260, 140], [300, 300]]);
    R(ctx, '#d98a4a', 0, 146, 260, 8);
    hills(ctx, '#e8964a', 270, 70, 2, 1.2);
    hills(ctx, '#f2b06a', 290, 40, 3, 0.3);
    for (let x = 0; x < 960; x += 40) { R(ctx, '#d4a83a', x + 10, 270, 2, 14); R(ctx, '#f5d36a', x + 8, 266, 6, 4); }  // capim dourado
  });
  // ---------------- NORDESTE ----------------
  tex('uf_ma', (ctx) => {   // Lençóis Maranhenses: dunas brancas com lagoas azuis
    hills(ctx, '#f4efe2', 220, 60, 3);
    hills(ctx, '#ffffff', 250, 40, 5, 0.6);
    for (let x = 60; x < 960; x += 200) ellipse(ctx, '#4ab8d8', x, 272, 60, 12);
    for (let x = 160; x < 960; x += 200) ellipse(ctx, '#2a98c4', x, 286, 46, 9);
  });
  tex('uf_pi', (ctx) => {   // Serra da Capivara e a Pedra Furada
    hills(ctx, '#c49a6a', 250, 20, 3);
    poly(ctx, '#b8572e', [[300, 300], [320, 120], [420, 90], [560, 96], [640, 130], [660, 300]]);
    ellipse(ctx, 'rgba(0,0,0,0)', 0, 0, 1, 1);
    ctx.globalCompositeOperation = 'destination-out'; ellipse(ctx, '#000', 480, 200, 60, 70); ctx.globalCompositeOperation = 'source-over';
    R(ctx, '#d98a5a', 330, 120, 300, 6);
    [[100, 230, 30], [780, 220, 36], [880, 240, 24]].forEach(([x, y, r]) => ellipse(ctx, '#a84a2a', x, y + r, r, r * 1.6, Math.PI, 0));
    for (let x = 20; x < 960; x += 120) { R(ctx, '#3f7a3a', x, 240, 6, 44); R(ctx, '#3f7a3a', x - 8, 252, 8, 4); R(ctx, '#3f7a3a', x - 8, 240, 4, 14); R(ctx, '#3f7a3a', x + 6, 248, 8, 4); R(ctx, '#3f7a3a', x + 10, 236, 4, 14); }
  });
  tex('uf_ce', (ctx) => {   // Dunas, jangadas e farol (Fortaleza)
    hills(ctx, '#f2d79a', 230, 50, 2, 0.4);
    sea(ctx, 256, '#1f9fb8', '#5fd0e0');
    jangada(ctx, 300, 270, '#ffffff'); jangada(ctx, 620, 274, '#ffd23f'); jangada(ctx, 820, 268, '#e53935');
    R(ctx, '#ffffff', 120, 120, 26, 140); R(ctx, '#d62828', 120, 150, 26, 14); R(ctx, '#d62828', 120, 196, 26, 14);
    R(ctx, '#2b2b33', 118, 104, 30, 18); circle(ctx, '#ffe066', 133, 112, 6);
  });
  tex('uf_rn', (ctx) => {   // Forte dos Reis Magos + dunas de Genipabu com dromedários
    hills(ctx, '#f2c88a', 240, 50, 2, 1);
    sea(ctx, 262);
    poly(ctx, '#d9cdb0', [[300, 262], [330, 210], [560, 210], [590, 262]]); R(ctx, '#c4b896', 330, 206, 230, 6);
    poly(ctx, '#d9cdb0', [[330, 212], [300, 190], [350, 190]]); poly(ctx, '#d9cdb0', [[560, 212], [540, 190], [590, 190]]);
    R(ctx, '#1f9d55', 444, 160, 3, 46); R(ctx, '#ffd23f', 447, 160, 18, 12);
    const camel = (x) => { R(ctx, '#b8834a', x, 196, 4, 30); R(ctx, '#b8834a', x + 30, 196, 4, 30); ellipse(ctx, '#c8935a', x + 18, 192, 22, 12); circle(ctx, '#c8935a', x + 18, 180, 10); R(ctx, '#c8935a', x + 36, 166, 6, 26); ellipse(ctx, '#c8935a', x + 44, 166, 9, 6); };
    camel(680); camel(780);
  });
  tex('uf_pb', (ctx) => {   // Farol do Cabo Branco + falésias
    sea(ctx, 254, '#1f8fc4', '#5fc0e0');
    poly(ctx, '#c4703a', [[600, 300], [620, 200], [960, 190], [960, 300]]); R(ctx, '#3f8a3a', 620, 188, 340, 14);
    poly(ctx, '#ffffff', [[700, 190], [720, 60], [760, 60], [790, 190]]);
    R(ctx, '#e8e8e8', 712, 56, 56, 10); R(ctx, '#2b2b33', 726, 40, 28, 18); circle(ctx, '#ffe066', 740, 48, 6);
    for (let y = 80; y < 190; y += 30) R(ctx, '#3a6a8a', 740, y, 8, 10);
    for (let x = 60; x < 560; x += 140) palm(ctx, x, 262, 100);
  });
  tex('uf_pe', (ctx) => {   // Olinda: casinhas coloridas no morro e igrejas
    hills(ctx, '#5f8a5a', 200, 60, 2, 0.3);
    const cols = ['#f2c14e', '#4fa3e0', '#e5677b', '#7bc47f', '#f08a3c', '#b98bd8'];
    for (let i = 0; i < 18; i++) { const x = i * 54; const y = 200 + Math.abs(Math.sin(i * 0.5)) * 40; R(ctx, cols[i % 6], x, y, 46, 300 - y); poly(ctx, '#a0522d', [[x - 2, y], [x + 23, y - 12], [x + 48, y]]); R(ctx, '#ffffff', x + 8, y + 12, 8, 12); R(ctx, '#ffffff', x + 28, y + 12, 8, 12); }
    const church = (x, y) => { R(ctx, '#ffffff', x, y, 60, 70); R(ctx, '#ffffff', x - 6, y - 30, 16, 100); R(ctx, '#ffffff', x + 50, y - 30, 16, 100); poly(ctx, '#ffffff', [[x, y], [x + 30, y - 22], [x + 60, y]]); R(ctx, '#6b3a1e', x + 22, y + 40, 16, 30); };
    church(300, 130); church(700, 140);
  });
  tex('uf_al', (ctx) => {   // Coqueiros e jangadas no mar verde de Maceió
    sea(ctx, 240, '#1fb8a8', '#7fe0d0');
    R(ctx, '#f2d79a', 0, 282, 960, 18);
    for (let x = 40; x < 960; x += 130) palm(ctx, x, 284, 120 + (x % 3) * 10);
    jangada(ctx, 220, 262, '#ffffff'); jangada(ctx, 520, 258, '#4fa3e0'); jangada(ctx, 760, 264, '#ffd23f');
  });
  tex('uf_se', (ctx) => {   // Arcos da Orla de Atalaia (Aracaju)
    sea(ctx, 236);
    R(ctx, '#f2d79a', 0, 270, 960, 30);
    for (let i = 0; i < 5; i++) {
      const x = 260 + i * 90;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, 270, 40, Math.PI, 0); ctx.stroke();
    }
    for (let x = 30; x < 960; x += 200) palm(ctx, x, 272, 110);
  });
  generateStateExtras(scene);
}

// ---------------- Extras dos estados: fundo dos buracos, silhuetas, neblina e enfeites típicos ----------------
function generateStateExtras(scene) {
  const make = (key, w, h, draw) => { const t = scene.textures.createCanvas(key, w, h); draw(t.getContext(), w, h); t.refresh(); };
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const circ = (ctx, c, x, y, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const ell = (ctx, c, x, y, rx, ry) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const tri = (ctx, c, a, b, d) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...d); ctx.closePath(); ctx.fill(); };
  const WHITE = '#ffffff';

  // ---- o que aparece embaixo dos buracos ----
  make('pit_water', 480, 80, (ctx) => {
    const gr = ctx.createLinearGradient(0, 0, 0, 80); gr.addColorStop(0, '#3fa7d6'); gr.addColorStop(1, '#0f4a6a');
    ctx.fillStyle = gr; ctx.fillRect(0, 6, 480, 74);
    for (let x = 0; x < 480; x += 40) ell(ctx, WHITE, x + 20, 6, 22, 5);
    for (let x = 0; x < 480; x += 60) { R(ctx, 'rgba(255,255,255,0.3)', x + 10, 24, 22, 2); R(ctx, 'rgba(255,255,255,0.22)', x + 36, 44, 16, 2); }
  });
  make('pit_river', 480, 80, (ctx) => {
    const gr = ctx.createLinearGradient(0, 0, 0, 80); gr.addColorStop(0, '#7a8a4a'); gr.addColorStop(0.3, '#4a5a32'); gr.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = gr; ctx.fillRect(0, 4, 480, 76);
    R(ctx, 'rgba(255,255,255,0.25)', 0, 4, 480, 2);
    for (let x = 20; x < 480; x += 80) {
      ell(ctx, '#3f8a3a', x, 12, 15, 4); ell(ctx, '#5cb85c', x - 2, 11, 10, 2);
      if (x % 160 === 20) { circ(ctx, '#ff8ab3', x + 4, 8, 3); circ(ctx, '#ffffff', x + 4, 8, 1); }
    }
  });
  make('pit_chasm', 480, 100, (ctx) => {   // cinza claro: o tema pinta com o tint
    const gr = ctx.createLinearGradient(0, 0, 0, 100); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.35, '#8a8a8a'); gr.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 480, 100);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    [22, 46, 70].forEach((y, i) => { ctx.beginPath(); for (let x = 0; x <= 480; x += 20) ctx.lineTo(x, y + ((x / 20 + i) % 2 ? 4 : -4)); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; for (let x = 30; x < 480; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 6, 40); ctx.lineTo(x + 4, 90); ctx.stroke(); }
  });

  // ---- silhuetas (desenhadas em branco; o tema pinta com o tint) ----
  const tree = (ctx, x, base, h, r) => { R(ctx, WHITE, x - 2, base - h, 4, h); circ(ctx, WHITE, x, base - h, r); circ(ctx, WHITE, x - r * 0.6, base - h + r * 0.5, r * 0.7); circ(ctx, WHITE, x + r * 0.6, base - h + r * 0.5, r * 0.7); };
  const fan = (ctx, x, y, len) => { [[-1, 0.2], [-0.7, -0.5], [0, -0.8], [0.7, -0.5], [1, 0.2]].forEach(([dx, dy]) => tri(ctx, WHITE, [x, y], [x + dx * len, y + dy * len], [x + dx * len * 0.5, y + dy * len * 0.5 + 8])); };
  const palmSil = (ctx, x, base, h) => { ctx.strokeStyle = WHITE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 8, base - h / 2, x + 3, base - h); ctx.stroke(); fan(ctx, x + 3, base - h, 28); };
  make('sil_mata', 960, 90, (ctx) => { for (let x = 10; x < 940; x += 46) tree(ctx, x, 90, 38 + ((x * 13) % 38), 15 + ((x * 7) % 9)); R(ctx, WHITE, 0, 80, 960, 10); });
  make('sil_dunas', 960, 90, (ctx) => {
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(0, 90);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 60 + 14 * Math.sin((x / 960) * Math.PI * 6) + 6 * Math.sin((x / 960) * Math.PI * 14));
    ctx.lineTo(960, 90); ctx.closePath(); ctx.fill();
    [140, 520, 820].forEach((x) => palmSil(ctx, x, 70, 44));
  });
  make('sil_cerrado', 960, 90, (ctx) => {
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(0, 90);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 74 + 6 * Math.sin((x / 960) * Math.PI * 10));
    ctx.lineTo(960, 90); ctx.closePath(); ctx.fill();
    [120, 400, 700, 880].forEach((x) => { R(ctx, WHITE, x - 2, 30, 4, 50); fan(ctx, x, 30, 26); });
    [260, 560].forEach((x) => { tri(ctx, WHITE, [x - 14, 80], [x, 52], [x + 14, 80]); });
    for (let x = 40; x < 960; x += 90) { circ(ctx, WHITE, x, 74, 10); circ(ctx, WHITE, x + 12, 76, 7); }
  });
  make('sil_sul', 960, 90, (ctx) => {
    for (let x = 30; x < 960; x += 110) {
      const h = 52 + ((x * 11) % 22);
      R(ctx, WHITE, x - 2, 90 - h, 4, h);
      [0, 1, 2].forEach((i) => ell(ctx, WHITE, x, 90 - h + i * 8, 24 - i * 5, 5));
    }
    for (let x = 80; x < 960; x += 110) { tri(ctx, WHITE, [x - 14, 90], [x, 50], [x + 14, 90]); }
    R(ctx, WHITE, 0, 82, 960, 8);
  });
  make('sil_coqueiros', 960, 90, (ctx) => { for (let x = 60; x < 940; x += 120) palmSil(ctx, x, 90, 52 + ((x * 3) % 22)); R(ctx, WHITE, 0, 84, 960, 6); });
  make('sil_serra', 960, 90, (ctx) => {
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(0, 90);
    for (let x = 0; x <= 960; x += 12) ctx.lineTo(x, 50 + 22 * Math.abs(Math.sin((x / 960) * Math.PI * 7)) + 8 * Math.sin((x / 960) * Math.PI * 19));
    ctx.lineTo(960, 90); ctx.closePath(); ctx.fill();
  });

  // ---- neblina ----
  make('fog', 480, 240, (ctx) => {
    const blob = (x, y, r) => {
      [x, x - 480, x + 480].forEach((cx) => {
        const gr = ctx.createRadialGradient(cx, y, 0, cx, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - r, y - r, r * 2, r * 2);
      });
    };
    [[60, 120, 90], [200, 90, 110], [340, 140, 100], [440, 100, 70], [120, 190, 80], [300, 40, 70]].forEach((b) => blob(...b));
  });

  // ---- enfeites típicos de cada região ----
  make('dec_samambaia', 40, 34, (ctx) => {
    [[-16, -22], [-9, -30], [0, -33], [9, -30], [16, -22]].forEach(([dx, dy]) => {
      ctx.strokeStyle = '#2e8b3e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 34); ctx.quadraticCurveTo(20 + dx * 0.4, 34 + dy * 0.9, 20 + dx, 34 + dy); ctx.stroke();
      for (let t = 0.3; t < 1; t += 0.2) { const px = 20 + dx * t, py = 34 + dy * t; R(ctx, '#4caf50', px - 3, py, 6, 2); }
    });
  });
  make('dec_acai', 36, 30, (ctx) => {
    ell(ctx, '#8a5a2b', 18, 24, 15, 6); R(ctx, '#8a5a2b', 3, 12, 30, 12); ell(ctx, '#a87a45', 18, 12, 15, 4);
    [[8, 9], [14, 6], [21, 6], [27, 9], [11, 11], [24, 11], [18, 8]].forEach(([x, y]) => circ(ctx, '#4a1a5a', x, y, 4));
    circ(ctx, '#7a3a8a', 14, 5, 1.5); circ(ctx, '#7a3a8a', 22, 5, 1.5);
  });
  make('dec_hortensia', 34, 26, (ctx) => {
    R(ctx, '#2e7d32', 15, 14, 3, 12); ell(ctx, '#3f9a46', 8, 20, 8, 4); ell(ctx, '#3f9a46', 26, 20, 8, 4);
    [[9, 9], [17, 5], [25, 9], [13, 12], [21, 12]].forEach(([x, y], i) => circ(ctx, i % 2 ? '#e8a0d0' : '#7a9ae8', x, y, 6));
  });
  make('dec_cuia', 26, 28, (ctx) => {
    ell(ctx, '#3a2414', 12, 20, 11, 8); R(ctx, '#3a2414', 3, 10, 18, 10); ell(ctx, '#5a3a22', 12, 10, 9, 3);
    ell(ctx, '#4a7a2a', 12, 10, 7, 2); R(ctx, '#d9d9e0', 17, 0, 2, 18); circ(ctx, '#d9d9e0', 18, 1, 2);
  });
  make('dec_buriti', 60, 110, (ctx) => {
    R(ctx, '#7a5a3a', 28, 34, 5, 76); [40, 52, 64, 76, 88].forEach((y) => R(ctx, '#5e4228', 28, y, 5, 2));
    [[-1, 0.15], [-0.8, -0.45], [-0.35, -0.8], [0.35, -0.8], [0.8, -0.45], [1, 0.15]].forEach(([dx, dy]) => {
      ctx.strokeStyle = '#2e7d3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, 34); ctx.quadraticCurveTo(30 + dx * 14, 34 + dy * 18 - 6, 30 + dx * 28, 34 + dy * 28); ctx.stroke();
    });
    circ(ctx, '#a0522d', 26, 38, 3); circ(ctx, '#a0522d', 34, 40, 3);
  });
  make('dec_tuiuiu', 34, 56, (ctx) => {
    R(ctx, '#1b1b1b', 14, 34, 2, 22); R(ctx, '#1b1b1b', 20, 34, 2, 22);
    ell(ctx, WHITE, 18, 30, 12, 8); tri(ctx, WHITE, [28, 28], [34, 34], [26, 34]);
    R(ctx, WHITE, 6, 12, 5, 20); circ(ctx, '#1b1b1b', 8, 10, 6); R(ctx, '#d62828', 5, 20, 7, 4);
    R(ctx, '#1b1b1b', 0, 10, 4, 2); R(ctx, '#2a2a2a', -2, 9, 10, 2);
  });
  make('dec_capim', 30, 22, (ctx) => {
    for (let i = 0; i < 9; i++) { const x = 3 + i * 3; ctx.strokeStyle = i % 2 ? '#c8a43a' : '#e8c85a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x + (i - 4) * 1.5, 4 + (i % 3) * 3); ctx.stroke(); }
  });
  make('dec_bandeirinha', 100, 46, (ctx) => {
    R(ctx, '#5e3e22', 2, 4, 4, 42); R(ctx, '#5e3e22', 94, 4, 4, 42);
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 6); ctx.quadraticCurveTo(50, 22, 96, 6); ctx.stroke();
    ['#e53935', '#ffd23f', '#2b6cd4', '#2e9d4a', '#ff8ab3', '#f08a3c', '#e53935', '#ffd23f'].forEach((c, i) => {
      const x = 12 + i * 10, y = 6 + Math.sin(((x - 4) / 92) * Math.PI) * 13; tri(ctx, c, [x - 4, y], [x + 4, y], [x, y + 11]);
    });
  });
  make('dec_fogueira', 30, 30, (ctx) => {
    R(ctx, '#5e3e22', 3, 24, 24, 5); R(ctx, '#7a5230', 6, 21, 18, 4);
    tri(ctx, '#e53935', [6, 22], [15, 2], [24, 22]); tri(ctx, '#ff9a1f', [10, 22], [15, 8], [20, 22]); tri(ctx, '#ffe066', [13, 22], [15, 14], [17, 22]);
  });
  make('dec_jangada', 60, 58, (ctx) => {
    R(ctx, '#8a5a2b', 4, 50, 52, 6); R(ctx, '#a87a45', 4, 50, 52, 2); [10, 20, 30, 40, 50].forEach((x) => R(ctx, '#6b4423', x, 50, 1, 6));
    R(ctx, '#5e3e22', 29, 4, 3, 48); tri(ctx, WHITE, [32, 6], [32, 46], [56, 42]); tri(ctx, '#e8e8f0', [29, 14], [29, 46], [10, 42]);
  });
  make('dec_cafe', 34, 36, (ctx) => {
    R(ctx, '#6b4a2a', 16, 18, 3, 18); ell(ctx, '#2e7d32', 17, 14, 15, 11); ell(ctx, '#3f9a46', 12, 10, 8, 5);
    [[8, 14], [14, 18], [22, 12], [26, 17], [18, 8]].forEach(([x, y]) => circ(ctx, '#c62828', x, y, 2.5));
  });
}


// ---------------- Temas das fases dos estados ----------------
// region: usada nas conquistas por região. decor: conjunto de enfeites (DECOR_SETS em config.js).
const STATE_THEMES = {
  es: { uf: 'ES', region: 'sudeste', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xd6f0ff, clouds: 0.8, ground: 'grama', enemy: 'capivara', spike: 'spike', music: 'sertanejo', decor: 'dia', bg: 'uf_es', hill: 0x9fd8a4 },
  mg: { uf: 'MG', region: 'sudeste', sky: 'sun', skyTop: 0x4f9ad6, skyBottom: 0xe8f4ff, clouds: 0.8, ground: 'pedra', enemy: 'caramelo', spike: 'spike', music: 'sertanejo', decor: 'colonial', bg: 'uf_mg', hill: 0x8fae7a },
  pr: { uf: 'PR', region: 'sul', sky: 'sun', skyTop: 0x6a9ac8, skyBottom: 0xe0eef8, clouds: 0.9, ground: 'grama', enemy: 'capivara', spike: 'spike', music: 'gaucho', decor: 'sul', bg: 'uf_pr', hill: 0x8fbc8f },
  sc: { uf: 'SC', region: 'sul', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xd6f0ff, clouds: 0.8, ground: 'grama', enemy: 'crab', spike: 'urchin', music: 'gaucho', decor: 'sul', bg: 'uf_sc', hill: 0x7faa7a },
  rs: { uf: 'RS', region: 'sul', sky: 'sun', skyTop: 0x5a8ac0, skyBottom: 0xdfeaf2, clouds: 1, ground: 'grama', enemy: 'caramelo', spike: 'spike', music: 'gaucho', decor: 'sul', bg: 'uf_rs', hill: 0x9fc88a },
  ms: { uf: 'MS', region: 'centro_oeste', sky: 'sunset', skyTop: 0x4a6ab0, skyBottom: 0xffc48a, clouds: 0.6, ground: 'grama', enemy: 'capivara', spike: 'spike', music: 'sertanejo', decor: 'pantanal', bg: 'uf_ms', hill: 0xa8c88a },
  mt: { uf: 'MT', region: 'centro_oeste', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xf2dcb8, clouds: 0.6, ground: 'cerrado', enemy: 'capivara', spike: 'spike', music: 'sertanejo', decor: 'cerrado', bg: 'uf_mt', hill: 0xc89a6a },
  go: { uf: 'GO', region: 'centro_oeste', sky: 'sun', skyTop: 0x4fa3e0, skyBottom: 0xf2e6c8, clouds: 0.7, ground: 'cerrado', enemy: 'caramelo', spike: 'spike', music: 'sertanejo', decor: 'cerrado', bg: 'uf_go', hill: 0xb8a87a },
  ro: { uf: 'RO', region: 'norte', sky: 'sun', skyTop: 0x4f9ad6, skyBottom: 0xd8f0e0, clouds: 0.8, ground: 'cerrado', enemy: 'capivara', spike: 'spike', music: 'carimbo', decor: 'mata', bg: 'uf_ro', hill: 0x5f9a6a },
  ac: { uf: 'AC', region: 'norte', sky: 'sun', skyTop: 0x4a9ac0, skyBottom: 0xd0f0d8, clouds: 0.9, ground: 'grama', enemy: 'capivara', spike: 'spike', music: 'carimbo', decor: 'mata', bg: 'uf_ac', hill: 0x4f8a5a },
  am: { uf: 'AM', region: 'norte', sky: 'sun', skyTop: 0x3a8ab8, skyBottom: 0xc8ecd8, clouds: 0.9, ground: 'grama', enemy: 'tralalero', spike: 'spike', music: 'carimbo', decor: 'mata', bg: 'uf_am', hill: 0x3f7a4a },
  rr: { uf: 'RR', region: 'norte', sky: 'sun', skyTop: 0x6a8ac8, skyBottom: 0xe8e0d0, clouds: 1, ground: 'cerrado', enemy: 'capivara', spike: 'spike', music: 'carimbo', decor: 'cerrado', bg: 'uf_rr', hill: 0x9aae8a },
  ap: { uf: 'AP', region: 'norte', sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xfff0c0, clouds: 0.8, ground: 'grama', enemy: 'tralalero', spike: 'spike', music: 'carimbo', decor: 'mata', bg: 'uf_ap', hill: 0x6b9a6e },
  pa: { uf: 'PA', region: 'norte', sky: 'sunset', skyTop: 0x4a5aa0, skyBottom: 0xffb88a, clouds: 0.6, ground: 'grama', enemy: 'tralalero', spike: 'spike', music: 'carimbo', decor: 'mata', bg: 'uf_pa', hill: 0x5f8a6a },
  to: { uf: 'TO', region: 'norte', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xffe0b0, clouds: 0.5, ground: 'areia', enemy: 'capivara', spike: 'cacto', music: 'sertanejo', decor: 'sertao', bg: 'uf_to', hill: 0xe8a86a },
  ma: { uf: 'MA', region: 'nordeste', sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xe0f4ff, clouds: 0.7, ground: 'areia', enemy: 'crab', spike: 'urchin', music: 'forro', decor: 'praia', bg: 'uf_ma', hill: 0xf4efe2 },
  pi: { uf: 'PI', region: 'nordeste', sky: 'sun', skyTop: 0x4a8ad0, skyBottom: 0xffe0b8, clouds: 0.5, ground: 'cerrado', enemy: 'caramelo', spike: 'cacto', music: 'forro', decor: 'sertao', bg: 'uf_pi', hill: 0xc49a6a },
  ce: { uf: 'CE', region: 'nordeste', sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xd6f0ff, clouds: 0.7, ground: 'areia', enemy: 'crab', spike: 'urchin', music: 'forro', decor: 'praia', bg: 'uf_ce', hill: 0xf2d79a },
  rn: { uf: 'RN', region: 'nordeste', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xfff0d0, clouds: 0.6, ground: 'areia', enemy: 'crab', spike: 'cacto', music: 'forro', decor: 'sertao', bg: 'uf_rn', hill: 0xf2c88a },
  pb: { uf: 'PB', region: 'nordeste', sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xd6f0ff, clouds: 0.8, ground: 'areia', enemy: 'tralalero', spike: 'urchin', music: 'forro', decor: 'praia', bg: 'uf_pb', hill: 0x7faa7a },
  pe: { uf: 'PE', region: 'nordeste', sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xfff0d0, clouds: 0.7, ground: 'pedra', enemy: 'caramelo', spike: 'spike', music: 'forro', decor: 'colonial', bg: 'uf_pe', hill: 0x6b9a6e },
  al: { uf: 'AL', region: 'nordeste', sky: 'sun', skyTop: 0x2f9ad6, skyBottom: 0xd6f8f0, clouds: 0.8, ground: 'areia', enemy: 'crab', spike: 'urchin', music: 'forro', decor: 'praia', bg: 'uf_al', hill: 0x5fae8a },
  se: { uf: 'SE', region: 'nordeste', sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xe0f4ff, clouds: 0.8, ground: 'areia', enemy: 'tralalero', spike: 'urchin', music: 'forro', decor: 'praia', bg: 'uf_se', hill: 0x7faa7a },
};

// Monta as camadas do fundo de cada estado e junta tudo nos temas do jogo
// [fundo do buraco, cor do abismo, silhueta, cor da silhueta, bloco, clima, enfeites]
const STATE_EXTRA = {
  es: ['water', 0, 'coqueiros', 0x1f5a3a, 'tijolo', null, ['palm', 'dec_cafe', 'dec_flor', 'dec_pedrinha']],
  mg: ['chasm', 0x6a5a4a, 'serra', 0x3f5a46, 'tijolo', 'neblina', ['dec_cafe', 'dec_flor', 'dec_arbusto', 'dec_pedrinha']],
  pr: ['chasm', 0x3a4a3a, 'sul', 0x1f4a2a, 'madeira', 'neblina', ['dec_araucaria', 'dec_hortensia', 'dec_arbusto', 'dec_pedrinha']],
  sc: ['water', 0, 'serra', 0x2f5a3a, 'tijolo', null, ['dec_hortensia', 'dec_jangada', 'dec_arbusto', 'dec_concha']],
  rs: ['chasm', 0x4a5a3a, 'sul', 0x2a5a2a, 'tijolo', 'poeira', ['dec_cuia', 'dec_hortensia', 'dec_arbusto', 'dec_capim']],
  ms: ['river', 0, 'cerrado', 0x4a6a2a, 'madeira', 'vagalumes', ['dec_tuiuiu', 'dec_capim', 'dec_arbusto', 'dec_arvore']],
  mt: ['chasm', 0x8a4a2a, 'cerrado', 0x6a4a2a, 'arenito', 'poeira', ['dec_buriti', 'dec_capim', 'dec_pedrinha', 'dec_ipe']],
  go: ['chasm', 0x8a5a3a, 'cerrado', 0x5a6a2a, 'arenito', 'poeira', ['dec_buriti', 'dec_capim', 'dec_ipe', 'dec_pedrinha']],
  ro: ['river', 0, 'mata', 0x1a4a2a, 'madeira', 'folhas', ['dec_samambaia', 'dec_acai', 'dec_arvore', 'dec_flor']],
  ac: ['river', 0, 'mata', 0x1a4a2a, 'madeira', 'chuva', ['dec_samambaia', 'dec_acai', 'dec_arvore', 'dec_flor']],
  am: ['river', 0, 'mata', 0x164a28, 'madeira', 'chuva', ['dec_samambaia', 'dec_acai', 'dec_arvore', 'dec_samambaia']],
  rr: ['chasm', 0x5a4a4a, 'serra', 0x4a4a5a, 'arenito', 'neblina', ['dec_capim', 'dec_pedrinha', 'dec_buriti', 'dec_arbusto']],
  ap: ['river', 0, 'mata', 0x1f5a3a, 'madeira', null, ['dec_samambaia', 'dec_acai', 'dec_flor', 'dec_arbusto']],
  pa: ['river', 0, 'mata', 0x1a4a2a, 'madeira', 'chuva', ['dec_samambaia', 'dec_acai', 'dec_arvore', 'dec_flor']],
  to: ['chasm', 0x9a5a2a, 'dunas', 0xb87a3a, 'arenito', 'poeira', ['dec_capim', 'dec_buriti', 'dec_mandacaru', 'dec_pedrinha']],
  ma: ['lagoa', 0, 'dunas', 0xe8dcc0, 'arenito', 'poeira', ['dec_buriti', 'dec_concha', 'dec_capim', 'dec_jangada']],
  pi: ['chasm', 0x8a4a2a, 'serra', 0x8a4a2a, 'arenito', 'poeira', ['dec_mandacaru', 'dec_pedrinha', 'dec_capim', 'dec_bandeirinha']],
  ce: ['water', 0, 'coqueiros', 0x1f6a4a, 'madeira', null, ['palm', 'dec_jangada', 'dec_concha', 'dec_guardasol']],
  rn: ['water', 0, 'dunas', 0xc89a5a, 'arenito', 'poeira', ['dec_mandacaru', 'dec_jangada', 'dec_concha', 'dec_pedrinha']],
  pb: ['water', 0, 'coqueiros', 0x1f6a4a, 'madeira', null, ['palm', 'dec_bandeirinha', 'dec_concha', 'dec_jangada']],
  pe: ['chasm', 0x5a4a3a, 'serra', 0x3a5a46, 'tijolo', null, ['dec_bandeirinha', 'dec_fogueira', 'dec_flor', 'dec_arbusto']],
  al: ['water', 0, 'coqueiros', 0x1f6a4a, 'madeira', null, ['palm', 'dec_jangada', 'dec_bandeirinha', 'dec_concha']],
  se: ['water', 0, 'coqueiros', 0x1f6a4a, 'madeira', null, ['palm', 'dec_fogueira', 'dec_jangada', 'dec_guardasol']],
};
const PIT_DEFS = {
  water: { key: 'pit_water', y: 466, wave: true },
  lagoa: { key: 'pit_water', y: 466, wave: true, tint: 0x9ff0e0 },
  river: { key: 'pit_river', y: 462, wave: true },
  chasm: { key: 'pit_chasm', y: GROUND_Y },
};
const DUST_COLORS = { rs: 0xc8d8a0, mt: 0xd08a5a, go: 0xc89a6a, to: 0xe0b070, ma: 0xffffff, pi: 0xd09a6a, rn: 0xf2d79a };

for (const [key, t] of Object.entries(STATE_THEMES)) {
  const [pit, pitTint, sil, silTint, block, ambient, decor] = STATE_EXTRA[key];
  t.layers = [
    { key: 'hills', y: HEIGHT - 290, factor: 0.1, tint: t.hill, scaleY: 0.7 },
    { key: t.bg, y: HEIGHT - 375, factor: 0.25 },
  ];
  t.pit = { ...PIT_DEFS[pit], ...(pitTint ? { tint: pitTint } : {}) };
  t.sil = { key: 'sil_' + sil, tint: silTint, alpha: 0.85 };
  t.block = block;
  t.ambient = ambient === 'chuva' ? null : ambient;
  t.rain = ambient === 'chuva';
  t.dust = DUST_COLORS[key];
  DECOR_SETS[key] = decor;
  t.decor = key;
  THEMES[key] = t;
}

// As fases antigas também ganham fundo nos buracos (antes aparecia uma faixa vazia embaixo)
const OLD_PITS = { dia: 0x6a4a2a, entardecer: 0x5a3a4a, noite: 0x1a2040, escola: 0x55585f, sp: 0x55585f, brasilia: 0x55585f, bahia: 0x6a5a4a };
for (const [k, tint] of Object.entries(OLD_PITS)) THEMES[k].pit = { key: 'pit_chasm', y: GROUND_Y, tint };

// UFs que já tinham fase (pelo tema) — para as conquistas por região
const OLD_THEME_UF = { sp: ['SP', 'sudeste'], rio: ['RJ', 'sudeste'], bahia: ['BA', 'nordeste'], brasilia: ['DF', 'centro_oeste'] };
const REGIONS = {
  sudeste: { name: 'Sudeste', ufs: ['SP', 'RJ', 'ES', 'MG'], ach: 'reg_sudeste' },
  sul: { name: 'Sul', ufs: ['PR', 'SC', 'RS'], ach: 'reg_sul' },
  centro_oeste: { name: 'Centro-Oeste', ufs: ['MS', 'MT', 'GO', 'DF'], ach: 'reg_centro' },
  norte: { name: 'Norte', ufs: ['RO', 'AC', 'AM', 'RR', 'AP', 'PA', 'TO'], ach: 'reg_norte' },
  nordeste: { name: 'Nordeste', ufs: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'], ach: 'reg_nordeste' },
};
