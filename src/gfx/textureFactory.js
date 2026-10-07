/**
 * Texture degli arredi, disegnate a runtime. Il personaggio non è qui: sta in
 * `src/gfx/characterArt.js`, che lo disegna a partire dai JSON in
 * `src/data/characters/`. Gli avatar dei dialoghi (placeholder con l'iniziale)
 * sono in fondo a questo file: servono a `DialogueBox`.
 */

import { listNpcCharacters, listPlayableCharacters } from '../game/characters.js';
import { createAvatarTexture } from './avatarArt.js';

const CHROME = 0xc3cad1;
const CHROME_DARK = 0x8b939b;
const GOLD = 0xc8a94e;
const GOLD_DARK = 0x8f7530;
const CREAM = 0xefe6d2;
const CREAM_SHADE = 0xd6c9ac;
const WOOD = 0xc6904a;
const WOOD_DARK = 0x8a5a2b;
const RUBBER = 0x2a1f18;
const CABLE_BLACK = 0x161618;

function fillRounded(g, x, y, w, h, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x, y, w, h, r);
}

function fillRect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function fillCircle(g, x, y, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, r);
}

function fillEllipse(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillEllipse(x, y, w, h);
}

function fillQuad(g, points, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillPoints(points, true);
}

function chromePole(g, x, top, bottom, width = 2) {
  fillRect(g, x - width / 2, top, width, bottom - top, CHROME);
  fillRect(g, x + width / 2 - 1, top, 1, bottom - top, CHROME_DARK);
}

function tripod(g, x, y, spread = 9, drop = 5) {
  chromePole(g, x, y - 26, y, 2);
  fillRect(g, x - spread, y, spread, 2, CHROME_DARK);
  fillRect(g, x + 1, y, spread, 2, CHROME_DARK);
  fillRect(g, x - 1, y, 2, drop, CHROME_DARK);
}

function cymbal(g, x, y, radiusX, radiusY, tilt = 0) {
  fillEllipse(g, x, y + 1, radiusX * 2, radiusY * 2, GOLD_DARK);
  fillEllipse(g, x, y, radiusX * 2, radiusY * 2 - 2, GOLD);
  fillEllipse(g, x - radiusX * 0.3, y - 1, radiusX * 0.7, radiusY * 0.9, 0xe0c666);
  fillEllipse(g, x, y + tilt, radiusX * 0.34, radiusY * 0.7, GOLD_DARK);
}

function drum(g, x, y, radius, headColor = CREAM) {
  fillCircle(g, x, y, radius, WOOD_DARK);
  fillCircle(g, x, y, radius - 2, WOOD);
  fillCircle(g, x, y, radius - 5, headColor);
  fillCircle(g, x - radius * 0.15, y - radius * 0.15, radius * 0.45, CREAM_SHADE, 0.35);
  g.lineStyle(2, CHROME, 1);
  g.strokeCircle(x, y, radius - 3.5);
  const lugs = 8;
  for (let i = 0; i < lugs; i += 1) {
    const angle = (i / lugs) * Math.PI * 2 + 0.3;
    const lx = x + Math.cos(angle) * (radius - 1);
    const ly = y + Math.sin(angle) * (radius - 1);
    fillCircle(g, lx, ly, 1.4, CHROME);
  }
}

function drawAmpGuitar(g) {
  fillRect(g, 8, 44, 10, 4, RUBBER);
  fillRect(g, 34, 44, 10, 4, RUBBER);

  fillQuad(g, [{ x: 4, y: 15 }, { x: 10, y: 6 }, { x: 48, y: 6 }, { x: 44, y: 15 }], 0xe3cfa4);
  fillQuad(g, [{ x: 44, y: 15 }, { x: 48, y: 6 }, { x: 48, y: 39 }, { x: 44, y: 46 }], 0xa08a68);

  fillRounded(g, 4, 15, 40, 31, 3, 0xd9c197);
  fillRect(g, 4, 15, 40, 1, 0xf0e0bd);

  fillRounded(g, 6, 17, 36, 7, 2, 0x2f2419);
  for (let i = 0; i < 4; i += 1) {
    fillCircle(g, 12 + i * 7, 20.5, 2, GOLD);
    fillCircle(g, 12 + i * 7, 20.5, 0.8, 0xf3e0a8, 0.8);
  }
  fillCircle(g, 38, 20.5, 1.6, 0xd94b3a);

  fillRect(g, 6, 25, 36, 17, 0x9c7f4e);
  for (let x = 9; x < 41; x += 3) {
    for (let y = 28; y < 41; y += 3) {
      fillRect(g, x, y, 2, 2, 0x7d6438, 0.55);
    }
  }
  g.lineStyle(1, 0x6b5228, 1);
  g.strokeRect(6.5, 25.5, 35, 16);

  fillRect(g, 17, 43, 18, 3, 0x8a6a30);
  fillRect(g, 17, 43, 18, 1, GOLD);

  const caps = [[4, 15], [38, 15], [4, 40], [38, 40]];
  for (const [cx, cy] of caps) {
    fillRect(g, cx, cy, 6, 6, 0x6d5a3c);
    fillRect(g, cx, cy, 6, 1, 0x9c8558);
  }
}

