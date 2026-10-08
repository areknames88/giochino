/**
 * Generazione procedurale delle texture per l'inventario e gli oggetti.
 * Fedeltà visiva allo stile rétro / pixel-art della sala prove.
 */

function fillRounded(g, x, y, w, h, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x, y, w, h, r);
}

function strokeRounded(g, x, y, w, h, r, color, width = 1) {
  g.lineStyle(width, color, 1);
  g.strokeRoundedRect(x, y, w, h, r);
}

function fillRect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function fillCircle(g, x, y, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, r);
}

/**
 * Icona Zaino per HUD (40x40)
 */
function drawBackpack(g) {
  const LEATHER_DARK = 0x4a2d15;
  const CANVAS_MAIN = 0x8b5a2b;
  const CANVAS_LIGHT = 0xb0793f;
  const BRASS = 0xc8a94e;
  const STRAP = 0x3a2110;

  // Maniglia superiore
  strokeRounded(g, 15, 3, 10, 8, 3, STRAP, 2);

  // Corpo principale dello zaino
  fillRounded(g, 6, 8, 28, 28, 6, CANVAS_MAIN);
  fillRounded(g, 8, 10, 24, 24, 4, CANVAS_LIGHT);

  // Spallacci visibili ai lati
  fillRect(g, 4, 12, 3, 18, STRAP);
  fillRect(g, 33, 12, 3, 18, STRAP);

  // Pattina superiore (flap)
  fillRounded(g, 7, 8, 26, 13, 4, LEATHER_DARK);

  // Tasca frontale
  fillRounded(g, 9, 21, 22, 13, 3, LEATHER_DARK);
  fillRect(g, 11, 23, 18, 1, 0x1a1109); // cerniera

  // Cinghie e fibbie in ottone
  fillRect(g, 11, 10, 3, 12, STRAP);
  fillRect(g, 26, 10, 3, 12, STRAP);

  fillCircle(g, 12.5, 17, 1.6, BRASS);
  fillCircle(g, 27.5, 17, 1.6, BRASS);
  fillCircle(g, 20, 29, 1.8, BRASS);

  // Profilo
  strokeRounded(g, 6, 8, 28, 28, 6, STRAP, 1.5);
}

/**
 * Matassa di cavi di scorta (48x48)
 */
function drawCables(g) {
  const CABLE_DARK = 0x141416;
  const CABLE_MID = 0x242428;
  const CABLE_LIGHT = 0x3f3f46;
  const VELCRO = 0xd9534f;
  const CHROME = 0xc3cad1;
  const GOLD = 0xc8a94e;

  // Spire di cavo arrotolato
  g.lineStyle(4.5, CABLE_DARK, 1);
  g.strokeCircle(24, 24, 16);
  g.lineStyle(4, CABLE_MID, 1);
  g.strokeCircle(24, 24, 14);
  g.lineStyle(3.5, CABLE_DARK, 1);
  g.strokeCircle(24, 24, 11.5);
  g.lineStyle(1.5, CABLE_LIGHT, 0.7);
  g.strokeCircle(23, 23, 15);

  // Fascetta a strappo rossa/arancio al centro
  fillRounded(g, 19, 7, 10, 6, 2, VELCRO);
  fillRect(g, 21, 9, 6, 2, 0xa93226);

  // Terminali jack / cannon che spuntano
  fillRect(g, 33, 26, 9, 3.5, CHROME);
  fillRect(g, 42, 27, 4, 1.8, GOLD);

  fillRect(g, 6, 28, 8, 4, CHROME);
  fillCircle(g, 6, 30, 2, 0x1a1a1a);
}

/**
 * Accordatore a pedale di Concy (48x48)
 */
function drawConcyTuner(g) {
  const PEDAL_BASE = 0x1e3a8a; // Blu scuro
  const PEDAL_LIGHT = 0x2563eb;
  const PEDAL_BORDER = 0x0f172a;
  const SCREEN_BG = 0x050811;
  const LED_GREEN = 0x22c55e;
  const CHROME = 0xe2e8f0;

  // Telaio metallico del pedale
  fillRounded(g, 11, 6, 26, 36, 5, PEDAL_BASE);
  fillRounded(g, 13, 8, 22, 32, 4, PEDAL_LIGHT);
  strokeRounded(g, 11, 6, 26, 36, 5, PEDAL_BORDER, 2);

  // Schermo display a LED
  fillRounded(g, 14, 10, 20, 14, 2, SCREEN_BG);
  strokeRounded(g, 14, 10, 20, 14, 2, 0x334155, 1);

  // Indicatore LED intonazione (barra e nota centrale "E")
  fillRect(g, 23, 14, 2, 6, LED_GREEN);
  fillRect(g, 19, 16, 2, 3, 0x3b82f6);
  fillRect(g, 27, 16, 2, 3, 0x3b82f6);

  // Pulsante switch a pedale in metallo cromato
  fillCircle(g, 24, 33, 4.5, CHROME);
  fillCircle(g, 24, 33, 3, 0x94a3b8);
  fillCircle(g, 23, 32, 1.5, 0xffffff);

  // Jack laterali
  fillRect(g, 8, 17, 3, 4, CHROME);
  fillRect(g, 37, 17, 3, 4, CHROME);
}

