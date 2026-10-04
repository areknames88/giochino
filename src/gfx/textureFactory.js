export const CHARACTER_FRAME_WIDTH = 32;
export const CHARACTER_FRAME_HEIGHT = 40;
export const CHARACTER_FRAMES_PER_ROW = 4;

const CHROME = 0xc3cad1;
const CHROME_DARK = 0x8b939b;
const GOLD = 0xc8a94e;
const GOLD_DARK = 0x8f7530;
const CREAM = 0xefe6d2;
const CREAM_SHADE = 0xd6c9ac;
const WOOD = 0xc6904a;
const WOOD_DARK = 0x8a5a2b;
const SKIN = 0xe8b98f;
const HAIR = 0x4a3121;
const SHIRT = 0xb8443c;
const SHIRT_DARK = 0x8f332e;
const PANTS = 0x35486b;
const SHOE = 0x2a1f18;
const EYE = 0x241f1b;

const CELL_BOTTOM_INSET = 3;

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
  fillRect(g, 8, 44, 10, 4, SHOE);
  fillRect(g, 34, 44, 10, 4, SHOE);

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
  fillRect(g, 10, 54, 11, 4, SHOE);
  fillRect(g, 47, 54, 11, 4, SHOE);

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
  fillRect(g, 62, 78, 32, 2, 0x8a6a30, 0.5);

  chromePole(g, 78, 50, 58, 4);
  fillRect(g, 50, 53, 58, 4, CHROME);
  fillRect(g, 50, 53, 58, 1, 0xe6ecef);
  drum(g, 62, 42, 14);
  drum(g, 94, 42, 14);

  drum(g, 36, 72, 18);
  drum(g, 124, 88, 13);

  fillRect(g, 42, 110, 3, 8, SHOE);
  fillRect(g, 22, 110, 3, 8, SHOE);
  fillRect(g, 31, 116, 3, 4, SHOE);
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

function drawCharacterCell(g, cx, bottomY, facing, phase) {
  const swing = Math.sin(phase) * 2.6;
  const bob = Math.abs(Math.cos(phase)) * 1;
  const legLeft = swing;
  const legRight = -swing;

  fillRounded(g, cx - 7, bottomY - 12 + legRight, 6, 10, 2, PANTS);
  fillRounded(g, cx + 1, bottomY - 12 + legLeft, 6, 10, 2, PANTS);
  fillRect(g, cx - 7.5, bottomY - 3 + legRight, 7, 3, SHOE);
  fillRect(g, cx + 0.5, bottomY - 3 + legLeft, 7, 3, SHOE);

  fillRounded(g, cx - 8, bottomY - 26 + bob, 16, 15, 4, SHIRT);
  fillRect(g, cx - 8, bottomY - 26 + bob, 16, 2, 0xd05a4f, 0.7);

  fillRounded(g, cx - 11, bottomY - 24 + bob + legLeft * 0.7, 4, 9, 2, SHIRT_DARK);
  fillRounded(g, cx + 7, bottomY - 24 + bob + legRight * 0.7, 4, 9, 2, SHIRT_DARK);
  fillRect(g, cx - 11, bottomY - 16 + bob + legLeft * 0.7, 4, 3, SKIN);
  fillRect(g, cx + 7, bottomY - 16 + bob + legRight * 0.7, 4, 3, SKIN);

  const headY = bottomY - 32 + bob;

  if (facing === 'up') {
    fillCircle(g, cx, headY, 7.2, HAIR);
    fillCircle(g, cx - 3, headY + 3, 2.4, HAIR);
  } else if (facing === 'left') {
    fillCircle(g, cx + 2, headY - 0.5, 6.8, HAIR);
    fillCircle(g, cx - 1, headY, 6.4, SKIN);
    fillRect(g, cx - 5, headY - 1, 2, 2, EYE);
    fillRect(g, cx - 7, headY + 2, 2, 3, SKIN);
  } else if (facing === 'right') {
    fillCircle(g, cx - 2, headY - 0.5, 6.8, HAIR);
    fillCircle(g, cx + 1, headY, 6.4, SKIN);
    fillRect(g, cx + 3, headY - 1, 2, 2, EYE);
    fillRect(g, cx + 5, headY + 2, 2, 3, SKIN);
  } else {
    fillCircle(g, cx, headY, 7, SKIN);
    fillRect(g, cx - 7, headY - 8, 14, 7, HAIR);
    fillRect(g, cx - 7, headY - 8, 14, 2, 0x5c3d28);
    fillRect(g, cx - 7.5, headY - 2, 3, 5, HAIR);
    fillRect(g, cx + 4.5, headY - 2, 3, 5, HAIR);
    fillRect(g, cx - 4, headY - 2, 2, 2, EYE);
    fillRect(g, cx + 2, headY - 2, 2, 2, EYE);
    fillRect(g, cx - 2, headY + 3, 4, 1, 0xc98f6a, 0.8);
  }
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

  g.destroy();
}

function buildCharacterTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const width = CHARACTER_FRAME_WIDTH * CHARACTER_FRAMES_PER_ROW;
  const height = CHARACTER_FRAME_HEIGHT * 4;
  const facings = ['down', 'left', 'right', 'up'];

  for (let row = 0; row < facings.length; row += 1) {
    for (let col = 0; col < CHARACTER_FRAMES_PER_ROW; col += 1) {
      const cx = col * CHARACTER_FRAME_WIDTH + CHARACTER_FRAME_WIDTH / 2;
      const bottomY = row * CHARACTER_FRAME_HEIGHT + CHARACTER_FRAME_HEIGHT - CELL_BOTTOM_INSET;
      const phase = col === 0 ? 0 : (col / CHARACTER_FRAMES_PER_ROW) * Math.PI * 2;
      drawCharacterCell(g, cx, bottomY, facings[row], phase);
    }
  }

  g.generateTexture('player', width, height);
  g.clear();
  g.destroy();

  const texture = scene.textures.get('player');
  const total = facings.length * CHARACTER_FRAMES_PER_ROW;

  for (let index = 0; index < total; index += 1) {
    const col = index % CHARACTER_FRAMES_PER_ROW;
    const row = Math.floor(index / CHARACTER_FRAMES_PER_ROW);
    texture.add(
      index,
      0,
      col * CHARACTER_FRAME_WIDTH,
      row * CHARACTER_FRAME_HEIGHT,
      CHARACTER_FRAME_WIDTH,
      CHARACTER_FRAME_HEIGHT
    );
  }
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

export function createProceduralTextures(scene) {
  buildPropsTexture(scene);
  buildCharacterTexture(scene);
  buildSoftTextures(scene);
}

export function createCharacterAnimations(scene) {
  if (scene.anims.exists('player-walk-down')) {
    return;
  }

  const facings = ['down', 'left', 'right', 'up'];

  for (let row = 0; row < facings.length; row += 1) {
    const base = row * CHARACTER_FRAMES_PER_ROW;
    const facing = facings[row];

    scene.anims.create({
      key: `player-walk-${facing}`,
      frames: scene.anims.generateFrameNumbers('player', { start: base + 1, end: base + 3 }),
      frameRate: 9,
      repeat: -1
    });

    scene.anims.create({
      key: `player-idle-${facing}`,
      frames: scene.anims.generateFrameNumbers('player', { start: base, end: base }),
      frameRate: 1,
      repeat: -1
    });
  }
}