function drawAmpBass(g) {
  fillRect(g, 10, 54, 11, 4, RUBBER);
  fillRect(g, 47, 54, 11, 4, RUBBER);

  fillQuad(g, [{ x: 4, y: 18 }, { x: 11, y: 7 }, { x: 63, y: 7 }, { x: 58, y: 18 }], 0x4a443f);
  fillQuad(g, [{ x: 58, y: 18 }, { x: 63, y: 7 }, { x: 63, y: 45 }, { x: 58, y: 56 }], 0x2e2926);

  fillRounded(g, 4, 18, 54, 38, 3, 0x241f1c);
  fillRect(g, 4, 18, 54, 1, 0x4b433d);

  fillRounded(g, 7, 21, 48, 12, 2, 0xc8551f);
  fillRect(g, 7, 21, 48, 1, 0xe8813f);
  for (let i = 0; i < 5; i += 1) {
    fillCircle(g, 14 + i * 8, 27, 2.1, 0x2f2a26);
    fillCircle(g, 14 + i * 8, 26.4, 0.8, GOLD, 0.7);
  }
  fillRect(g, 12, 24, 4, 1, 0xefe6d2, 0.6);
  fillRect(g, 34, 24, 10, 1, 0xefe6d2, 0.6);

  fillRect(g, 7, 35, 48, 18, 0x3a332c);
  for (let x = 10; x < 54; x += 3) {
    for (let y = 38; y < 52; y += 3) {
      fillRect(g, x, y, 2, 2, 0x241f1b, 0.5);
    }
  }
  g.lineStyle(1, 0x14100c, 1);
  g.strokeRect(7.5, 35.5, 47, 17);

  fillRect(g, 22, 53, 24, 3, GOLD);
  fillRect(g, 22, 53, 24, 1, 0xf3e0a8);

  const caps = [[4, 18], [52, 18], [4, 50], [52, 50]];
  for (const [cx, cy] of caps) {
    fillRect(g, cx, cy, 6, 6, 0x6f6862);
    fillRect(g, cx, cy, 6, 1, 0x9c948c);
  }
}

function drawDrumKit(g) {
  tripod(g, 140, 116, 10, 5);
  tripod(g, 148, 118, 8, 5);
  tripod(g, 14, 114, 9, 5);
  tripod(g, 124, 116, 8, 5);
  tripod(g, 36, 110, 10, 5);

  chromePole(g, 140, 34, 116, 3);
  chromePole(g, 148, 66, 118, 2);
  chromePole(g, 14, 58, 114, 3);

  cymbal(g, 140, 32, 26, 7, 0);
  cymbal(g, 148, 66, 18, 5, 0);
  cymbal(g, 14, 56, 13, 4, 0);
  cymbal(g, 14, 63, 13, 4, 0);

  chromePole(g, 52, 96, 112, 3);
  chromePole(g, 104, 96, 112, 3);
  fillRect(g, 72, 108, 12, 7, 0x4a443f);
  fillRect(g, 74, 110, 8, 3, CHROME);

  drum(g, 78, 82, 32);
  fillCircle(g, 78, 82, 27, CREAM);
  fillCircle(g, 70, 74, 12, CREAM_SHADE, 0.3);
  g.lineStyle(3, CHROME, 1);
  g.strokeCircle(78, 82, 30);
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    fillCircle(g, 78 + Math.cos(angle) * 30, 82 + Math.sin(angle) * 30, 1.5, CHROME);
  }

  chromePole(g, 78, 50, 58, 4);
  fillRect(g, 50, 53, 58, 4, CHROME);
  fillRect(g, 50, 53, 58, 1, 0xe6ecef);
  drum(g, 62, 42, 14);
  drum(g, 94, 42, 14);

  drum(g, 36, 72, 18);
  drum(g, 124, 88, 13);

  fillRect(g, 42, 110, 3, 8, RUBBER);
  fillRect(g, 22, 110, 3, 8, RUBBER);
  fillRect(g, 31, 116, 3, 4, RUBBER);
  fillEllipse(g, 28, 106, 28, 12, 0x7a3b2a);
  fillEllipse(g, 28, 103, 28, 12, 0x9c4c34);
  fillEllipse(g, 24, 101, 10, 4, 0xb8664a, 0.6);
}

function drawDoor(g) {
  fillRect(g, 0, 0, 64, 48, 0x3a2110);
  fillRect(g, 3, 1, 58, 46, 0x4a2d15);
  fillRect(g, 6, 4, 52, 40, 0x8b5a2b);
  fillRect(g, 30, 4, 1, 40, 0x6b4220);
  fillRect(g, 6, 4, 52, 1, 0xa8703a);

  fillRect(g, 10, 8, 44, 15, 0x7c4e28);
  fillRect(g, 10, 8, 44, 1, 0x6b4220);
  fillRect(g, 10, 26, 44, 15, 0x7c4e28);
  fillRect(g, 10, 26, 44, 1, 0x6b4220);

  fillRect(g, 4, 10, 5, 5, CHROME_DARK);
  fillRect(g, 4, 33, 5, 5, CHROME_DARK);
  fillRect(g, 49, 22, 9, 3, 0x8a6a30);
  fillCircle(g, 52, 27, 3, GOLD);
  fillCircle(g, 51, 26, 1.1, 0xf3e0a8);
  fillRect(g, 8, 43, 48, 4, 0x8a6a30);
  fillRect(g, 8, 43, 48, 1, GOLD);
}