/**
 * Plettro Jackanal Heavy di Marco (48x48)
 */
function drawMarcoPick(g) {
  const PICK_AMBER = 0x92400e;
  const PICK_LIGHT = 0xd97706;
  const PICK_BORDER = 0x451a03;
  const GOLD = 0xfbbf24;

  // Sagoma a plettro 351 (triangolare con angoli morbidi)
  const points = [
    { x: 10, y: 12 },
    { x: 38, y: 12 },
    { x: 34, y: 26 },
    { x: 24, y: 39 },
    { x: 14, y: 26 }
  ];

  g.fillStyle(PICK_AMBER, 1);
  g.fillPoints(points, true);

  // Effetto tartarugato sfumato
  fillCircle(g, 20, 18, 6, PICK_LIGHT, 0.6);
  fillCircle(g, 29, 23, 4.5, PICK_LIGHT, 0.5);
  fillCircle(g, 23, 29, 3.5, 0x78350f, 0.8);

  // Bordo plettro
  g.lineStyle(2, PICK_BORDER, 1);
  g.strokePoints(points, true);

  // Logo Jackanal inciso a caldo in oro (cuore capovolto / plettrata)
  fillCircle(g, 21.5, 20, 2.8, GOLD);
  fillCircle(g, 26.5, 20, 2.8, GOLD);
  g.fillTriangle(19, 21, 29, 21, 24, 27, GOLD);
}

/**
 * Chiavetta per batteria di Davide (48x48)
 */
function drawDavideDrumkey(g) {
  const CHROME_LIGHT = 0xf8fafc;
  const CHROME_MID = 0xcbd5e1;
  const CHROME_DARK = 0x64748b;
  const OUTLINE = 0x1e293b;

  // Impugnatura orizzontale a T
  fillRounded(g, 10, 11, 28, 7, 3.5, CHROME_MID);
  fillRounded(g, 12, 12, 24, 4, 2, CHROME_LIGHT);
  strokeRounded(g, 10, 11, 28, 7, 3.5, OUTLINE, 1.5);

  // Zigrinatura sui terminali dell'impugnatura
  fillRect(g, 12, 13, 2, 4, CHROME_DARK);
  fillRect(g, 34, 13, 2, 4, CHROME_DARK);

  // Asta centrale verticale
  fillRect(g, 21.5, 18, 5, 14, CHROME_MID);
  fillRect(g, 22.5, 18, 2, 14, CHROME_LIGHT);
  strokeRounded(g, 21.5, 18, 5, 14, 1, OUTLINE, 1.5);

  // Boccola quadrata femmina inferiore per tiranti
  fillRounded(g, 20, 31, 8, 7, 2, CHROME_DARK);
  fillRect(g, 22, 33, 4, 4, 0x0f172a); // cavità quadrata
  strokeRounded(g, 20, 31, 8, 7, 2, OUTLINE, 1.5);
}

/**
 * Filtro antipop tascabile di Riccardo (48x48)
 */
function drawRiccardoPopfilter(g) {
  const RING_OUTER = 0x1e293b;
  const MESH_DARK = 0x0f172a;
  const MESH_LIGHT = 0x334155;
  const GOOSENECK = 0x94a3b8;
  const CLAMP = 0x475569;

  // Retina circolare
  fillCircle(g, 22, 18, 13, MESH_DARK);
  g.lineStyle(1.5, MESH_LIGHT, 0.6);
  g.strokeCircle(22, 18, 9);
  g.strokeCircle(22, 18, 5);

  // Cerchio metallico esterno
  g.lineStyle(3, RING_OUTER, 1);
  g.strokeCircle(22, 18, 13);
  g.lineStyle(1, 0x64748b, 0.9);
  g.strokeCircle(21.5, 17.5, 12);

  // Braccio a collo d'oca flessibile argentato
  g.lineStyle(3.5, GOOSENECK, 1);
  g.beginPath();
  g.moveTo(22, 31);
  g.lineTo(24, 36);
  g.lineTo(30, 39);
  g.strokePath();

  // Morsetto di fissaggio
  fillRounded(g, 28, 38, 9, 6, 2, CLAMP);
  fillRect(g, 35, 36, 4, 2, 0xcbd5e1); // vite a farfalla
  fillRect(g, 35, 42, 4, 2, 0xcbd5e1);
}

export function createInventoryTextures(scene) {
  const textures = [
    { key: 'ui-backpack', w: 40, h: 40, draw: drawBackpack },
    { key: 'item-cables', w: 48, h: 48, draw: drawCables },
    { key: 'item-concy-tuner', w: 48, h: 48, draw: drawConcyTuner },
    { key: 'item-marco-pick', w: 48, h: 48, draw: drawMarcoPick },
    { key: 'item-davide-drumkey', w: 48, h: 48, draw: drawDavideDrumkey },
    { key: 'item-riccardo-popfilter', w: 48, h: 48, draw: drawRiccardoPopfilter }
  ];

  for (const { key, w, h, draw } of textures) {
    if (scene.textures.exists(key)) {
      continue;
    }

    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.clear();
    g.destroy();
  }
}
