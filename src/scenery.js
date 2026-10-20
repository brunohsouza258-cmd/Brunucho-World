// Cenários do Brasil desenhados com canvas: Rio, São Paulo, Bahia e a rua da Escola Zacarias.
// As camadas de fundo têm 960px de largura e repetem lado a lado.

function generateScenery(scene) {
  if (typeof generateStateScenery === 'function') generateStateScenery(scene);
  const canvasTex = (key, w, h, draw) => {
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    draw(ctx, w, h);
    tex.refresh();
  };
  // Números "aleatórios" sempre iguais (o cenário não muda a cada vez que abre)
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rect = (ctx, color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const windows = (ctx, x, y, w, h, color, lit, rand, size = 4, gap = 8) => {
    for (let wy = y + 6; wy < y + h - 8; wy += gap) {
      for (let wx = x + 4; wx < x + w - 6; wx += gap) {
        ctx.fillStyle = lit && rand() < 0.35 ? lit : color;
        ctx.fillRect(wx, wy, size, size + 1);
      }
    }
  };

  // ------------------------------------------------------------------ RIO DE JANEIRO
  canvasTex('rio_mountains', 960, 260, (ctx) => {
    // morrinhos ao longo da base
    ctx.fillStyle = '#5a9a72';
    ctx.beginPath(); ctx.moveTo(0, 260);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 222 - 14 * Math.sin((x / 960) * Math.PI * 6) ** 2);
    ctx.lineTo(960, 260); ctx.closePath(); ctx.fill();
    // Corcovado
    ctx.fillStyle = '#3f7a52';
    ctx.beginPath();
    ctx.moveTo(110, 260); ctx.lineTo(195, 150); ctx.lineTo(232, 84); ctx.lineTo(252, 68);
    ctx.lineTo(270, 82); ctx.lineTo(305, 150); ctx.lineTo(390, 260); ctx.closePath(); ctx.fill();
    // Cristo Redentor
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(250, 46, 5, 23); ctx.fillRect(238, 51, 29, 4); ctx.fillRect(248, 60, 9, 9);
    ctx.beginPath(); ctx.arc(252.5, 43, 3.2, 0, Math.PI * 2); ctx.fill();
    // Morro da Urca e Pão de Açúcar
    ctx.fillStyle = '#4b875e'; ctx.beginPath(); ctx.ellipse(575, 262, 85, 78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a6f4b'; ctx.beginPath(); ctx.ellipse(705, 262, 66, 168, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4f8a62'; ctx.beginPath(); ctx.ellipse(690, 150, 18, 40, -0.3, 0, Math.PI * 2); ctx.fill();
    // bondinho
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(585, 186); ctx.lineTo(705, 96); ctx.stroke();
    rect(ctx, '#d62828', 640, 141, 9, 7); rect(ctx, '#ffffff', 642, 143, 5, 2);
    // prediozinhos da orla
    const r = rng(7);
    for (let x = 395; x < 520; x += 14) { const h = 12 + r() * 22; rect(ctx, '#e9e6df', x, 238 - h, 11, h + 20); }
    for (let x = 790; x < 950; x += 14) { const h = 12 + r() * 26; rect(ctx, '#e9e6df', x, 238 - h, 11, h + 20); }
  });

  // ------------------------------------------------------------------ SÃO PAULO
  canvasTex('sp_far', 960, 300, (ctx) => {
    const r = rng(42);
    for (let x = 0; x < 960;) {
      const w = 30 + Math.floor(r() * 40);
      const h = 90 + r() * 150;
      rect(ctx, '#a3aab4', x, 300 - h, w - 3, h);
      windows(ctx, x, 300 - h, w - 3, h, '#b9bfc8', null, r);
      x += w;
    }
  });
  canvasTex('sp_near', 960, 300, (ctx) => {
    const r = rng(99);
    const building = (x, w, h, color = '#5d6570') => {
      rect(ctx, color, x, 300 - h, w, h);
      windows(ctx, x, 300 - h, w, h, '#4a515b', '#ffd98a', r, 5, 10);
    };
    building(0, 70, 150); building(72, 46, 200);
    // Copan (fachada ondulada com as faixas horizontais)
    ctx.fillStyle = '#ddd8cb';
    ctx.beginPath(); ctx.moveTo(125, 300); ctx.lineTo(125, 110);
    ctx.quadraticCurveTo(205, 80, 295, 115); ctx.lineTo(295, 300); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a9a396'; ctx.lineWidth = 2;
    for (let y = 120; y < 300; y += 6) { ctx.beginPath(); ctx.moveTo(126, y); ctx.quadraticCurveTo(205, y - 22, 294, y + 3); ctx.stroke(); }
    // Edifício Itália (o mais alto)
    building(305, 64, 290, '#7d838d');
    rect(ctx, '#6a707a', 300, 0, 74, 14);
    building(376, 52, 170);
    // MASP: caixa vermelha suspensa em pilares vermelhos, com o vão livre embaixo
    rect(ctx, '#c62828', 450, 205, 200, 8);   // viga de cima
    rect(ctx, '#2b2f36', 458, 213, 184, 42);  // caixa de vidro escura
    for (let wx = 464; wx < 640; wx += 12) rect(ctx, '#3f4652', wx, 217, 8, 34);
    rect(ctx, '#c62828', 450, 255, 200, 8);   // viga de baixo
    rect(ctx, '#c62828', 450, 196, 10, 104); rect(ctx, '#c62828', 640, 196, 10, 104); // pilares
    ctx.font = 'bold 12px Verdana, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.fillText('MASP', 532, 285);
    building(662, 58, 230); building(722, 80, 160); building(804, 50, 260); building(856, 104, 190);
    // antenas
    rect(ctx, '#3a3f47', 828, 20, 3, 22); rect(ctx, '#ff4444', 827, 18, 5, 4);
  });

  // ------------------------------------------------------------------ SALVADOR / BAHIA
  canvasTex('ba_city', 960, 280, (ctx) => {
    // mar da Baía de Todos os Santos
    rect(ctx, '#2a8fc4', 0, 236, 960, 44); rect(ctx, '#52b7dc', 0, 236, 960, 6);
    // Cidade Baixa
    const r = rng(5);
    for (let x = 0; x < 960; x += 18) { const h = 10 + r() * 16; rect(ctx, '#efe9dc', x, 236 - h, 15, h); }
    // escarpa verde entre a Cidade Baixa e a Cidade Alta
    ctx.fillStyle = '#6d9a4c';
    ctx.beginPath(); ctx.moveTo(0, 222);
    for (let x = 0; x <= 960; x += 10) ctx.lineTo(x, 118 + 8 * Math.sin((x / 960) * Math.PI * 4));
    ctx.lineTo(960, 222); ctx.closePath(); ctx.fill();
    // Cidade Alta: casinhas coloridas e igrejas
    const colors = ['#f2c14e', '#4fa3e0', '#e5677b', '#7bc47f', '#f08a3c', '#ffffff'];
    for (let x = 0; x < 960; x += 16) {
      const h = 14 + r() * 14; const top = 118 + 8 * Math.sin((x / 960) * Math.PI * 4) - h;
      rect(ctx, colors[Math.floor(r() * colors.length)], x, top, 14, h + 4);
      rect(ctx, '#a0522d', x, top - 2, 14, 3);
    }
    const church = (x) => {
      rect(ctx, '#ffffff', x, 72, 40, 46); rect(ctx, '#ffffff', x - 4, 52, 12, 66); rect(ctx, '#ffffff', x + 32, 52, 12, 66);
      ctx.fillStyle = '#4fa3e0';
      ctx.beginPath(); ctx.moveTo(x - 5, 52); ctx.lineTo(x + 2, 40); ctx.lineTo(x + 9, 52); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 31, 52); ctx.lineTo(x + 38, 40); ctx.lineTo(x + 45, 52); ctx.fill();
      rect(ctx, '#8a5a2b', x + 15, 98, 10, 20);
    };
    church(620); church(860);
    // Elevador Lacerda: torre art déco ligando a Cidade Baixa à Cidade Alta
    rect(ctx, '#f1e8d2', 300, 92, 38, 144);
    for (let x = 304; x < 336; x += 7) rect(ctx, '#d9ccb0', x, 100, 3, 136);
    rect(ctx, '#f1e8d2', 292, 80, 54, 18); rect(ctx, '#d9ccb0', 292, 96, 54, 3);
    rect(ctx, '#f1e8d2', 346, 86, 40, 8);  // passarela até a Cidade Alta
    ctx.font = 'bold 8px Verdana, sans-serif'; ctx.fillStyle = '#7a6a4a'; ctx.fillText('LACERDA', 297, 92);
  });
  canvasTex('pelourinho', 960, 200, (ctx) => {
    // casarões coloniais coloridos do Pelourinho (larguras somam 960 para repetir sem emenda)
    const facades = ['#f2c14e', '#4fa3e0', '#e5677b', '#7bc47f', '#f08a3c', '#b98bd8', '#f7e27a', '#5ec4c0', '#ef8fa8', '#9ccf6a'];
    const widths = [96, 104, 88, 100, 92, 96, 100, 88, 100, 96];
    let x = 0;
    widths.forEach((w, i) => {
      const h = 120 + ((i * 37) % 45);
      const top = 200 - h;
      rect(ctx, facades[i], x, top, w, h);
      rect(ctx, '#a0522d', x - 2, top - 6, w + 4, 8);        // telhado
      rect(ctx, '#ffffff', x, top + 2, w, 3);                // cornija
      // janelas com venezianas, dois andares
      for (let floor = 0; floor < 2; floor++) {
        for (let k = 0; k < 3; k++) {
          const wx = x + 12 + k * ((w - 24) / 3);
          const wy = top + 18 + floor * 44;
          rect(ctx, '#ffffff', wx - 2, wy - 2, 18, 28);
          rect(ctx, i % 2 ? '#2e7d32' : '#1e3f8f', wx, wy, 14, 24);
          rect(ctx, '#ffffff', wx + 6, wy, 2, 24);
        }
      }
      // porta em arco
      ctx.fillStyle = '#6b3a1e';
      ctx.beginPath(); ctx.moveTo(x + w / 2 - 12, 200); ctx.lineTo(x + w / 2 - 12, 172);
      ctx.arc(x + w / 2, 172, 12, Math.PI, 0); ctx.lineTo(x + w / 2 + 12, 200); ctx.closePath(); ctx.fill();
      x += w;
    });
  });

  // ------------------------------------------------------------------ BRASÍLIA
  canvasTex('brasilia', 960, 300, (ctx) => {
    // Ministérios da Esplanada (blocos iguais dos dois lados)
    for (let i = 0; i < 6; i++) {
      for (const x of [40 + i * 52, 640 + i * 52]) {
        rect(ctx, '#d9d4cc', x, 200, 34, 100);
        for (let wy = 206; wy < 296; wy += 7) rect(ctx, '#a9a49c', x + 3, wy, 28, 3);
      }
    }
    // Congresso Nacional: base comprida
    rect(ctx, '#ece8e1', 330, 238, 300, 62);
    rect(ctx, '#cfc9bf', 330, 238, 300, 5);
    // as duas torres (com a passarela no meio)
    rect(ctx, '#f4f1ea', 458, 70, 18, 168); rect(ctx, '#f4f1ea', 484, 70, 18, 168);
    rect(ctx, '#d9d4cc', 476, 140, 8, 6);
    for (let wy = 76; wy < 236; wy += 8) { rect(ctx, '#c9c3b8', 461, wy, 12, 2); rect(ctx, '#c9c3b8', 487, wy, 12, 2); }
    // cúpula da Câmara (virada pra cima, "tigela") e do Senado (virada pra baixo)
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath(); ctx.ellipse(400, 228, 52, 26, 0, 0, Math.PI); ctx.fill();
    ctx.fillRect(348, 222, 104, 6);
    ctx.beginPath(); ctx.ellipse(565, 238, 38, 22, 0, Math.PI, 0); ctx.fill();
    // bandeira do Brasil no mastro
    rect(ctx, '#9aa0a8', 620, 150, 3, 88);
    rect(ctx, '#1f9d55', 623, 152, 30, 20);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(638, 154); ctx.lineTo(651, 162); ctx.lineTo(638, 170); ctx.lineTo(625, 162); ctx.fill();
    ctx.fillStyle = '#1e3f8f'; ctx.beginPath(); ctx.arc(638, 162, 4.5, 0, Math.PI * 2); ctx.fill();
  });

  // ------------------------------------------------------------------ RUA DA ESCOLA
  canvasTex('rua', 960, 220, (ctx) => {
    const colors = ['#f7d9a8', '#cfe8c8', '#f5c6c6', '#c8dcf5', '#f3e7b0', '#e2d0f2'];
    const r = rng(3);
    for (let x = 0, i = 0; x < 960; i++) {
      const w = 90 + Math.floor(r() * 40);
      const h = 70 + r() * 40;
      const top = 220 - h;
      rect(ctx, colors[i % colors.length], x + 4, top, w - 8, h);
      // telhado
      ctx.fillStyle = '#b5532e';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w / 2, top - 26); ctx.lineTo(x + w, top); ctx.closePath(); ctx.fill();
      // janela e porta
      rect(ctx, '#ffffff', x + 14, top + 16, 24, 20); rect(ctx, '#7fc3ff', x + 16, top + 18, 20, 16);
      rect(ctx, '#8a5a2b', x + w - 36, 220 - 38, 18, 38);
      // muro
      rect(ctx, '#d9d4c7', x, 196, w, 24); rect(ctx, '#bdb7a8', x, 196, w, 3);
      // árvore de vez em quando
      if (r() < 0.4) {
        rect(ctx, '#7a5230', x + w - 8, 150, 6, 50);
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(x + w - 5, 140, 22, 0, Math.PI * 2); ctx.fill();
      }
      x += w;
    }
    // postes com fios
    ctx.strokeStyle = '#333333'; ctx.lineWidth = 1;
    for (let px = 60; px < 960 + 240; px += 240) {
      rect(ctx, '#7a7f87', px, 40, 5, 180);
      rect(ctx, '#7a7f87', px - 12, 44, 29, 3);
      ctx.beginPath(); ctx.moveTo(px - 12, 45); ctx.quadraticCurveTo(px + 108, 75, px + 228, 45); ctx.stroke();
    }
  });

  // A Escola Zacarias (aparece uma vez na fase, onde estiver o "S" no mapa)
  canvasTex('escola', 440, 236, (ctx) => {
    // bandeira do Brasil no mastro
    rect(ctx, '#9aa0a8', 6, 10, 3, 226);
    rect(ctx, '#1f9d55', 9, 12, 40, 28);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(29, 15); ctx.lineTo(46, 26); ctx.lineTo(29, 37); ctx.lineTo(12, 26); ctx.fill();
    ctx.fillStyle = '#1e3f8f'; ctx.beginPath(); ctx.arc(29, 26, 6.5, 0, Math.PI * 2); ctx.fill();
    // prédio
    rect(ctx, '#f3e7c9', 40, 64, 390, 172);
    rect(ctx, '#2b6cd4', 40, 196, 390, 40);               // faixa azul de escola pública
    rect(ctx, '#b5532e', 32, 52, 406, 14);                // laje/telhado
    // janelas
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        if (col === 3 || col === 4) continue;             // espaço da porta
        const wx = 56 + col * 46, wy = 82 + row * 52;
        rect(ctx, '#ffffff', wx - 3, wy - 3, 36, 36); rect(ctx, '#9fd3ff', wx, wy, 30, 30);
        rect(ctx, '#ffffff', wx + 14, wy, 2, 30); rect(ctx, '#ffffff', wx, wy + 14, 30, 2);
      }
    }
    // porta de entrada
    rect(ctx, '#7a4a24', 205, 150, 60, 86); rect(ctx, '#5a3418', 234, 150, 2, 86);
    rect(ctx, '#ffd23f', 225, 190, 4, 4); rect(ctx, '#ffd23f', 241, 190, 4, 4);
    ctx.font = 'bold 10px Verdana, sans-serif'; ctx.fillStyle = '#1e3f8f'; ctx.textAlign = 'center';
    ctx.fillText('ENTRADA', 235, 144);
    // placa com o nome
    rect(ctx, '#ffffff', 92, 4, 286, 46); rect(ctx, '#1e3f8f', 96, 8, 278, 38);
    ctx.font = 'bold 24px Verdana, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle';
    ctx.fillText('ESCOLA ZACARIAS', 235, 28);
    // grade na frente (com o portão aberto)
    ctx.fillStyle = '#2e7d32';
    for (let gx = 40; gx < 430; gx += 9) if (gx < 196 || gx > 272) ctx.fillRect(gx, 200, 3, 36);
    rect(ctx, '#2e7d32', 40, 200, 156, 3); rect(ctx, '#2e7d32', 272, 200, 158, 3);
  });

  // ================= DECORAÇÕES (colocadas sozinhas no chão de cada cenário) =================
  canvasTex('dec_flor', 20, 16, (ctx) => {
    rect(ctx, '#3f9a4a', 4, 8, 2, 8); rect(ctx, '#3f9a4a', 13, 6, 2, 10);
    const flower = (x, y, c) => { ctx.fillStyle = c; [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2, 0, 7); ctx.fill(); }); rect(ctx, '#ffd23f', x - 1, y - 1, 2, 2); };
    flower(5, 6, '#ff6b8a'); flower(14, 4, '#ffffff');
  });
  canvasTex('dec_arbusto', 44, 26, (ctx) => {
    ctx.fillStyle = '#2f7d3a'; [[10, 16, 10], [22, 12, 12], [34, 16, 10]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    rect(ctx, '#2f7d3a', 2, 16, 40, 10);
    ctx.fillStyle = '#4caf50'; [[12, 13, 5], [24, 9, 6], [34, 14, 4]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  });
  canvasTex('dec_arvore', 70, 110, (ctx) => {
    rect(ctx, '#7a5230', 30, 60, 10, 50); rect(ctx, '#5e3e22', 36, 60, 4, 50);
    ctx.fillStyle = '#2f7d3a'; [[35, 40, 28], [18, 52, 18], [52, 52, 18]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#4caf50'; [[30, 32, 14], [46, 44, 10], [20, 48, 9]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  });
  canvasTex('dec_pedrinha', 26, 14, (ctx) => {
    ctx.fillStyle = '#7a7068'; ctx.beginPath(); ctx.ellipse(13, 10, 12, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9a9088'; ctx.beginPath(); ctx.ellipse(10, 8, 6, 3, 0, 0, 7); ctx.fill();
  });
  canvasTex('dec_guardasol', 64, 76, (ctx) => {
    rect(ctx, '#e8e8e8', 31, 14, 3, 62);
    const cols = ['#e53935', '#ffffff', '#e53935', '#ffffff', '#e53935', '#ffffff'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(32, 4); ctx.arc(32, 26, 30, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); });
    rect(ctx, '#2b6cd4', 6, 62, 22, 4); rect(ctx, '#2b6cd4', 8, 66, 2, 10); rect(ctx, '#2b6cd4', 24, 66, 2, 10); // cadeira de praia
    rect(ctx, '#ffd23f', 6, 54, 4, 8);
  });
  canvasTex('dec_castelo', 40, 30, (ctx) => {
    ctx.fillStyle = '#e8c47e';
    rect(ctx, '#e8c47e', 4, 12, 32, 18); rect(ctx, '#e8c47e', 2, 6, 10, 24); rect(ctx, '#e8c47e', 28, 6, 10, 24); rect(ctx, '#e8c47e', 15, 2, 10, 14);
    rect(ctx, '#d4ab62', 17, 20, 6, 10); rect(ctx, '#e53935', 19, 0, 2, 4); rect(ctx, '#e53935', 21, 0, 4, 2);
    [2, 6, 10, 28, 32, 36].forEach((x) => rect(ctx, '#d4ab62', x, 6, 2, 2));
  });
  canvasTex('dec_concha', 18, 12, (ctx) => {
    ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.arc(9, 12, 9, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#e88aa3'; ctx.lineWidth = 1; [3, 6, 9, 12, 15].forEach((x) => { ctx.beginPath(); ctx.moveTo(9, 12); ctx.lineTo(x, 4); ctx.stroke(); });
  });
  canvasTex('dec_lixeira', 22, 32, (ctx) => {
    rect(ctx, '#2e7d32', 3, 6, 16, 26); rect(ctx, '#1b5e20', 1, 3, 20, 5);
    rect(ctx, '#4caf50', 6, 10, 2, 18); rect(ctx, '#4caf50', 14, 10, 2, 18);
    rect(ctx, '#ffffff', 7, 16, 8, 6); rect(ctx, '#2e7d32', 9, 18, 4, 2);
  });
  canvasTex('dec_hidrante', 20, 28, (ctx) => {
    rect(ctx, '#d62828', 5, 6, 10, 22); rect(ctx, '#b71c1c', 3, 24, 14, 4); rect(ctx, '#d62828', 1, 12, 18, 5);
    ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.arc(10, 6, 5, Math.PI, 0); ctx.fill();
    rect(ctx, '#ffd23f', 8, 0, 4, 2);
  });
  canvasTex('dec_placa', 40, 60, (ctx) => {
    rect(ctx, '#9aa0a8', 18, 20, 4, 40);
    rect(ctx, '#1f7a3a', 0, 0, 40, 22); rect(ctx, '#ffffff', 2, 2, 36, 18); rect(ctx, '#1f7a3a', 3, 3, 34, 16);
    ctx.font = 'bold 9px Verdana'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('AURA →', 20, 15);
  });
  canvasTex('dec_barraca', 80, 80, (ctx) => {
    // barraca de acarajé
    rect(ctx, '#8a5a2b', 10, 46, 60, 34); rect(ctx, '#ffffff', 10, 46, 60, 6);
    rect(ctx, '#d62828', 30, 56, 20, 14); rect(ctx, '#ffd23f', 33, 59, 14, 8);
    ctx.font = 'bold 9px Verdana'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('ACARAJÉ', 40, 76);
    rect(ctx, '#e8e8e8', 38, 10, 4, 36);
    ['#ffd23f', '#2e9d4a', '#ffd23f', '#2e9d4a', '#ffd23f', '#2e9d4a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(40, 2); ctx.arc(40, 30, 36, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); });
    // fitinhas do Bonfim
    ['#e53935', '#ffd23f', '#2b6cd4', '#2e9d4a', '#ff8ab3'].forEach((c, i) => rect(ctx, c, 14 + i * 11, 30, 2, 12));
  });
  canvasTex('dec_ipe', 80, 120, (ctx) => {
    // ipê-amarelo de Brasília
    rect(ctx, '#6b4a2a', 36, 60, 8, 60);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4;
    [[40, 70, 20, 40], [40, 66, 62, 38], [40, 60, 40, 28]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
    ctx.fillStyle = '#f5c518'; [[40, 32, 26], [18, 44, 18], [62, 42, 18]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#ffe066'; [[34, 24, 10], [56, 38, 8], [20, 40, 7]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  });
  canvasTex('dec_cogumelo', 22, 22, (ctx) => {
    rect(ctx, '#f5e6d0', 8, 10, 6, 12);
    ctx.fillStyle = '#7ff6ff'; ctx.beginPath(); ctx.arc(11, 11, 11, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff'; [[6, 6], [14, 4], [17, 8]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); });
  });
  canvasTex('cacto', 32, 32, (ctx) => {
    rect(ctx, '#3f8a3a', 13, 10, 7, 22); rect(ctx, '#3f8a3a', 5, 16, 5, 10); rect(ctx, '#3f8a3a', 5, 22, 10, 4);
    rect(ctx, '#3f8a3a', 22, 13, 5, 10); rect(ctx, '#3f8a3a', 17, 19, 10, 4);
    rect(ctx, '#5cb85c', 15, 12, 2, 18);
    ctx.fillStyle = '#fff3c0'; [[12, 14], [20, 18], [12, 24], [4, 18], [27, 15], [20, 28]].forEach(([x, y]) => ctx.fillRect(x, y, 2, 1));
    rect(ctx, '#e5677b', 14, 7, 5, 4);
  });
  canvasTex('crumble', 32, 32, (ctx) => {   // bloco que cai quando você pisa
    rect(ctx, '#5a4030', 0, 0, 32, 32); rect(ctx, '#a07850', 2, 2, 28, 28); rect(ctx, '#c49a68', 2, 2, 28, 3); rect(ctx, '#80603c', 2, 25, 28, 5);
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2;
    [[[16, 2], [13, 10], [19, 16], [14, 24], [17, 30]], [[13, 10], [6, 14]], [[19, 16], [26, 20]]].forEach((pts) => {
      ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.stroke();
    });
  });
  canvasTex('dec_araucaria', 70, 130, (ctx) => {
    rect(ctx, '#5e3e22', 32, 30, 6, 100);
    [[35, 30, 34, 9], [35, 42, 28, 8], [35, 22, 22, 7]].forEach(([x, y, rx, ry]) => { ctx.fillStyle = '#2f5d3a'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0); ctx.fill(); });
    ctx.fillStyle = '#3f7a4a'; ctx.beginPath(); ctx.ellipse(35, 28, 26, 5, 0, Math.PI, 0); ctx.fill();
  });
  canvasTex('dec_mandacaru', 40, 70, (ctx) => {
    rect(ctx, '#3f8a3a', 16, 6, 9, 64); rect(ctx, '#3f8a3a', 4, 24, 7, 22); rect(ctx, '#3f8a3a', 4, 40, 14, 6);
    rect(ctx, '#3f8a3a', 30, 16, 7, 24); rect(ctx, '#3f8a3a', 22, 34, 14, 6);
    rect(ctx, '#5cb85c', 19, 8, 2, 60);
    ctx.fillStyle = '#fff3c0'; [[15, 14], [26, 22], [15, 32], [26, 44], [3, 28], [37, 20]].forEach(([x, y]) => ctx.fillRect(x, y, 2, 1));
    rect(ctx, '#ffffff', 17, 2, 6, 5);
  });

  // Sombras/realces nas bordas dos blocos
  canvasTex('edgeL', 32, 32, (ctx) => { const gr = ctx.createLinearGradient(0, 0, 6, 0); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, 6, 32); });
  canvasTex('edgeR', 32, 32, (ctx) => { const gr = ctx.createLinearGradient(32, 0, 26, 0); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(26, 0, 6, 32); });
  canvasTex('edgeB', 32, 32, (ctx) => { const gr = ctx.createLinearGradient(0, 32, 0, 24); gr.addColorStop(0, 'rgba(0,0,0,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 24, 32, 8); });

  // Poste de luz (decoração "L")
  canvasTex('poste', 34, 140, (ctx) => {
    rect(ctx, '#6b6f76', 6, 10, 5, 130);
    rect(ctx, '#6b6f76', 6, 8, 22, 4);
    rect(ctx, '#3a3d42', 20, 10, 12, 6);
    rect(ctx, '#ffe9a0', 22, 16, 8, 3);
    rect(ctx, '#55595f', 3, 132, 11, 8);
  });

  // Cone de trânsito (o "espinho" da cidade)
  canvasTex('cone', 32, 32, (ctx) => {
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(25, 28); ctx.lineTo(7, 28); ctx.closePath(); ctx.fill();
    rect(ctx, '#ffffff', 11, 15, 10, 3); rect(ctx, '#ffffff', 9, 21, 14, 3);
    rect(ctx, '#2b2b2b', 4, 28, 24, 4);
  });
}

// Blocos de chão das cidades, desenhados dentro do tileset (índices 7 a 10).
function drawCityTiles(g) {
  // 7: calçadão de Copacabana (ondas pretas e brancas)
  let ox = TILE * TILES.CALCADAO;
  g.fillStyle(0xf2efe6); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0x1b1b2a);
  for (let x = 0; x < TILE; x++) {
    const y1 = 9 + 5 * Math.sin((x / TILE) * Math.PI * 2);
    const y2 = 25 + 5 * Math.sin((x / TILE) * Math.PI * 2 + Math.PI);
    g.fillRect(ox + x, y1 - 2, 1, 5);
    g.fillRect(ox + x, y2 - 2, 1, 5);
  }
  // 8: calçada (com meio-fio)
  ox = TILE * TILES.SIDEWALK;
  g.fillStyle(0xb7bcc4); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0xd3d7dd); g.fillRect(ox, 0, TILE, 3);
  g.fillStyle(0x969ca5); g.fillRect(ox, 3, TILE, 2); g.fillRect(ox, 18, TILE, 1); g.fillRect(ox + 15, 5, 1, 13); g.fillRect(ox + 31, 19, 1, 13);
  // 9: concreto
  ox = TILE * TILES.CONCRETE;
  g.fillStyle(0x6f747c); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0x5f646b);
  [[4, 6], [20, 4], [12, 16], [26, 22], [6, 26], [18, 28]].forEach(([x, y]) => g.fillRect(ox + x, y, 3, 2));
  // 11: terra vermelha
  ox = TILE * TILES.CLAY;
  g.fillStyle(0xa8502a); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0x94441f); g.fillRect(ox, 20, TILE, 12);
  g.fillStyle(0xc0663a); [[4, 6], [20, 4], [12, 16], [26, 22], [6, 26], [18, 28]].forEach(([x, y]) => g.fillRect(ox + x, y, 3, 2));
  g.fillStyle(0x7a3a1a); [[9, 10], [24, 14], [3, 18], [15, 24]].forEach(([x, y]) => g.fillRect(ox + x, y, 2, 2));
  // 12: terra vermelha com capim por cima
  ox = TILE * TILES.CLAY_TOP;
  g.fillStyle(0xa8502a); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0xc0663a); [[4, 14], [20, 18], [12, 24], [26, 28]].forEach(([x, y]) => g.fillRect(ox + x, y, 3, 2));
  for (let x = 0; x < TILE; x++) {
    const h = 7 + Math.round(2 * Math.sin((x / TILE) * Math.PI * 4));
    g.fillStyle(0x6a8a2a); g.fillRect(ox + x, 0, 1, h);
    g.fillStyle(0x4a6a1a); g.fillRect(ox + x, h, 1, 1);
  }
  g.fillStyle(0xb8c860); g.fillRect(ox, 0, TILE, 2);
  g.fillStyle(0xd4d070); [3, 10, 17, 24, 29].forEach((x) => g.fillRect(ox + x, 1, 1, 3));
  // 10: paralelepípedo
  ox = TILE * TILES.COBBLE;
  g.fillStyle(0x5a534a); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0x9a9083);
  [[1, 1, 14, 14], [17, 1, 14, 14], [1, 17, 6, 14], [9, 17, 14, 14], [25, 17, 6, 14]].forEach(([x, y, w, h]) => g.fillRoundedRect(ox + x, y, w, h, 3));
  g.fillStyle(0xb3a99b);
  [[3, 2], [19, 2], [11, 18]].forEach(([x, y]) => g.fillRect(ox + x, y, 8, 2));
  // 13: caixote de madeira
  ox = TILE * TILES.WOOD;
  g.fillStyle(0x5e3a1c); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0xb8834a); g.fillRect(ox + 2, 2, 28, 28);
  g.fillStyle(0xd09a5e); g.fillRect(ox + 2, 2, 28, 2);
  g.fillStyle(0x8f6030); [9, 16, 23].forEach((y) => g.fillRect(ox + 2, y, 28, 1));
  g.fillStyle(0x9a6a36); g.fillRect(ox + 2, 2, 3, 28); g.fillRect(ox + 27, 2, 3, 28);
  g.fillStyle(0x3b2a20); [[4, 4], [26, 4], [4, 26], [26, 26]].forEach(([x, y]) => g.fillRect(ox + x, y, 2, 2));
  // 14: arenito em camadas
  ox = TILE * TILES.SANDSTONE;
  g.fillStyle(0xd9a766); g.fillRect(ox, 0, TILE, TILE);
  g.fillStyle(0xc98f4e); g.fillRect(ox, 7, TILE, 3); g.fillRect(ox, 21, TILE, 3);
  g.fillStyle(0xe8bd80); g.fillRect(ox, 0, TILE, 2); g.fillRect(ox, 14, TILE, 2); g.fillRect(ox, 28, TILE, 2);
  g.fillStyle(0xb87c3e); [[5, 12], [20, 18], [11, 27], [26, 4]].forEach(([x, y]) => g.fillRect(ox + x, y, 3, 2));
  g.fillStyle(0x9a6a30); g.fillRect(ox, 31, TILE, 1); g.fillRect(ox + 31, 0, 1, TILE);
  // 15: tijolo vermelho colonial
  ox = TILE * TILES.REDBRICK;
  g.fillStyle(0xcdbf9f); g.fillRect(ox, 0, TILE, TILE);
  for (let row = 0; row < 4; row++) {
    for (let k = -1; k < 3; k++) {
      const x0 = Math.max(ox + k * 16 + (row % 2 ? 8 : 0), ox), x1 = Math.min(ox + k * 16 + (row % 2 ? 8 : 0) + 15, ox + TILE);
      if (x1 <= x0) continue;
      g.fillStyle(0xb5502e); g.fillRect(x0, row * 8 + 1, x1 - x0, 6);
      g.fillStyle(0xcf6a42); g.fillRect(x0, row * 8 + 1, x1 - x0, 1);
      g.fillStyle(0x8f3a20); g.fillRect(x0, row * 8 + 6, x1 - x0, 1);
    }
  }
}