function drawMixer(g) {
  // Support stand legs & feet
  fillRect(g, 10, 50, 8, 3, RUBBER);
  fillRect(g, 34, 50, 8, 3, RUBBER);
  fillRect(g, 13, 31, 3, 20, 0x383b40);
  fillRect(g, 14, 31, 1, 20, 0x5a5e66);
  fillRect(g, 35, 31, 3, 20, 0x383b40);
  fillRect(g, 36, 31, 1, 20, 0x5a5e66);
  fillRect(g, 14, 41, 23, 2, 0x282a2e);

  // Mixer desk body (angled console)
  // Side panels (dark cheeks)
  fillRounded(g, 4, 9, 44, 23, 2, 0x1f2124);
  fillRect(g, 4, 9, 3, 23, 0x151618);
  fillRect(g, 45, 9, 3, 23, 0x151618);

  // Main control surface (dark slate)
  fillRect(g, 7, 9, 38, 23, 0x2b2e33);
  fillRect(g, 7, 9, 38, 1, 0x4f545c);
  fillRect(g, 7, 31, 38, 1, 0x151618);

  // XLR & Jack input connector strip (top row)
  for (let i = 0; i < 6; i += 1) {
    const cx = 10 + i * 4.5;
    fillCircle(g, cx, 12, 1.4, 0x141517);
    fillCircle(g, cx, 12, 0.5, CHROME);
  }

  // Channel EQ rotary knobs (blue, green, orange)
  for (let i = 0; i < 6; i += 1) {
    const cx = 10 + i * 4.5;
    fillCircle(g, cx, 15, 1.1, 0x3b82f6);
    fillCircle(g, cx, 17.5, 1.1, 0x10b981);
    fillCircle(g, cx, 20, 1.1, 0xf97316);
  }

  // Channel faders (tracks and fader caps)
  const faderCaps = [25, 24, 26, 23, 27, 24];
  for (let i = 0; i < 6; i += 1) {
    const cx = 10 + i * 4.5;
    fillRect(g, cx - 0.5, 23, 1, 7, 0x131416);
    fillRect(g, cx - 1.2, faderCaps[i], 2.4, 2, CREAM);
  }

  // Master section (right side)
  // Stereo VU meters (LED ladder)
  const leds = [
    { y: 19, color: 0x22c55e },
    { y: 17, color: 0x22c55e },
    { y: 15, color: 0xeab308 },
    { y: 13, color: 0xef4444 }
  ];
  for (const led of leds) {
    fillRect(g, 38, led.y, 1.2, 1.2, led.color);
    fillRect(g, 40, led.y, 1.2, 1.2, led.color);
  }

  // Power switch & bright red power LED
  fillCircle(g, 43, 13, 1.3, 0xff2222);
  fillCircle(g, 43, 13, 0.5, 0xffaaaa);

  // Master red faders
  fillRect(g, 38, 23, 1, 7, 0x131416);
  fillRect(g, 41, 23, 1, 7, 0x131416);
  fillRect(g, 37.3, 25, 2.4, 2.5, 0xdc2626);
  fillRect(g, 40.3, 25, 2.4, 2.5, 0xdc2626);

  // Power cable emerging from back/side and trailing to power outlet on floor
  fillRect(g, 2, 12, 4, 2.5, 0x161618);
  fillRect(g, 2, 14, 2.5, 14, 0x161618);
  fillRect(g, 1, 28, 2.5, 18, 0x161618);
  fillRect(g, 0, 46, 6, 2.5, 0x161618);
  fillRect(g, 0, 46.5, 6, 0.8, 0x3d3d42);
}

