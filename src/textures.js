// Todos os gráficos são desenhados por código e viram texturas.
// Para trocar por imagens suas, carregue-as no BootScene com os mesmos nomes (keys).

function generateTextures(scene) {
  const g = scene.add.graphics();
  const make = (key, w, h, draw) => { g.clear(); draw(g); g.generateTexture(key, w, h); };

  // --- Tileset: 4 blocos lado a lado (terra, grama, tijolo, plataforma de madeira) ---
  make('tiles', TILE * TILE_COUNT, TILE, (g) => {
    const dirt = (ox) => {
      g.fillStyle(0x8b5a2b); g.fillRect(ox, 0, TILE, TILE);
      g.fillStyle(0x6e4521);
      [[4, 6], [20, 4], [12, 16], [26, 22], [6, 26], [18, 28]].forEach(([x, y]) => g.fillRect(ox + x, y, 4, 3));
    };
    // 0: terra
    dirt(0);
    // 1: grama
    dirt(TILE);
    g.fillStyle(0x4caf50); g.fillRect(TILE, 0, TILE, 9);
    g.fillStyle(0x388e3c); g.fillRect(TILE, 9, TILE, 3);
    g.fillStyle(0x7ed957); g.fillRect(TILE, 0, TILE, 3);
    // 2: tijolo
    const bx = TILE * 2;
    g.fillStyle(0x5c6370); g.fillRect(bx, 0, TILE, TILE);
    g.fillStyle(0x8a93a6);
    g.fillRect(bx + 1, 1, 14, 14); g.fillRect(bx + 17, 1, 14, 14);
    g.fillRect(bx + 1, 17, 6, 14); g.fillRect(bx + 9, 17, 14, 14); g.fillRect(bx + 25, 17, 6, 14);
    g.fillStyle(0xa9b2c3); g.fillRect(bx + 1, 1, 14, 2); g.fillRect(bx + 17, 1, 14, 2);
    // 3: plataforma de madeira (só a parte de cima é sólida)
    const px = TILE * 3;
    g.fillStyle(0x7a4f2a); g.fillRect(px, 0, TILE, 11);
    g.fillStyle(0xc4935c); g.fillRect(px, 0, TILE, 8);
    g.fillStyle(0xe0b27a); g.fillRect(px, 0, TILE, 2);
    g.fillStyle(0x7a4f2a); g.fillRect(px + 15, 0, 2, 8);
    // 4: areia
    const sand = (ox) => {
      g.fillStyle(0xe8c47e); g.fillRect(ox, 0, TILE, TILE);
      g.fillStyle(0xd4ab62);
      [[5, 5], [22, 3], [13, 14], [27, 19], [4, 24], [17, 27]].forEach(([x, y]) => g.fillRect(ox + x, y, 3, 2));
      g.fillStyle(0xf5dca4);
      [[10, 8], [24, 12], [8, 18], [20, 23]].forEach(([x, y]) => g.fillRect(ox + x, y, 2, 2));
    };
    sand(TILE * 4);
    // 5: areia de cima (mais clara, com marquinha de onda)
    sand(TILE * 5);
    g.fillStyle(0xfbe6b4); g.fillRect(TILE * 5, 0, TILE, 7);
    g.fillStyle(0xfff4d6); g.fillRect(TILE * 5, 0, TILE, 2);
    // 6: pedra
    const rx = TILE * 6;
    g.fillStyle(0x5c544c); g.fillRect(rx, 0, TILE, TILE);
    g.fillStyle(0x7a7068); g.fillRoundedRect(rx + 1, 1, 30, 30, 8);
    g.fillStyle(0x938a80); g.fillRoundedRect(rx + 4, 3, 16, 9, 4);
    g.fillStyle(0x4f6b3a); g.fillRect(rx + 22, 24, 6, 3); g.fillRect(rx + 4, 26, 4, 2); // musgo
    // 7 a 10: chãos das cidades (scenery.js)
    drawCityTiles(g);
  });
  // Frames individuais ('tiles', 0..N) para usar os blocos como imagens soltas.
  const tilesTex = scene.textures.get('tiles');
  for (let i = 0; i < TILE_COUNT; i++) tilesTex.add(i, 0, i * TILE, 0, TILE, TILE);

  // --- Jogador: Brunucho (olhando para a direita), uma textura por roupa ---
  // (um quadro por pose: player_praia, player_praia_walk1, player_praia_walk2, player_praia_jump)
  for (const [key, outfit] of Object.entries(OUTFITS)) {
    for (const pose of POSE_KEYS) {
      make(`player_${key}${pose === 'idle' ? '' : '_' + pose}`, 26, 36, (g) => drawPlayer(g, outfit, pose));
    }
  }

  // --- Inimigo (geleca, olhando para a esquerda) ---
  make('slime', 28, 20, (g) => {
    g.fillStyle(0x6a2c91); g.fillRoundedRect(0, 2, 28, 18, { tl: 12, tr: 12, bl: 4, br: 4 });
    g.fillStyle(0x9b4dca); g.fillRoundedRect(0, 0, 28, 17, { tl: 12, tr: 12, bl: 4, br: 4 });
    g.fillStyle(0xc58af0); g.fillCircle(20, 5, 2.5);
    g.fillStyle(0xffffff); g.fillCircle(7, 9, 4); g.fillCircle(15, 9, 4);
    g.fillStyle(0x1b1b2a); g.fillCircle(6, 9.5, 2); g.fillCircle(14, 9.5, 2);
  });

  // ================= INIMIGOS MEME (todos olhando para a esquerda) =================

  // --- Vira-lata Caramelo (com coleira de "funcionário público") ---
  make('caramelo', 36, 26, (g) => {
    const C = 0xd9963f, CD = 0xb57628, CL = 0xf2c27e;
    g.fillStyle(CD); g.fillRect(9, 18, 4, 8); g.fillRect(27, 18, 4, 8);      // patas de trás
    g.fillStyle(C); g.fillRoundedRect(8, 9, 24, 12, 5);                          // corpo
    g.fillStyle(CL); g.fillRect(12, 17, 16, 3);                                  // barriga
    g.fillStyle(C); g.fillRect(6, 18, 4, 8); g.fillRect(23, 18, 4, 8);           // patas da frente
    g.fillStyle(C); g.fillTriangle(30, 11, 36, 2, 33, 13);                       // rabo pra cima
    g.fillStyle(C); g.fillRoundedRect(0, 2, 15, 13, 5);                          // cabeça
    g.fillStyle(CL); g.fillRoundedRect(0, 8, 7, 6, 2);                           // focinho
    g.fillStyle(0x1b1b2a); g.fillRect(0, 8, 3, 3);                               // nariz
    g.fillStyle(CD); g.fillTriangle(8, 2, 14, 2, 13, 10);                        // orelha caída
    g.fillStyle(0x1b1b2a); g.fillRect(5, 5, 2, 3);                               // olho
    g.fillStyle(0xff7a8a); g.fillRect(3, 13, 3, 3);                              // linguinha
    g.fillStyle(0x2b6cd4); g.fillRect(10, 11, 4, 5);                             // coleira
    g.fillStyle(0xffd23f); g.fillRect(10, 15, 3, 3);                             // plaquinha
  });

  // --- Capivara com laranja na cabeça ---
  make('capivara', 38, 28, (g) => {
    const B = 0x8a6142, BD = 0x6b4a30, BL = 0xa57a55;
    g.fillStyle(BD); g.fillRect(8, 22, 5, 6); g.fillRect(28, 22, 5, 6);
    g.fillStyle(B); g.fillRoundedRect(6, 9, 32, 16, 7);                          // corpão
    g.fillStyle(BL); g.fillRect(12, 11, 18, 3);
    g.fillStyle(B); g.fillRect(4, 22, 5, 6); g.fillRect(22, 22, 5, 6);
    g.fillStyle(B); g.fillRoundedRect(0, 8, 16, 13, 4);                          // cabeça quadradona
    g.fillStyle(BD); g.fillRoundedRect(0, 13, 7, 8, 3);                          // focinho
    g.fillStyle(0x1b1b2a); g.fillRect(1, 14, 2, 2); g.fillRect(7, 11, 2, 2);     // narina e olho (sereno)
    g.fillStyle(BD); g.fillRect(11, 6, 4, 4);                                    // orelhinha
    g.fillStyle(0xff9a1f); g.fillCircle(7, 4, 4.5);                              // laranja!
    g.fillStyle(0x3fa34d); g.fillRect(7, 0, 3, 2);
  });

  // --- Tralalero Tralala (tubarão de tênis) ---
  make('tralalero', 38, 32, (g) => {
    g.fillStyle(0x4f86c6); g.fillTriangle(20, 2, 28, 12, 16, 12);                // barbatana
    g.fillStyle(0x4f86c6); g.fillTriangle(30, 12, 38, 4, 36, 18);                // rabo
    g.fillStyle(0x5d97d6); g.fillEllipse(18, 15, 34, 15);                        // corpo
    g.fillStyle(0xf2f2f2); g.fillEllipse(15, 18, 24, 7);                         // barriga
    g.fillStyle(0xffffff); g.fillTriangle(3, 17, 5, 20, 7, 17); g.fillTriangle(7, 17, 9, 20, 11, 17); // dentes
    g.fillStyle(0x1b1b2a); g.fillRect(6, 11, 3, 3);
    // três perninhas de tênis azul
    [9, 17, 25].forEach((x) => {
      g.fillStyle(0x5d97d6); g.fillRect(x, 21, 3, 6);
      g.fillStyle(0x2b4fd4); g.fillRect(x - 2, 27, 7, 4);
      g.fillStyle(0xffffff); g.fillRect(x - 2, 30, 7, 2); g.fillRect(x, 28, 3, 1);
    });
  });

  // --- Tung Tung Tung Sahur (tronco com taco) ---
  make('tungtung', 30, 36, (g) => {
    g.fillStyle(0xc89a5e); g.fillRoundedRect(8, 0, 16, 30, 6);                   // tronco
    g.fillStyle(0xa87c44); g.fillRect(10, 20, 12, 2); g.fillRect(12, 26, 8, 1);  // veios da madeira
    g.fillStyle(0xffffff); g.fillCircle(12, 9, 3.5); g.fillCircle(20, 9, 3.5);   // olhos arregalados
    g.fillStyle(0x1b1b2a); g.fillCircle(11.5, 9.5, 1.8); g.fillCircle(19.5, 9.5, 1.8);
    g.fillStyle(0x6b3a2a); g.fillRect(12, 15, 8, 3);                             // boca
    g.fillStyle(0xa87c44); g.fillRect(10, 30, 4, 6); g.fillRect(18, 30, 4, 6);   // pernas
    g.fillStyle(0xc89a5e); g.fillRect(4, 16, 5, 3);                              // braço
    g.fillStyle(0x7a4a24); g.fillRect(0, 2, 4, 18);                              // taco de beisebol
    g.fillRect(-1, 0, 6, 8);
  });

  // ================= FAMOSOS (olhando para a direita, como o Brunucho) =================
  const LOOKS = {
    neymar: { w: 26, look: {
      skin: 0xe0ad84, skinDark: 0xc79170, hair: 0x2a1d14, hairTop: 0xf0d36a,
      shirt: 0xffd23f, shirtDark: 0x2e9d4a, pants: 0x2b4fd4, number: true, shoes: 0xffffff } },
    galvao: { w: 26, look: {
      skin: 0xf1c7a6, skinDark: 0xd9a988, hair: 0xe8e8e8, hairDark: 0xbdbdbd,
      shirt: 0x1f2a44, shirtDark: 0x141b2e, pants: 0x1f2a44, tie: 0xd62828, headset: true, shoes: 0x2b2b2b } },
    caze: { w: 30, look: {
      skin: 0xe8b996, skinDark: 0xcf9d7a, hair: 0x2a1d14, beard: true, wide: true,
      shirt: 0x1b1b22, shirtDark: 0x0f0f14, pants: 0x3a4a6a, headphones: true, shoes: 0xffffff } },
    ednaldo: { w: 26, look: {
      skin: 0x7a4a2c, skinDark: 0x5e3820, hair: 0x1b1410,
      shirt: 0xe8e8e8, shirtDark: 0xbdbdbd, jacket: 0x6a2c91, pants: 0x2b2b2b, shoes: 0x2b2b2b } },
  };
  // Chefões finais
  LOOKS.lula = { w: 30, look: {
    skin: 0xf0c4a0, skinDark: 0xd6a582, hair: 0xe6e6e6, hairDark: 0xc4c4c4, beard: true, wide: true,
    shirt: 0xffffff, shirtDark: 0xdddddd, jacket: 0x2b2b33, tie: 0xd62828, pants: 0x2b2b33, shoes: 0x1b1b1b } };
  LOOKS.flavio = { w: 26, look: {
    skin: 0xf1c7a6, skinDark: 0xd9a988, hair: 0x2a1d14,
    shirt: 0xffffff, shirtDark: 0xdddddd, jacket: 0x1f2a44, tie: 0x1f9d55, pants: 0x1f2a44, shoes: 0x1b1b1b } };
  for (const [key, { w, look }] of Object.entries(LOOKS)) {
    for (const pose of POSE_KEYS) {
      make(`${key}${pose === 'idle' ? '' : '_' + pose}`, w, 36, (g) => drawPerson(g, look, pose));
    }
  }

  // "Balão de fala" do Galvão vira projétil
  make('gol_ball', 16, 16, (g) => {
    g.fillStyle(0xffffff); g.fillCircle(8, 8, 8);
    g.fillStyle(0x1b1b2a); g.fillCircle(8, 8, 3);
    [[2, 3], [13, 4], [3, 12], [12, 13]].forEach(([x, y]) => g.fillCircle(x, y, 2));
  });

  // ================= ITENS NOVOS =================
  // Coxinha: +1 vida
  make('coxinha', 22, 26, (g) => {
    g.fillStyle(0xb8661f); g.fillTriangle(11, 0, 22, 22, 0, 22); g.fillEllipse(11, 20, 22, 12);
    g.fillStyle(0xe08a2e); g.fillTriangle(11, 2, 19, 20, 3, 20); g.fillEllipse(11, 19, 18, 9);
    g.fillStyle(0xf5b65a); g.fillRect(7, 10, 3, 6); g.fillRect(12, 14, 2, 3);
  });
  // Tênis de Mola: pulo duplo
  make('tenis', 30, 22, (g) => {
    g.fillStyle(0xffd23f); g.fillRect(6, 16, 3, 6); g.fillRect(20, 16, 3, 6); // molas
    g.fillStyle(0xe8a800); g.fillRect(5, 18, 5, 1); g.fillRect(19, 18, 5, 1);
    g.fillStyle(0xff3df2); g.fillRoundedRect(2, 4, 26, 12, 5);
    g.fillStyle(0xffffff); g.fillRect(2, 13, 26, 3); g.fillRect(8, 7, 2, 1); g.fillRect(12, 7, 2, 1); g.fillRect(16, 7, 2, 1);
    g.fillStyle(0x7ff6ff); g.fillTriangle(18, 6, 26, 8, 18, 11);
  });
  // Ímã de Aura: puxa moedas
  make('ima', 26, 26, (g) => {
    g.fillStyle(0xd62828); g.fillRect(2, 2, 22, 8); g.fillRect(2, 2, 8, 18); g.fillRect(16, 2, 8, 18);
    g.fillStyle(0xff6b6b); g.fillRect(4, 4, 18, 2);
    g.fillStyle(0xdfe4ee); g.fillRect(2, 20, 8, 5); g.fillRect(16, 20, 8, 5);
  });
  // ================= MAIS MEMES (brainrot) — olhando para a esquerda =================
  // Bombardiro Crocodilo: crocodilo-avião
  const bombardiro = (key, propUp) => make(key, 44, 26, (g) => {
    g.fillStyle(0x8a94a6); g.fillRect(14, 2, 18, 5);                       // asa de cima
    g.fillStyle(0x6a748a); g.fillRect(14, 6, 18, 2);
    g.fillStyle(0x4f8a3c); g.fillEllipse(24, 14, 30, 13);                  // corpo
    g.fillStyle(0x6fae52); g.fillEllipse(22, 12, 24, 6);
    g.fillStyle(0x4f8a3c); g.fillRoundedRect(0, 11, 16, 7, 3);             // focinho comprido
    g.fillStyle(0xffffff); [2, 6, 10].forEach((x) => g.fillTriangle(x, 18, x + 2, 21, x + 4, 18)); // dentes
    g.fillStyle(0xffd23f); g.fillCircle(16, 9, 3); g.fillStyle(0x1b1b2a); g.fillRect(15, 8, 2, 3);  // olho
    g.fillStyle(0x4f8a3c); g.fillTriangle(36, 12, 44, 6, 42, 16);           // rabo
    g.fillStyle(0x8a94a6); g.fillRect(22, 18, 14, 4);                      // asa de baixo
    g.fillStyle(0x333333); g.fillRect(28, 21, 3, 5);                       // bomba pendurada
    g.fillStyle(0x9aa0a8); g.fillRect(41, propUp ? 2 : 14, 2, 10);         // hélice
  });
  bombardiro('bombardiro', true);
  bombardiro('bombardiro_2', false);
  make('bomba', 14, 16, (g) => {
    g.fillStyle(0x2b2b33); g.fillCircle(7, 9, 7);
    g.fillStyle(0x55555f); g.fillCircle(5, 7, 2);
    g.fillStyle(0x8a6a3a); g.fillRect(6, 0, 2, 3);
    g.fillStyle(0xffb000); g.fillRect(5, 0, 4, 1);
  });
  // Brr Brr Patapim: tronco de árvore com cara de macaco e pezões
  make('patapim', 30, 36, (g) => {
    g.fillStyle(0x3f8a3c); g.fillCircle(9, 6, 6); g.fillCircle(20, 5, 7); g.fillCircle(15, 3, 5);   // folhas
    g.fillStyle(0x8a5a2b); g.fillRoundedRect(5, 8, 20, 20, 5);              // tronco
    g.fillStyle(0x6e4521); g.fillRect(8, 22, 14, 2);
    g.fillStyle(0xd9a77a); g.fillEllipse(13, 16, 14, 10);                   // cara
    g.fillStyle(0x1b1b2a); g.fillRect(8, 13, 2, 3); g.fillRect(15, 13, 2, 3);
    g.fillStyle(0x7a4a2c); g.fillEllipse(11, 19, 7, 4);                     // nariz grandão
    g.fillStyle(0x3f8a3c); g.fillRect(9, 23, 10, 3);                        // bigode de folha
    g.fillStyle(0xd9a77a); g.fillRoundedRect(1, 29, 12, 7, 3); g.fillRoundedRect(16, 29, 12, 7, 3); // pezões
    g.fillStyle(0xb8835a); [2, 5, 8, 17, 20, 23].forEach((x) => g.fillRect(x, 29, 2, 2));
  });
  // Chimpanzini Bananini: macaco dentro de uma banana
  make('bananini', 26, 34, (g) => {
    g.fillStyle(0xe8c22a); g.fillRoundedRect(4, 12, 18, 20, 8);             // banana
    g.fillStyle(0xffe066); g.fillRect(7, 14, 4, 15);
    g.fillStyle(0x6b4a1a); g.fillRect(11, 31, 4, 3);
    g.fillStyle(0xe8c22a); g.fillTriangle(4, 14, 0, 6, 9, 13); g.fillTriangle(22, 14, 26, 6, 17, 13);  // casca aberta
    g.fillStyle(0x6b4a2c); g.fillCircle(13, 9, 8);                           // cabeça do macaco
    g.fillStyle(0xd9a77a); g.fillEllipse(12, 11, 10, 8);
    g.fillStyle(0x6b4a2c); g.fillCircle(4, 8, 3); g.fillCircle(22, 8, 3);    // orelhas
    g.fillStyle(0x1b1b2a); g.fillRect(8, 8, 2, 2); g.fillRect(14, 8, 2, 2); g.fillRect(10, 13, 4, 1);
  });
  // Lirilì Larilà: elefante-cacto de sandália (aguenta 2 pisões)
  make('lirili', 36, 30, (g) => {
    g.fillStyle(0x3f9a4a); g.fillRoundedRect(8, 6, 26, 18, 8);              // corpo de cacto
    g.fillStyle(0x5cbf66); g.fillRect(12, 9, 3, 12); g.fillRect(20, 8, 3, 13); g.fillRect(28, 9, 3, 12);
    g.fillStyle(0xfff3c0); [[10, 7], [18, 6], [26, 7], [32, 12], [14, 22], [24, 22]].forEach(([x, y]) => g.fillRect(x, y, 1, 3)); // espinhos
    g.fillStyle(0x3f9a4a); g.fillRoundedRect(0, 8, 12, 12, 5);              // cabeça
    g.fillStyle(0x3f9a4a); g.fillRect(0, 16, 4, 9);                         // tromba
    g.fillStyle(0x5cbf66); g.fillEllipse(10, 10, 7, 10);                    // orelha
    g.fillStyle(0x1b1b2a); g.fillRect(4, 11, 2, 2);
    g.fillStyle(0x3f9a4a); [10, 16, 24, 30].forEach((x) => g.fillRect(x, 23, 4, 4));   // patas
    g.fillStyle(0x8a5a2b); [9, 15, 23, 29].forEach((x) => g.fillRect(x, 27, 6, 3));    // sandálias
  });
  make('lirili_hit', 36, 30, (g) => {
    g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(8, 6, 26, 18, 8); g.fillRoundedRect(0, 8, 12, 12, 5);
  });
  // Ballerina Cappuccina: cabeça de xícara de cappuccino e saia de bailarina
  make('ballerina', 26, 38, (g) => {
    g.fillStyle(0xffffff); g.fillRoundedRect(4, 2, 18, 14, 4);              // xícara
    g.fillStyle(0xc89a6a); g.fillEllipse(13, 3, 16, 5);                     // espuma
    g.fillStyle(0xf5e6d0); g.fillCircle(10, 3, 2); g.fillCircle(15, 2, 2);
    g.fillStyle(0xffffff); g.fillRect(21, 6, 4, 2); g.fillRect(23, 6, 2, 6); g.fillRect(21, 10, 4, 2); // alça
    g.fillStyle(0x1b1b2a); g.fillRect(8, 8, 2, 2); g.fillRect(14, 8, 2, 2);
    g.fillStyle(0xff8a9a); g.fillRect(9, 12, 6, 1);
    g.fillStyle(0xf2c6a0); g.fillRect(11, 16, 4, 4);                         // pescoço
    g.fillStyle(0xff8ab3); g.fillRoundedRect(8, 19, 10, 6, 2);               // collant
    g.fillStyle(0xffc2d9); g.fillEllipse(13, 26, 26, 7);                     // saia de tule
    g.fillStyle(0xff8ab3); g.fillEllipse(13, 25, 20, 4);
    g.fillStyle(0xf2c6a0); g.fillRect(10, 28, 2, 8); g.fillRect(14, 28, 2, 6); // pernas (uma na ponta)
    g.fillStyle(0xff8ab3); g.fillRect(9, 35, 4, 3); g.fillRect(14, 33, 4, 2);
    g.fillStyle(0xf2c6a0); g.fillRect(2, 18, 6, 2); g.fillRect(18, 16, 6, 2); // braços abertos
  });

  // ================= ELEMENTOS DE FASE =================
  // Plataforma que se move (prancha com hélices nas pontas)
  make('plataforma', 96, 18, (g) => {
    g.fillStyle(0x7a4f2a); g.fillRoundedRect(0, 4, 96, 12, 4);
    g.fillStyle(0xc4935c); g.fillRoundedRect(0, 2, 96, 10, 4);
    g.fillStyle(0xe0b27a); g.fillRect(4, 2, 88, 2);
    g.fillStyle(0x7a4f2a); [24, 48, 72].forEach((x) => g.fillRect(x, 3, 2, 8));
    g.fillStyle(0xffd23f); g.fillCircle(6, 14, 4); g.fillCircle(90, 14, 4);
  });
  // Trampolim (normal e apertado)
  const mola = (key, h) => make(key, 32, 22, (g) => {
    g.fillStyle(0x9aa0a8); for (let i = 0; i < 3; i++) g.fillRect(8, 22 - h + 4 + i * ((h - 8) / 3), 16, 2);
    g.fillStyle(0x5c6370); g.fillRect(2, 19, 28, 3);
    g.fillStyle(0xd62828); g.fillRoundedRect(0, 22 - h, 32, 6, 3);
    g.fillStyle(0xff6b6b); g.fillRect(3, 22 - h, 26, 2);
  });
  mola('mola', 20);
  mola('mola_on', 11);
  // Pombo (voa em zigue-zague) — dois quadros de asa
  const pombo = (key, wingUp) => make(key, 30, 22, (g) => {
    g.fillStyle(0x8a94a6); g.fillEllipse(16, 13, 22, 12);                 // corpo
    g.fillStyle(0x6a748a); g.fillTriangle(24, 12, 30, 9, 30, 16);          // rabo
    g.fillStyle(0x4f8a7a); g.fillEllipse(8, 10, 9, 7);                     // pescoço furta-cor
    g.fillStyle(0x8a94a6); g.fillCircle(6, 7, 5);                          // cabeça
    g.fillStyle(0xff8a3d); g.fillCircle(4, 6, 1.6);                        // olho laranja
    g.fillStyle(0x1b1b2a); g.fillCircle(4, 6, 0.8);
    g.fillStyle(0xe8b04a); g.fillTriangle(0, 8, 3, 7, 3, 9);               // bico
    g.fillStyle(0x6a748a);
    if (wingUp) g.fillTriangle(12, 10, 24, 10, 18, 0);
    else g.fillTriangle(12, 12, 24, 12, 18, 21);
    g.fillStyle(0xd0d6e0); g.fillRect(16, 9, 6, 1);
  });
  pombo('pombo', true);
  pombo('pombo_2', false);

  // Projéteis dos chefões
  make('picanha', 22, 14, (g) => {
    g.fillStyle(0x8e2a1e); g.fillEllipse(11, 8, 22, 12);
    g.fillStyle(0xb8432f); g.fillEllipse(11, 9, 18, 8);
    g.fillStyle(0xfff3e0); g.fillEllipse(11, 3, 20, 5);   // gordurinha
    g.fillStyle(0x5a1a12); g.fillRect(6, 8, 10, 1);       // marca da grelha
  });
  make('ovo', 12, 15, (g) => {
    g.fillStyle(0xf3ead8); g.fillEllipse(6, 8, 12, 15);
    g.fillStyle(0xffffff); g.fillEllipse(4, 5, 4, 5);
  });

  // Coração (vidas no HUD)
  make('heart', 18, 16, (g) => {
    g.fillStyle(0xff3b5c); g.fillCircle(5, 5, 5); g.fillCircle(13, 5, 5); g.fillTriangle(0, 7, 18, 7, 9, 16);
    g.fillStyle(0xff9aae); g.fillCircle(4, 4, 2);
  });

  // ================= INTRO: a mãe e o chinelo =================
  // Andreia (a mãe), baseada na foto: cabelo castanho-claro com luzes na altura dos ombros,
  // óculos escuros, roupa vermelha e tatuagenzinha no tornozelo. E o chinelo, claro.
  make('mae', 28, 40, (g) => {
    const SKIN = 0xf2c6a0, SKIN_D = 0xd9a882, HAIR = 0xa47b52, HAIR_D = 0x7a5636, HAIR_L = 0xd4ad7c;
    const RED = 0xc8202a, RED_D = 0x9a1520, RED_L = 0xe84a50;
    // cabelo de trás (solto até o ombro)
    g.fillStyle(HAIR_D); g.fillRoundedRect(5, 3, 19, 17, 4);
    // braço de trás (sem manga)
    g.fillStyle(SKIN_D); g.fillRect(3, 18, 5, 10);
    // pernas, chinelos e a tatuagem no tornozelo
    g.fillStyle(SKIN); g.fillRect(8, 31, 4, 6); g.fillRect(16, 31, 4, 6);
    g.fillStyle(0x3fb8a8); g.fillRect(17, 35, 2, 1);
    g.fillStyle(0xffffff); g.fillRect(7, 37, 6, 2); g.fillRect(15, 37, 7, 2);
    g.fillStyle(0xdddddd); g.fillRect(7, 39, 6, 1); g.fillRect(15, 39, 7, 1);
    // vestido vermelho
    g.fillStyle(RED); g.fillRoundedRect(5, 17, 18, 15, 3);
    g.fillStyle(RED_D); g.fillRect(5, 29, 18, 3); g.fillRect(13, 20, 2, 9);       // franzido
    g.fillStyle(RED_L); g.fillRect(7, 19, 3, 6);
    g.fillStyle(SKIN); g.fillTriangle(11, 17, 17, 17, 14, 21);                    // decote em V
    // braço da frente segurando o chinelo
    g.fillStyle(SKIN); g.fillRect(20, 12, 4, 9);
    g.fillStyle(0x2b6cd4); g.fillRoundedRect(20, 2, 7, 11, 3);                    // chinelo levantado
    g.fillStyle(0xffffff); g.fillRect(22, 6, 3, 1);
    // cabeça
    g.fillStyle(SKIN); g.fillRoundedRect(7, 4, 16, 14, 4);
    g.fillStyle(0x1b1b2a); g.fillRect(15, 10, 2, 3); g.fillRect(20, 10, 2, 3);
    g.fillStyle(HAIR_D); g.fillRect(14, 8, 4, 1); g.fillRect(19, 8, 3, 1);       // sobrancelha brava
    g.fillStyle(0xb5334a); g.fillRect(16, 15, 5, 1);
    g.fillStyle(0xff8a8a, 0.5); g.fillRect(12, 13, 3, 2);
    // franja e mechas claras
    g.fillStyle(HAIR); g.fillRoundedRect(6, 1, 18, 7, 3); g.fillRect(5, 4, 4, 15);
    g.fillStyle(HAIR_L); g.fillRect(10, 2, 3, 3); g.fillRect(16, 2, 4, 2); g.fillRect(6, 9, 2, 8);
    // óculos escuros apoiados na cabeça
    g.fillStyle(0x1b1b2a); g.fillRect(9, 2, 15, 2); g.fillRoundedRect(12, 1, 5, 3, 1); g.fillRoundedRect(19, 1, 5, 3, 1);
    g.fillStyle(0x5a7a9a); g.fillRect(13, 1, 2, 1); g.fillRect(20, 1, 2, 1);
  });
  make('chinelo', 16, 8, (g) => {
    g.fillStyle(0x2b6cd4); g.fillRoundedRect(0, 0, 16, 8, 4);
    g.fillStyle(0xffffff); g.fillRect(5, 2, 1, 4); g.fillRect(5, 3, 6, 1);
  });

  // ================= PODERES =================

  // --- 67: modo six seven ---
  const pw = scene.textures.createCanvas('pw67', 34, 34);
  const ctx = pw.getContext();
  const grad = ctx.createRadialGradient(17, 17, 2, 17, 17, 17);
  grad.addColorStop(0, '#fff6a0'); grad.addColorStop(0.6, '#ffb000'); grad.addColorStop(1, '#ff5e00');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(17, 17, 16, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.font = 'bold 17px Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = '#7a2a00'; ctx.strokeText('67', 17, 18);
  ctx.fillStyle = '#ffffff'; ctx.fillText('67', 17, 18);
  pw.refresh();

  // --- Aura: orbe brilhante ---
  make('aura', 30, 30, (g) => {
    g.fillStyle(0x7c4dff, 0.25); g.fillCircle(15, 15, 15);
    g.fillStyle(0x9f7bff, 0.5); g.fillCircle(15, 15, 11);
    g.fillStyle(0x7ff6ff); g.fillCircle(15, 15, 7);
    g.fillStyle(0xffffff); g.fillCircle(13, 13, 3);
    g.fillStyle(0xffffff, 0.9); g.fillRect(14, 1, 2, 6); g.fillRect(14, 23, 2, 6); g.fillRect(1, 14, 6, 2); g.fillRect(23, 14, 6, 2);
  });

  // --- Caranguejo (inimigo extra, não usado por padrão) ---
  make('crab', 32, 22, (g) => {
    // patinhas
    g.fillStyle(0xb8321f);
    [4, 9, 20, 25].forEach((x) => g.fillRect(x, 16, 3, 6));
    // garras
    g.fillCircle(4, 9, 4); g.fillCircle(28, 9, 4);
    g.fillStyle(0xf2f2f2); g.fillRect(0, 7, 3, 2); g.fillRect(29, 7, 3, 2);
    // corpo
    g.fillStyle(0xb8321f); g.fillEllipse(16, 15, 22, 13);
    g.fillStyle(0xe84a2f); g.fillEllipse(16, 13, 22, 11);
    g.fillStyle(0xff7a5c); g.fillRect(11, 10, 6, 2);
    // olhinhos nas antenas
    g.fillStyle(0xb8321f); g.fillRect(11, 4, 2, 6); g.fillRect(19, 4, 2, 6);
    g.fillStyle(0xffffff); g.fillCircle(12, 4, 3); g.fillCircle(20, 4, 3);
    g.fillStyle(0x1b1b2a); g.fillCircle(12, 4, 1.5); g.fillCircle(20, 4, 1.5);
  });

  // --- Ouriço-do-mar (o "espinho" da praia) ---
  make('urchin', TILE, TILE, (g) => {
    g.lineStyle(2, 0x2a1d3a);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      g.lineBetween(16, 24, 16 + Math.cos(a) * 14, 24 + Math.sin(a) * 12);
    }
    g.fillStyle(0x3d2a55); g.fillEllipse(16, 25, 18, 13);
    g.fillStyle(0x6a4c8c); g.fillEllipse(13, 22, 6, 4);
  });

  // --- Coqueiro (decoração) ---
  make('palm', 96, 160, (g) => {
    // tronco curvado
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      g.fillStyle(i % 2 ? 0x8a6238 : 0xa37848);
      g.fillRect(44 + Math.sin(t * 1.6) * 10, 150 - i * 10, 10, 11);
    }
    // folhas
    g.fillStyle(0x2e8b3e);
    const cx = 54, cy = 26;
    [[-46, 6], [-36, -16], [-12, -24], [14, -22], [38, -10], [44, 12]].forEach(([dx, dy]) => {
      g.fillTriangle(cx, cy - 4, cx + dx, cy + dy, cx, cy + 6);
    });
    g.fillStyle(0x45b356);
    [[-40, 0], [-24, -18], [26, -16], [40, 4]].forEach(([dx, dy]) => g.fillTriangle(cx, cy - 2, cx + dx, cy + dy, cx, cy + 3));
    // cocos
    g.fillStyle(0x6b4a2a); g.fillCircle(50, 32, 5); g.fillCircle(59, 33, 5);
  });

  // --- Mar (fundo da praia): água com espuma no topo, repete sem emenda ---
  make('sea', 480, 200, (g) => {
    g.fillStyle(0x1f7fb8); g.fillRect(0, 30, 480, 170);
    g.fillStyle(0x2fa3c9); g.fillRect(0, 30, 480, 50);
    g.fillStyle(0x52c3d6); g.fillRect(0, 30, 480, 14);
    g.fillStyle(0xffffff, 0.8);
    for (let x = 0; x < 480; x += 60) g.fillEllipse(x + 30, 31, 44, 6);
    g.fillStyle(0xffffff, 0.35);
    for (let x = 0; x < 480; x += 80) { g.fillRect(x + 10, 70, 30, 2); g.fillRect(x + 50, 110, 22, 2); g.fillRect(x + 25, 150, 26, 2); }
  });

  // --- Espinhos ---
  make('spike', TILE, TILE, (g) => {
    g.fillStyle(0x9aa3b5);
    g.fillTriangle(0, 32, 8, 14, 16, 32); g.fillTriangle(16, 32, 24, 14, 32, 32);
    g.fillStyle(0xdfe4ee);
    g.fillTriangle(4, 32, 8, 14, 9, 32); g.fillTriangle(20, 32, 24, 14, 25, 32);
  });

  // --- Moeda ---
  make('coin', 20, 20, (g) => {
    g.fillStyle(0xe0a800); g.fillCircle(10, 10, 10);
    g.fillStyle(0xffd23f); g.fillCircle(10, 10, 8);
    g.fillStyle(0xfff0a0); g.fillRect(8, 4, 3, 12);
  });

  // --- Bandeira final ---
  make('goal', 36, 72, (g) => {
    g.fillStyle(0xe8e8e8); g.fillRect(4, 4, 4, 68);
    g.fillStyle(0xffd23f); g.fillCircle(6, 4, 4);
    g.fillStyle(0x2ecc71); g.fillTriangle(8, 8, 36, 18, 8, 30);
    g.fillStyle(0x3b2a20); g.fillRect(0, 68, 12, 4);
  });

  // --- Checkpoint (desligado / ligado) ---
  const checkpoint = (key, color) => make(key, 24, 48, (g) => {
    g.fillStyle(0xcfcfcf); g.fillRect(3, 2, 3, 46);
    g.fillStyle(color); g.fillTriangle(6, 4, 24, 11, 6, 18);
    g.fillStyle(0x3b2a20); g.fillRect(0, 44, 10, 4);
  });
  checkpoint('cp_off', 0x8a8a8a);
  checkpoint('cp_on', 0x34d1ff);

  // --- Partícula ---
  make('px', 6, 6, (g) => { g.fillStyle(0xffffff); g.fillRect(0, 0, 6, 6); });

  // --- Fundo: morros (brancos, recebem cor via tint) e nuvens. Larguras repetem sem emenda. ---
  const hills = (key, base, a1, k1, a2, k2) => make(key, 480, 200, (g) => {
    g.fillStyle(0xffffff);
    g.beginPath(); g.moveTo(0, 200);
    for (let x = 0; x <= 480; x += 4) {
      const t = (x / 480) * Math.PI * 2;
      g.lineTo(x, base - a1 * Math.sin(t * k1) - a2 * Math.sin(t * k2 + 1));
    }
    g.lineTo(480, 200); g.closePath(); g.fillPath();
  });
  hills('hills', 90, 40, 1, 20, 3);
  hills('hills2', 110, 30, 2, 12, 5);

  make('clouds', 480, 200, (g) => {
    g.fillStyle(0xffffff);
    const cloud = (x, y, s) => {
      g.fillEllipse(x, y, 70 * s, 30 * s);
      g.fillEllipse(x - 25 * s, y + 6 * s, 50 * s, 24 * s);
      g.fillEllipse(x + 28 * s, y + 6 * s, 54 * s, 24 * s);
    };
    cloud(80, 40, 1.1); cloud(300, 90, 0.8); cloud(410, 30, 0.6);
  });

  g.destroy();
  generateScenery(scene);
}