function drawPowerOutlet(g) {
  // Industrial wall faceplate
  fillRounded(g, 5, 6, 22, 18, 2, 0xd1d5db);
  fillRect(g, 6, 7, 20, 1, 0xf3f4f6);
  fillRect(g, 6, 22, 20, 1, 0x9ca3af);

  // Mounting screws
  fillCircle(g, 8, 15, 0.8, 0x6b7280);
  fillCircle(g, 24, 15, 0.8, 0x6b7280);

  // Socket 1 (empty socket)
  fillRounded(g, 10, 10, 4.5, 9, 1, 0x374151);
  fillCircle(g, 12.2, 12, 0.6, 0x111827);
  fillCircle(g, 12.2, 14.5, 0.6, 0x111827);
  fillCircle(g, 12.2, 17, 0.6, 0x111827);

  // Red power indicator LED
  fillCircle(g, 16, 8, 0.9, 0xef4444);
  fillCircle(g, 16, 8, 0.4, 0xfca5a5);

  // Socket 2 (with mixer power plug inserted!)
  fillRounded(g, 16.5, 10, 5, 9, 1, 0x374151);
  // Black molded plug body
  fillRounded(g, 16, 11, 7, 7.5, 1.5, 0x1a1a1c);
  fillRect(g, 17, 12, 5, 1.5, 0x37373b);
  // Strain relief
  fillRect(g, 18, 18.5, 3, 2.5, 0x1a1a1c);
  // Power cord trailing down and towards the mixer
  fillRect(g, 18, 21, 2.8, 7, 0x161618);
  fillRect(g, 19, 27, 13, 2.8, 0x161618);
  fillRect(g, 20, 27.5, 12, 0.8, 0x3d3d42);
}

function drawSpeakerPA(g) {
  // Tripod feet pads
  fillRect(g, 3, 64, 7, 3, RUBBER);
  fillRect(g, 28, 64, 7, 3, RUBBER);
  fillRect(g, 17, 65, 4, 3, RUBBER);

  // Tripod angled legs
  g.lineStyle(2.5, 0x2b2d31, 1);
  g.beginPath();
  g.moveTo(6, 65);
  g.lineTo(19, 52);
  g.moveTo(32, 65);
  g.lineTo(19, 52);
  g.strokePath();
  fillRect(g, 18, 52, 2, 14, 0x2b2d31);

  // Tripod collar bracket
  fillRounded(g, 16, 50, 6, 3, 1, 0x474b52);
  fillCircle(g, 15, 51.5, 1.5, 0x1a1a1c);

  // Telescoping pole
  fillRect(g, 18, 29, 2, 23, 0x383b40);
  fillRect(g, 19, 29, 1, 23, 0x5a5e66);
  // Locking pin
  fillRect(g, 16, 34, 6, 1.5, CHROME);

  // Speaker cabinet (black trapezoid)
  fillQuad(g, [
    { x: 8, y: 2 },
    { x: 30, y: 2 },
    { x: 32, y: 31 },
    { x: 6, y: 31 }
  ], 0x222428);
  fillRect(g, 8, 2, 22, 1, 0x3f434a);
  fillQuad(g, [
    { x: 8, y: 2 },
    { x: 10, y: 2 },
    { x: 8, y: 31 },
    { x: 6, y: 31 }
  ], 0x191a1d);

  // Perforated steel front grille
  fillRect(g, 9, 4, 20, 25, 0x151618);
  for (let x = 11; x <= 27; x += 3) {
    for (let y = 6; y <= 27; y += 3) {
      fillRect(g, x, y, 1, 1, 0x26272b);
    }
  }

  // HF Horn
  fillRounded(g, 13, 6, 12, 6, 1, 0x0f1012);
  fillRect(g, 17, 8, 4, 2, 0x070809);

  // 12" Woofer
  fillCircle(g, 19, 20, 6.2, 0x0f1012);
  fillCircle(g, 19, 20, 4.8, 0x1a1b1e);
  fillCircle(g, 19, 20, 1.8, 0x0f1012);

  // Blue power status LED
  fillCircle(g, 19, 27.5, 1.1, 0x3b82f6);
  fillCircle(g, 19, 27.5, 0.5, 0x93c5fd);

  // Audio cable running down the pole
  fillRect(g, 17, 31, 2, 35, 0x161618);
}

function drawSpeakerMonitor(g) {
  // Rubber feet on floor
  fillRect(g, 6, 30, 6, 3, RUBBER);
  fillRect(g, 26, 31, 6, 2.5, RUBBER);

  // Rear/side casing in dark vinyl
  fillQuad(g, [
    { x: 3, y: 16 },
    { x: 14, y: 7 },
    { x: 9, y: 28 },
    { x: 3, y: 28 }
  ], 0x1d1e22);

  // Angled wedge baffle face (tilted upward and pointing diagonally toward top-right/drums)
  fillQuad(g, [
    { x: 14, y: 7 },
    { x: 41, y: 14 },
    { x: 34, y: 31 },
    { x: 7, y: 26 }
  ], 0x27292f);

  // Perforated steel front grille
  fillQuad(g, [
    { x: 15, y: 9 },
    { x: 39, y: 15 },
    { x: 33, y: 29 },
    { x: 9, y: 24 }
  ], 0x16171a);

  // Grille mesh texture
  for (let x = 11; x <= 37; x += 3) {
    for (let y = 11; y <= 27; y += 3) {
      if (x + y >= 24 && x + y <= 62) {
        fillRect(g, x, y, 1, 1, 0x27292e);
      }
    }
  }

  // Woofer cone (angled perspective)
  fillEllipse(g, 21, 20, 11, 8, 0x0f1012);
  fillEllipse(g, 21, 20, 5, 3.5, 0x1f2125);

  // HF Horn (toward top-right)
  fillRounded(g, 29, 15, 8, 6, 1, 0x0f1012);
  fillRect(g, 31, 17, 4, 2, 0x070809);

  // Metal corner guards
  fillRect(g, 13, 7, 3, 3, 0x141517);
  fillRect(g, 39, 13, 3, 3, 0x141517);
  fillRect(g, 33, 29, 3, 3, 0x141517);
  fillRect(g, 6, 25, 3, 3, 0x141517);

  // Audio cable connector on rear-left side (facing the mixer)
  fillRect(g, 2, 23, 3, 2, CHROME);
  fillRect(g, 0, 24, 3, 5, CABLE_BLACK);
}

function drawMicStand(g) {
  // Tripod base feet
  fillRect(g, 3, 58, 6, 2.5, RUBBER);
  fillRect(g, 23, 58, 6, 2.5, RUBBER);
  fillRect(g, 13, 59, 5, 2.5, RUBBER);

  // Tripod legs
  g.lineStyle(2, 0x383b40, 1);
  g.beginPath();
  g.moveTo(6, 59);
  g.lineTo(16, 54);
  g.moveTo(26, 59);
  g.lineTo(16, 54);
  g.strokePath();

  // Central hub & T-tightener
  fillRounded(g, 14, 52, 4, 4, 1, 0x1e2023);
  fillRect(g, 12, 53, 8, 1.5, CHROME);

  // Telescoping vertical shaft
  chromePole(g, 16, 25, 53, 2);

  // Boom swivel joint & clutch
  fillRounded(g, 13.5, 23, 5, 4, 1, 0x1e2023);
  fillRect(g, 11, 24, 2.5, 2, CHROME);

  // Boom arm (diagonal pole)
  chromePole(g, 17, 12, 24, 2);
  fillCircle(g, 15, 25, 2, 0x222427); // counterweight

  // Mic clip
  fillRect(g, 16, 11, 3, 3, 0x1a1a1c);

  // Dynamic microphone (Shure SM58 style)
  fillRect(g, 16.5, 7, 2.5, 5, 0x2b2e33);
  fillRect(g, 16.5, 7, 1, 5, 0x45484f);
  // Silver spherical mesh ball
  fillCircle(g, 17.5, 5.5, 2.8, CHROME_DARK);
  fillCircle(g, 17.5, 5.2, 2.3, CHROME);
  fillCircle(g, 16.5, 4.5, 0.9, 0xffffff, 0.8);
  fillRect(g, 15.5, 6, 4, 1, 0x5a5f66);

  // XLR cable wrapped around pole
  fillRect(g, 14.5, 19, 4, 1.5, 0x161618);
  fillRect(g, 14.5, 32, 4, 1.5, 0x161618);
  fillRect(g, 14.5, 44, 4, 1.5, 0x161618);
  fillRect(g, 16, 53, 2, 8, 0x161618);
  fillRect(g, 12, 59, 9, 2, 0x161618);
}

function drawCablesBundle(g) {
  // Power strip (ciabatta elettrica)
  fillRounded(g, 5, 13, 23, 11, 2, 0xdedede);
  fillRect(g, 5, 13, 23, 1, 0xffffff);
  fillRect(g, 5, 23, 23, 1, 0xaaaaaa);

  // 3 Schuko angled sockets
  for (let i = 0; i < 3; i += 1) {
    fillCircle(g, 10 + i * 5.5, 18.5, 2, 0x333333);
    fillCircle(g, 10 + i * 5.5, 18.5, 0.5, 0xc89848);
  }

  // Red illuminated power rocker switch
  fillRect(g, 24, 16, 3, 5, 0xef4444);
  fillRect(g, 24.5, 17, 1.5, 1.5, 0xffffff, 0.8);

  // Power strip cable
  fillRect(g, 1, 17, 5, 2.5, 0x161618);

  // Coiled black & colored instrument cables
  g.lineStyle(2.5, 0x161618, 1);
  g.strokeCircle(36, 14, 8);
  g.lineStyle(2, 0x1d4ed8, 1); // blue cable
  g.strokeCircle(34, 15, 7);
  g.lineStyle(2, 0x161618, 1);
  g.strokeCircle(33, 13, 9);

  // Gold & chrome 6.3mm jack connectors
  fillRect(g, 27, 8, 7, 2, GOLD);
  fillRect(g, 34, 8.5, 4, 1.2, CHROME);
  fillRect(g, 25, 7.5, 2, 3, 0x161618);
}

function drawCablesCoil(g) {
  // Coiled black stage cable loops on floor
  g.lineStyle(2.5, 0x161618, 1);
  g.strokeCircle(18, 12, 9);
  g.lineStyle(2, 0x2c2d30, 1);
  g.strokeCircle(18, 12, 7);
  g.lineStyle(2, 0x161618, 1);
  g.strokeCircle(18, 12, 5);

  // Orange velcro cable tie
  fillRect(g, 16, 4, 4, 16, 0xf97316);
  fillRect(g, 17, 4, 2, 16, 0xfb923c);

  // Chrome XLR connector
  fillRect(g, 22, 14, 6, 3, CHROME);
  fillRect(g, 22, 14, 6, 1, 0xffffff);
  fillRect(g, 28, 14.5, 2, 2, 0x1e2023);
}