// Bonequinho genérico de famoso, no mesmo estilo do Brunucho (olhando para a direita).
function drawPerson(g, o, pose = 'idle') {
  const w = o.wide ? 4 : 0; // corpo mais largo
  const P = POSES[pose];
  // braço de trás
  g.fillStyle(o.jacket ? o.jacket : o.shirtDark); g.fillRect(2, 18 - P.arm, 5 + w / 2, 7);
  g.fillStyle(o.skinDark); g.fillRect(2, 25 - P.arm, 4, 3);
  // pernas e sapatos
  g.fillStyle(o.pants); g.fillRect(6 + P.a[0], 25, 6 + w / 2, 8 + P.a[1]); g.fillRect(14 + w / 2 + P.b[0], 25, 6 + w / 2, 8 + P.b[1]);
  g.fillStyle(o.shoes); g.fillRect(5 + P.a[0], 32 + P.a[1], 8, 4); g.fillRect(14 + w / 2 + P.b[0], 32 + P.b[1], 9, 4);
  // tronco
  g.fillStyle(o.shirt); g.fillRoundedRect(4, 16, 18 + w, 11, 3);
  if (o.jacket) { g.fillStyle(o.jacket); g.fillRect(4, 16, 6, 11); g.fillRect(16 + w, 16, 6, 11); }
  if (o.tie) { g.fillStyle(o.tie); g.fillRect(12, 17, 3, 8); }
  if (o.number) {
    g.fillStyle(o.shirtDark); g.fillRect(4, 16, 18, 2);           // gola verde
    g.fillStyle(0x2b4fd4); g.fillRect(13, 19, 1, 5); g.fillRect(15, 19, 3, 1); g.fillRect(15, 23, 3, 1); g.fillRect(15, 19, 1, 5); g.fillRect(17, 19, 1, 5); // "10"
  }
  // braço da frente
  g.fillStyle(o.jacket ? o.jacket : o.shirt); g.fillRect(19 + w, 17 + P.arm, 5, 7);
  g.fillStyle(o.skin); g.fillRect(20 + w, 24 + P.arm, 4, 3);
  // cabeça
  g.fillStyle(o.skin); g.fillRoundedRect(5, 3, 18 + w / 2, 14, 4);
  g.fillStyle(o.skinDark); g.fillRect(8, 9, 2, 3);
  g.fillStyle(0x1b1b2a); g.fillRect(15 + w / 2, 9, 2, 3); g.fillRect(20 + w / 2, 9, 2, 3);
  g.fillStyle(0x8a3a2a); g.fillRect(17 + w / 2, 14, 4, 1);
  if (o.beard) { g.fillStyle(o.hair); g.fillRect(9, 13, 14 + w / 2, 4); g.fillStyle(0x8a3a2a); g.fillRect(17 + w / 2, 14, 4, 1); }
  // cabelo
  g.fillStyle(o.hair); g.fillRoundedRect(4, 0, 19 + w / 2, 6, 3); g.fillRect(4, 4, 4, 7);
  if (o.hairTop) { g.fillStyle(o.hairTop); g.fillRoundedRect(9, -1, 12, 5, 2); } // topo descolorido
  if (o.hairDark) { g.fillStyle(o.hairDark); g.fillRect(6, 4, 14, 1); }
  // fone de narrador / headphone de streamer
  if (o.headset) {
    g.fillStyle(0x2b2b2b); g.fillRect(6, 1, 3, 12); g.fillRect(7, 11, 4, 3);
    g.fillRect(10, 14, 8, 1); g.fillStyle(0x555555); g.fillRect(17, 13, 3, 3); // microfone
  }
  if (o.headphones) {
    g.fillStyle(0xd62828); g.fillRect(5, -1, 20, 3); g.fillRect(4, 7, 5, 7); g.fillRect(23, 7, 4, 7);
  }
}