function drawGuitarRed(g) {
  // --- FLOOR GUITAR STAND (Tubular black steel) ---
  fillRect(g, 15, 48, 2, 8, 0x18181b);
  fillCircle(g, 16, 56, 1.5, RUBBER);
  g.lineStyle(2, 0x18181b, 1);
  g.lineBetween(16, 48, 9, 56);
  g.lineBetween(16, 48, 23, 56);
  fillCircle(g, 9, 56, 1.5, RUBBER);
  fillCircle(g, 23, 56, 1.5, RUBBER);

  // Lower padded U-cradle for guitar body (foam covered)
  g.lineStyle(3, 0x27272a, 1);
  g.lineBetween(10, 44, 16, 46);
  g.lineBetween(16, 46, 22, 44);
  fillCircle(g, 10, 44, 2, 0x18181b);
  fillCircle(g, 22, 44, 2, 0x18181b);

  // Vertical spine pole of the stand
  fillRect(g, 15, 14, 2, 34, 0x18181b);
  fillRect(g, 15, 14, 1, 34, 0x3f3f46);

  // Upper neck cradle / fork
  fillRect(g, 12, 17, 8, 2, 0x27272a);
  fillRect(g, 11, 15, 2, 4, 0x18181b);
  fillRect(g, 19, 15, 2, 4, 0x18181b);

  // --- RED ELECTRIC GUITAR (Solid-body double-cutaway) ---
  fillEllipse(g, 16, 38, 16, 18, 0x181010, 0.4);

  const RED_DARK = 0x991b1b;
  const RED_MAIN = 0xdc2626;
  const RED_LIGHT = 0xef4444;

  // Lower bout & waist
  fillEllipse(g, 16, 40, 16, 14, RED_DARK);
  fillEllipse(g, 16, 39.5, 15, 13, RED_MAIN);
  fillEllipse(g, 15, 38.5, 10, 8, RED_LIGHT, 0.4);

  // Upper horns (Cutaways)
  fillRounded(g, 11, 28, 4, 12, 2, RED_MAIN);
  fillRect(g, 11, 28, 3, 10, RED_LIGHT);
  fillRounded(g, 17, 30, 4, 10, 2, RED_MAIN);
  fillRect(g, 18, 30, 3, 8, RED_DARK);

  // Pickguard (Classic white 3-ply)
  fillEllipse(g, 15.5, 38, 9, 8, 0xf3f4f6);
  fillRect(g, 13, 33, 4, 6, 0xf3f4f6);
  fillCircle(g, 14, 34, 1, 0xffffff);

  // Pickups (3 single-coil pickups with chrome pole pieces)
  fillRect(g, 14, 34, 4.5, 1.5, 0x111827);
  fillRect(g, 14, 37, 4.5, 1.5, 0x111827);
  fillRect(g, 14, 40, 4.5, 1.5, 0x111827);
  for (let i = 0; i < 3; i += 1) {
    fillCircle(g, 14.8 + i * 1.4, 34.7, 0.35, CHROME);
    fillCircle(g, 14.8 + i * 1.4, 37.7, 0.35, CHROME);
    fillCircle(g, 14.8 + i * 1.4, 40.7, 0.35, CHROME);
  }

  // Chrome bridge & saddles
  fillRect(g, 14, 42.5, 4.5, 2.5, CHROME);
  fillRect(g, 14.5, 42.5, 3.5, 1, 0xffffff);

  // White rotary control knobs & pickup selector
  fillCircle(g, 18.5, 40.5, 1, 0xffffff);
  fillCircle(g, 18.5, 42.5, 1, 0xffffff);
  fillCircle(g, 18, 44.5, 1, 0xffffff);
  fillRect(g, 17, 37, 1.5, 1.5, 0xd1d5db);

  // Chrome output jack plate
  fillEllipse(g, 19, 45, 3, 2, CHROME);
  fillCircle(g, 19, 45, 0.6, 0x111827);

  // --- GUITAR NECK & FRETBOARD ---
  fillRect(g, 14.5, 11, 3, 22, 0xdfbb82);
  fillRect(g, 14.5, 11, 1, 22, 0xf3e2c3);

  for (let y = 13; y <= 31; y += 2) {
    fillRect(g, 14.5, y, 3, 0.6, 0x9ca3af);
  }
  fillCircle(g, 16, 17.5, 0.45, 0x111827);
  fillCircle(g, 16, 21.5, 0.45, 0x111827);
  fillCircle(g, 16, 25.5, 0.45, 0x111827);
  fillCircle(g, 15.6, 29.5, 0.4, 0x111827);
  fillCircle(g, 16.4, 29.5, 0.4, 0x111827);

  // Nut
  fillRect(g, 14.5, 10.5, 3, 1, 0xffffff);

  // Headstock Strat style
  fillRounded(g, 14, 4, 4, 7, 1.5, 0xdfbb82);
  fillCircle(g, 15, 4.5, 1.5, 0xdfbb82);
  fillRect(g, 13.5, 6, 1.5, 3, 0xdfbb82);

  // 6 Chrome tuning pegs in line
  for (let i = 0; i < 6; i += 1) {
    fillRect(g, 13, 5 + i * 0.9, 1.2, 0.7, CHROME);
  }

  // 6 Silver steel strings
  g.lineStyle(0.6, 0xe5e7eb, 0.75);
  g.lineBetween(14.8, 43, 14.8, 10.5);
  g.lineBetween(15.3, 43, 15.3, 10.5);
  g.lineBetween(15.8, 43, 15.8, 10.5);
  g.lineBetween(16.3, 43, 16.3, 10.5);
  g.lineBetween(16.8, 43, 16.8, 10.5);
  g.lineBetween(17.2, 43, 17.2, 10.5);
}

function drawBassPrecision(g) {
  // --- FLOOR GUITAR STAND (Tubular black steel) ---
  fillRect(g, 15, 54, 2, 8, 0x18181b);
  fillCircle(g, 16, 62, 1.5, RUBBER);
  g.lineStyle(2, 0x18181b, 1);
  g.lineBetween(16, 54, 8, 62);
  g.lineBetween(16, 54, 24, 62);
  fillCircle(g, 8, 62, 1.5, RUBBER);
  fillCircle(g, 24, 62, 1.5, RUBBER);

  // Lower padded U-cradle for bass body
  g.lineStyle(3.5, 0x27272a, 1);
  g.lineBetween(9, 49, 16, 51);
  g.lineBetween(16, 51, 23, 49);
  fillCircle(g, 9, 49, 2, 0x18181b);
  fillCircle(g, 23, 49, 2, 0x18181b);

  // Vertical spine pole of the stand
  fillRect(g, 15, 14, 2, 40, 0x18181b);
  fillRect(g, 15, 14, 1, 40, 0x3f3f46);

  // Upper neck cradle / fork
  fillRect(g, 12, 17, 8, 2, 0x27272a);
  fillRect(g, 11, 15, 2, 4, 0x18181b);
  fillRect(g, 19, 15, 2, 4, 0x18181b);

  // --- FENDER PRECISION BASS (Classic 3-Color Sunburst & Tortoiseshell) ---
  fillEllipse(g, 16, 44, 17, 20, 0x181010, 0.4);

  const BURST_BLACK = 0x1c1008;
  const BURST_BROWN = 0x85300a;
  const BURST_GOLD = 0xde9531;

  // Lower bout & waist
  fillEllipse(g, 16, 46, 17, 15, BURST_BLACK);
  fillEllipse(g, 16, 45.5, 15, 13, BURST_BROWN);
  fillEllipse(g, 15.5, 45, 11, 9, BURST_GOLD);

  // Extended Upper Horn (P-Bass signature reaching high)
  fillRounded(g, 10.5, 32, 4.5, 15, 2, BURST_BLACK);
  fillRounded(g, 11, 33, 3.5, 13, 1.5, BURST_BROWN);
  fillRect(g, 11.5, 34, 2.5, 11, BURST_GOLD);

  // Lower horn (shorter, rounded)
  fillRounded(g, 17.5, 36, 4, 11, 2, BURST_BLACK);
  fillRounded(g, 18, 37, 3, 9, 1.5, BURST_BROWN);

  // Tortoiseshell Pickguard
  const TORTOISE = 0x54180d;
  fillEllipse(g, 15.5, 43, 10, 9, TORTOISE);
  fillRect(g, 12, 36, 4.5, 8, TORTOISE);
  fillRect(g, 18, 43, 3.5, 8, CHROME);
  fillCircle(g, 14, 42, 1, 0x7c2d12);
  fillCircle(g, 16, 44, 0.8, 0x9a3412);
  fillCircle(g, 13.5, 39, 0.8, 0x7c2d12);

  // Split-Coil P-Bass Pickup
  fillRect(g, 13.5, 39, 3, 2.5, 0x111827);
  fillCircle(g, 14.3, 40.2, 0.5, CHROME);
  fillCircle(g, 15.7, 40.2, 0.5, CHROME);
  fillRect(g, 15.5, 42, 3, 2.5, 0x111827);
  fillCircle(g, 16.3, 43.2, 0.5, CHROME);
  fillCircle(g, 17.7, 43.2, 0.5, CHROME);

  // Heavy 4-saddle vintage chrome bridge
  fillRect(g, 13.5, 48.5, 5.5, 3.5, CHROME);
  fillRect(g, 14, 48.5, 4.5, 1, 0xffffff);

  // 2 Large knurled flat-top chrome knobs (Volume & Tone)
  fillCircle(g, 19.5, 46, 1.4, CHROME);
  fillCircle(g, 19.5, 46, 0.6, 0xffffff);
  fillCircle(g, 19.5, 49.5, 1.4, CHROME);
  fillCircle(g, 19.5, 49.5, 0.6, 0xffffff);

  // Chrome output jack
  fillCircle(g, 19.5, 52.5, 1, CHROME);
  fillCircle(g, 19.5, 52.5, 0.4, 0x111827);

  // --- LONG SCALE BASS NECK & FRETBOARD ---
  fillRect(g, 14.2, 10, 3.6, 26, 0xdfbb82);
  fillRect(g, 14.5, 10, 3, 26, 0x422616);
  fillRect(g, 14.2, 10, 0.8, 26, 0xf3e2c3);

  for (let y = 12; y <= 34; y += 2.2) {
    fillRect(g, 14.5, y, 3, 0.6, 0x9ca3af);
  }
  fillCircle(g, 16, 16, 0.5, 0xffffff);
  fillCircle(g, 16, 20.5, 0.5, 0xffffff);
  fillCircle(g, 16, 25, 0.5, 0xffffff);
  fillCircle(g, 15.5, 29.5, 0.4, 0xffffff);
  fillCircle(g, 16.5, 29.5, 0.4, 0xffffff);

  // Bone Nut
  fillRect(g, 14.2, 9.5, 3.6, 1, 0xffffff);

  // Large P-Bass Headstock
  fillRounded(g, 13.5, 2.5, 4.5, 8, 1.5, 0xdfbb82);
  fillCircle(g, 14.5, 3, 1.8, 0xdfbb82);
  fillRect(g, 13, 5, 1.5, 4, 0xdfbb82);

  // 4 Large Chrome Cloverleaf Tuners
  for (let i = 0; i < 4; i += 1) {
    const ty = 3.5 + i * 1.5;
    fillRect(g, 11.5, ty, 2, 1, CHROME);
    fillCircle(g, 11.5, ty + 0.5, 1.2, CHROME);
  }

  // 4 Thick Bass strings
  g.lineStyle(1.1, 0xe5e7eb, 0.9);
  g.lineBetween(14.8, 49, 14.8, 9.5);
  g.lineStyle(1.0, 0xe5e7eb, 0.85);
  g.lineBetween(15.6, 49, 15.6, 9.5);
  g.lineStyle(0.9, 0xe5e7eb, 0.85);
  g.lineBetween(16.4, 49, 16.4, 9.5);
  g.lineStyle(0.8, 0xe5e7eb, 0.8);
  g.lineBetween(17.2, 49, 17.2, 9.5);
}

function buildPropsTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  drawDrumKit(g);
  g.generateTexture('prop-drum-kit', 168, 124);
  g.clear();

  drawAmpGuitar(g);
  g.generateTexture('prop-amp-guitar', 52, 48);
  g.clear();

  drawAmpBass(g);
  g.generateTexture('prop-amp-bass', 68, 58);
  g.clear();

  drawDoor(g);
  g.generateTexture('prop-door', 64, 48);
  g.clear();

  drawMixer(g);
  g.generateTexture('prop-mixer', 52, 54);
  g.clear();

  drawPowerOutlet(g);
  g.generateTexture('prop-power-outlet', 32, 32);
  g.clear();

  drawSpeakerPA(g);
  g.generateTexture('prop-speaker-pa', 38, 68);
  g.clear();

  drawSpeakerMonitor(g);
  g.generateTexture('prop-speaker-monitor', 44, 32);
  g.clear();

  drawMicStand(g);
  g.generateTexture('prop-mic-stand', 32, 62);
  g.clear();

  drawCablesBundle(g);
  g.generateTexture('prop-cables-bundle', 48, 28);
  g.clear();

  drawCablesCoil(g);
  g.generateTexture('prop-cables-coil', 36, 24);
  g.clear();

  drawGuitarRed(g);
  g.generateTexture('prop-guitar-red', 32, 58);
  g.clear();

  drawBassPrecision(g);
  g.generateTexture('prop-bass-precision', 32, 64);
  g.clear();

  g.destroy();
}

function buildSoftTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  g.fillStyle(0xffffff, 1);
  g.fillCircle(16, 16, 15);
  g.generateTexture('soft-circle', 32, 32);
  g.clear();

  g.fillStyle(0xffffff, 0.9);
  g.fillEllipse(20, 7, 40, 14);
  g.generateTexture('soft-shadow', 40, 14);
  g.clear();

  g.destroy();
}

export function createPropsTextures(scene) {
  buildPropsTexture(scene);
}

export function createSoftTextures(scene) {
  buildSoftTextures(scene);
}

export function createAvatarTextures(scene) {
  const size = 128;
  const characters = [...listPlayableCharacters(), ...listNpcCharacters()];

  for (const character of characters) {
    const key = `avatar-${character.id}`;

    if (scene.textures.exists(key)) {
      continue;
    }

    createAvatarTexture(scene, key, size, character);
  }

  if (!scene.textures.exists('avatar-generic')) {
    createAvatarTexture(scene, 'avatar-generic', size, {
      id: 'generic',
      name: 'Personaggio',
      palette: { skin: '#e8b98f', hair: '#3a2f26', shirt: '#4b5563', eye: '#241f1b' }
    });
  }
}