// Poses da animação: deslocamento da perna de trás (a), da frente (b) e dos braços
const POSES = {
  idle:  { a: [0, 0],   b: [0, 0],   arm: 0 },
  walk1: { a: [-2, 0],  b: [2, -1],  arm: -1 },
  walk2: { a: [2, -1],  b: [-2, 0],  arm: 1 },
  jump:  { a: [-1, -3], b: [2, -2],  arm: -3 },
};
const POSE_KEYS = Object.keys(POSES);

// Desenha o Brunucho com as cores/acessórios de uma roupa (veja OUTFITS em config.js).
function drawPlayer(g, o, pose = 'idle') {
  const c = o.colors;
  const P = POSES[pose];
  const sleeve = o.longSleeves ? c.shirt : c.skin;
  const sleeveBack = o.longSleeves ? c.shirtDark : c.skinDark;
  const A = (x, y, w, h) => g.fillRect(x + P.a[0], y + P.a[1], w, h);
  const B = (x, y, w, h) => g.fillRect(x + P.b[0], y + P.b[1], w, h);

  // braço de trás
  g.fillStyle(c.shirtDark); g.fillRect(2, 18 - P.arm, 5, 4);
  g.fillStyle(sleeveBack); g.fillRect(2, 22 - P.arm, 5, 3);
  g.fillStyle(c.skinDark); g.fillRect(2, 25 - P.arm, 4, 3);
  // pernas
  g.fillStyle(c.skin); A(7, 30, 4, 4); B(15, 30, 4, 4);
  if (o.shoes === 'chinelo') {
    g.fillStyle(c.skin); A(6, 33, 6, 2); B(15, 33, 7, 2);
    g.fillStyle(0xf5f5f5); A(6, 35, 6, 1); B(14, 35, 8, 1);
    g.fillStyle(0xdddddd); A(9, 33, 1, 2); B(18, 33, 1, 2);
  } else {
    g.fillStyle(0xf5f5f5); A(6, 32, 6, 3); B(14, 32, 8, 3);
    g.fillStyle(0x9a9a9a); A(6, 35, 6, 1); B(14, 35, 8, 1);
  }
  // bermuda
  g.fillStyle(c.shorts); g.fillRect(5, 25, 16, 6);
  g.fillStyle(c.shortsDark); g.fillRect(5, 25, 16, 1); g.fillRect(12, 28, 2, 3);
  if (o.drawstring) { g.fillStyle(0xffffff); g.fillRect(11, 26, 1, 3); g.fillRect(14, 26, 1, 3); }
  // blusa
  g.fillStyle(c.shirt); g.fillRoundedRect(4, 16, 18, 10, 3);
  g.fillStyle(c.shirtDark); g.fillRect(4, 24, 18, 2);
  if (o.chestBadge) {
    g.fillStyle(0xd62828); g.fillRect(14, 19, 5, 3);
    g.fillStyle(0xffffff); g.fillRect(15, 20, 3, 1);
  }
  // braço da frente
  g.fillStyle(c.shirt); g.fillRect(19, 17 + P.arm, 5, 4);
  g.fillStyle(sleeve); g.fillRect(19, 21 + P.arm, 5, 3);
  g.fillStyle(c.skin); g.fillRect(20, 24 + P.arm, 4, 3);
  // cabeça
  g.fillStyle(c.skin); g.fillRoundedRect(5, 3, 18, 14, 4);
  g.fillStyle(c.skinDark); g.fillRect(8, 9, 2, 3); // orelha
  // olhos, sobrancelhas e sorriso
  g.fillStyle(0x1b1b2a); g.fillRect(15, 9, 2, 3); g.fillRect(20, 9, 2, 3);
  g.fillStyle(c.hairDark); g.fillRect(14, 7, 4, 1); g.fillRect(19, 7, 3, 1);
  g.fillStyle(0xb5634a); g.fillRect(17, 14, 4, 1);
  g.fillStyle(0xff8a8a, 0.5); g.fillRect(12, 12, 3, 2);
  // cabelo curto com topete para frente
  g.fillStyle(c.hair);
  g.fillRoundedRect(4, 0, 19, 7, 3);
  g.fillRect(4, 4, 4, 8);
  g.fillTriangle(14, 1, 26, 4, 14, 7);
  g.fillStyle(c.hairDark); g.fillRect(4, 6, 4, 2); g.fillRect(10, 5, 6, 1);
  g.fillStyle(c.hairLight); g.fillRect(9, 1, 8, 2);
  // óculos escuros apoiados na cabeça
  if (o.sunglasses) {
    g.fillStyle(0x1b1b2a); g.fillRect(8, 2, 16, 2);
    g.fillRoundedRect(12, 1, 5, 3, 1); g.fillRoundedRect(19, 1, 5, 3, 1);
    g.fillStyle(0x5a7a9a); g.fillRect(13, 1, 2, 1); g.fillRect(20, 1, 2, 1);
  }
}
