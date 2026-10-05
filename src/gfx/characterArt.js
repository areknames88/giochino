import Phaser from 'phaser';
import { characterAnimKey, characterTextureKey, resolveLook } from '../game/characters.js';

/**
 * Disegno dei personaggi umanoidi. Tutto quello che il foglio di un personaggio
 * contiene arriva da un JSON (`src/data/characters/`): palette, corporatura,
 * stile di capelli, maglia ed effetti. Qui sotto ci sono solo le regole del
 * disegno, nessun personaggio specifico.
 *
 * La cella è 32 × 56 px e i piedi stanno a `CELL_BOTTOM_INSET` dal bordo
 * inferiore: l'altezza extra sopra la testa serve a farci stare capelli e
 * berretti anche sul personaggio più alto (`build.height` 1.15) senza tagli.
 */
export const CHARACTER_FRAME_WIDTH = 32;
export const CHARACTER_FRAME_HEIGHT = 56;
export const CELL_BOTTOM_INSET = 3;
export const FRAMES_PER_ROW = 4;
export const CHARACTER_FACINGS = ['down', 'left', 'right', 'up'];
export const WALK_FRAME_RATE = 9;

const HEAD_OFFSET = -32;
const HEAD_RADIUS = 7;
const TORSO_TOP = -26;
const TORSO_HEIGHT = 15;
const TORSO_WIDTH = 16;
const LEG_TOP = -12;
const LEG_HEIGHT = 10;
const LEG_WIDTH = 6;
const SHOE_TOP = -3;
const SHOE_HEIGHT = 3;
const SHOE_WIDTH = 7;
const ARM_TOP = -24;
const ARM_HEIGHT = 9;
const ARM_WIDTH = 4;
const ARM_REACH = 9;
const HAND_HEIGHT = 3;
const SWING = 2.6;
const SHOULDER_TILT = 0.7;

/**
 * I JSON e `shade` danno i colori come stringhe `#rrggbb`, mentre le primitive
 * di Phaser vogliono numeri: passare la stringa direttamente produce una tinta
 * `NaN` e la cella esce completamente vuota.
 */
function tint(color) {
  return typeof color === 'number' ? color : Phaser.Display.Color.HexStringToColor(color).color;
}

function fillRounded(g, x, y, w, h, r, color, alpha = 1) {
  g.fillStyle(tint(color), alpha);
  g.fillRoundedRect(x, y, w, h, r);
}

function fillRect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(tint(color), alpha);
  g.fillRect(x, y, w, h);
}

function fillCircle(g, x, y, r, color, alpha = 1) {
  g.fillStyle(tint(color), alpha);
  g.fillCircle(x, y, r);
}

function fillEllipse(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(tint(color), alpha);
  g.fillEllipse(x, y, w, h);
}

function fillQuad(g, points, color, alpha = 1) {
  g.fillStyle(tint(color), alpha);
  g.fillPoints(points, true);
}

/** Dove si trova la testa rispetto ai piedi, e in che direzione guarda. */
function headContext(cx, feetY, facing) {
  const dir = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;

  return {
    cx,
    headY: feetY + HEAD_OFFSET,
    dir,
    back: -dir,
    profile: facing === 'left' || facing === 'right',
    away: facing === 'up',
    radius: HEAD_RADIUS
  };
}

/** Helper per coordinate speculari esatte in profilo (garantisce simmetria perfetta tra sinistra e destra). */
function profileRect(g, cx, dir, offset, y, w, h, color, alpha = 1) {
  const x = dir === 1 ? cx + offset : cx - offset - w;
  fillRect(g, x, y, w, h, color, alpha);
}

function profileRounded(g, cx, dir, offset, y, w, h, r, color, alpha = 1) {
  const x = dir === 1 ? cx + offset : cx - offset - w;
  fillRounded(g, x, y, w, h, r, color, alpha);
}

function profileCircle(g, cx, dir, offset, y, r, color, alpha = 1) {
  const x = cx + dir * offset;
  fillCircle(g, x, y, r, color, alpha);
}

function profileEllipse(g, cx, dir, offset, y, rx, ry, color, alpha = 1) {
  const x = cx + dir * offset;
  fillEllipse(g, x, y, rx, ry, color, alpha);
}

/** Il collo: fascia di pelle fra torso e testa. */
function drawNeck(g, head, look) {
  fillRect(g, head.cx - 2.5, head.headY + 4, 5, 5, look.skinShade);
}

function drawLegsFrontBack(g, cx, feetY, look, legLeft, legRight) {
  const bare = look.outfitStyle === 'dress';
  const color = bare ? look.skin : look.pants;

  fillRounded(g, cx - 7, feetY + LEG_TOP + legRight, LEG_WIDTH, LEG_HEIGHT, 2, color);
  fillRounded(g, cx + 1, feetY + LEG_TOP + legLeft, LEG_WIDTH, LEG_HEIGHT, 2, color);

  if (!bare) {
    fillRounded(g, cx - 7, feetY + LEG_TOP + legRight, LEG_WIDTH, LEG_HEIGHT, 2, look.pantsShade, 0.35);
  }

  fillRect(g, cx - 7.5, feetY + SHOE_TOP + legRight, SHOE_WIDTH, SHOE_HEIGHT, look.shoes);
  fillRect(g, cx + 0.5, feetY + SHOE_TOP + legLeft, SHOE_WIDTH, SHOE_HEIGHT, look.shoes);
  fillRect(g, cx - 7.5, feetY + SHOE_TOP + legRight, SHOE_WIDTH, 1, look.shoeLight, 0.45);
  fillRect(g, cx + 0.5, feetY + SHOE_TOP + legLeft, SHOE_WIDTH, 1, look.shoeLight, 0.45);
}

function drawTorsoFrontBack(g, cx, feetY, look, bob, away) {
  const top = feetY + TORSO_TOP + bob;
  const left = cx - TORSO_WIDTH / 2;

  fillRounded(g, left, top, TORSO_WIDTH, TORSO_HEIGHT, 4, look.shirt);
  fillRect(g, left, top, TORSO_WIDTH, 2, look.shirtLight, 0.7);

  if (look.outfitStyle === 'hoodie') {
    fillRounded(g, left - 1, top - 3, TORSO_WIDTH + 2, 6, 3, look.shirtShade);
    fillRounded(g, left + 2, top + 8, TORSO_WIDTH - 4, 5, 2, look.shirtShade, 0.8);
    fillRect(g, cx - 3, top + 3, 1.4, 5, look.shirtLight, 0.9);
    fillRect(g, cx + 2, top + 3, 1.4, 5, look.shirtLight, 0.9);
  } else if (look.outfitStyle === 'jacket') {
    fillRounded(g, left - 1.5, top, 5, TORSO_HEIGHT, 3, look.shirtShade);
    fillRounded(g, cx + TORSO_WIDTH / 2 - 3.5, top, 5, TORSO_HEIGHT, 3, look.shirtShade);
    fillRect(g, cx - 1, top, 2, TORSO_HEIGHT, look.shirtShade, 0.9);
    fillRounded(g, cx - 4, top - 2, 8, 3, 1.5, look.shirtLight, 0.5);
  } else if (look.outfitStyle === 'sleeveless') {
    fillRounded(g, left, top, TORSO_WIDTH, 2, 1, look.skinShade, 0.35);
  } else {
    // T-shirt: logo Jackanal bianco sul petto a sinistra (altezza cuore)
    if (!away) {
      fillRect(g, cx + 1.5, top + 4, 3, 2.5, 0xffffff, 0.95);
      fillRect(g, cx + 2, top + 6.5, 2, 1, 0xffffff, 0.9);
      fillRect(g, cx + 2.5, top + 5, 1, 1, tint(look.shirt));
    }
  }

  if (look.outfitStyle === 'dress') {
    fillQuad(
      g,
      [
        { x: cx - 7, y: top + TORSO_HEIGHT - 3 },
        { x: cx + 7, y: top + TORSO_HEIGHT - 3 },
        { x: cx + 10, y: feetY - 6 },
        { x: cx - 10, y: feetY - 6 }
      ],
      look.shirt
    );
    fillRect(g, cx - 10, feetY - 7, 20, 2, look.shirtShade, 0.7);
    fillRect(g, cx - 7, top + TORSO_HEIGHT - 3, 14, 2, look.shirtShade, 0.5);
  }
}

function drawArmsFrontBack(g, cx, feetY, look, bob, legLeft, legRight) {
  const top = feetY + ARM_TOP + bob;
  const sleeveless = look.outfitStyle === 'sleeveless';
  const armColor = sleeveless ? look.skin : look.shirtShade;

  for (const [side, swing] of [
    [-1, legLeft],
    [1, legRight]
  ]) {
    const x = cx + side * ARM_REACH - ARM_WIDTH / 2;
    const y = top + swing * SHOULDER_TILT;

    if (sleeveless) {
      fillRect(g, x, y, ARM_WIDTH, 3, look.shirt);
    }

    fillRounded(g, x, y + 2, ARM_WIDTH, ARM_HEIGHT - 2, 2, armColor);
    fillRect(g, x, y + ARM_HEIGHT - 1, ARM_WIDTH, HAND_HEIGHT, look.skin);
  }
}

function drawFace(g, head, look) {
  if (head.away) {
    return;
  }

  if (head.profile) {
    profileRect(g, head.cx, head.dir, 5, head.headY - 1, 2, 2.5, look.skin);
    profileRect(g, head.cx, head.dir, 2.5, head.headY - 2, 2, 2, look.eye);
    profileRect(g, head.cx, head.dir, 3, head.headY + 2.5, 2.5, 1.5, look.skinShade, 0.5);
    profileCircle(g, head.cx, head.dir, -2.5, head.headY + 0.5, 2, look.skinShade, 0.8);
    return;
  }

  fillRect(g, head.cx - 4, head.headY - 2, 2, 2, look.eye);
  fillRect(g, head.cx + 2, head.headY - 2, 2, 2, look.eye);
  fillRect(g, head.cx - 2, head.headY + 3, 4, 1, look.skinShade, 0.85);
  fillRect(g, head.cx - 3.5, head.headY + 1, 7, 1, look.skinShade, 0.25);
}

/** Stili di capelli: ognuno riceve il contesto della testa e la palette risolta. */
const HAIR_DRAWERS = {
  short(g, head, look) {
    if (head.away) {
      fillCircle(g, head.cx, head.headY, 7.2, look.hair);
      fillCircle(g, head.cx - 3, head.headY + 3, 2.4, look.hair);
      return;
    }

    if (head.profile) {
      profileCircle(g, head.cx, head.dir, -1.5, head.headY - 1, 6.6, look.hair);
      profileRounded(g, head.cx, head.dir, -6.5, head.headY - 8, 8, 5, 2, look.hair);
      profileRect(g, head.cx, head.dir, -6.5, head.headY - 8, 8, 1.5, look.hairShade);
      profileRect(g, head.cx, head.dir, 1.5, head.headY - 7.5, 3.5, 3, look.hair);
      profileRect(g, head.cx, head.dir, -1, head.headY - 2, 2, 4.5, look.hair);
      return;
    }

    fillRect(g, head.cx - 7, head.headY - 8, 14, 7, look.hair);
    fillRect(g, head.cx - 7, head.headY - 8, 14, 2, look.hairShade);
    fillRect(g, head.cx - 7.5, head.headY - 2, 3, 5, look.hair);
    fillRect(g, head.cx + 4.5, head.headY - 2, 3, 5, look.hair);
  },

  bald(g, head, look) {
    if (head.profile) {
      profileCircle(g, head.cx, head.dir, 0.5, head.headY, 6.9, look.skin);
      return;
    }
    fillCircle(g, head.cx, head.headY, 6.9, look.skin, 1);
  },

  long(g, head, look) {
    if (head.away) {
      fillCircle(g, head.cx, head.headY - 1, 7.8, look.hair);
      fillRounded(g, head.cx - 8, head.headY, 16, 18, 5, look.hair);
      fillRect(g, head.cx - 8, head.headY, 16, 2, look.hairShade, 0.6);
      return;
    }

    if (head.profile) {
      profileRounded(g, head.cx, head.dir, -6, head.headY - 7, 9, 20, 4, look.hair);
      profileCircle(g, head.cx, head.dir, -2, head.headY - 0.5, 7, look.hair);
      profileRect(g, head.cx, head.dir, 2, head.headY - 7, 3.5, 6, look.hair);
      return;
    }

    fillRounded(g, head.cx - 8, head.headY - 6, 4, 20, 2, look.hair);
    fillRounded(g, head.cx + 4, head.headY - 6, 4, 20, 2, look.hair);
    fillRect(g, head.cx - 7, head.headY - 8, 14, 7, look.hair);
    fillRect(g, head.cx - 7, head.headY - 8, 14, 2, look.hairShade);
  },

  bun(g, head, look) {
    HAIR_DRAWERS.short(g, head, look);
    if (head.profile) {
      profileCircle(g, head.cx, head.dir, -4.5, head.headY - 7.5, 3.5, look.hair);
      profileCircle(g, head.cx, head.dir, -5, head.headY - 8, 1.5, look.hairShade, 0.6);
      return;
    }
    fillCircle(g, head.cx - head.back * 1.5, head.headY - 9, 3.4, look.hair);
    fillCircle(g, head.cx - head.back * 2.2, head.headY - 9.6, 1.4, look.hairShade, 0.6);
  },

  ponytail(g, head, look) {
    HAIR_DRAWERS.short(g, head, look);
    if (head.profile) {
      profileEllipse(g, head.cx, head.dir, -7.5, head.headY + 2, 5, 12, look.hair);
      profileRect(g, head.cx, head.dir, -6, head.headY - 3, 2.5, 3, look.shirtLight, 0.6);
      return;
    }
    fillEllipse(g, head.cx + head.back * 7, head.headY + 2, 5, 11, look.hair);
    fillRect(g, head.cx + head.back * 6, head.headY - 4, 2.5, 3, look.shirtLight, 0.55);
  },

  curly(g, head, look) {
    HAIR_DRAWERS.short(g, head, look);
    if (head.profile) {
      const curls = [
        { ox: -6, oy: -3 },
        { ox: -5, oy: -7 },
        { ox: -2, oy: -9 },
        { ox: 1.5, oy: -8.5 },
        { ox: 4, oy: -5.5 }
      ];
      for (const c of curls) {
        profileCircle(g, head.cx, head.dir, c.ox, head.headY + c.oy, 2.6, look.hair);
      }
      return;
    }
    for (let i = 0; i < 7; i += 1) {
      const angle = Math.PI + (i / 6) * Math.PI;
      fillCircle(
        g,
        head.cx + Math.cos(angle) * 7,
        head.headY + Math.sin(angle) * 7,
        2.6,
        look.hair
      );
    }
  }
};

/** Veli, strumenti e accessori: disegnati sopra capelli e testa. */
const EFFECT_DRAWERS = {
  glasses(g, head, effect) {
    if (head.away) {
      return;
    }

    if (head.profile) {
      profileRect(g, head.cx, head.dir, 1.5, head.headY - 2, 3.5, 3, effect.color);
      profileRect(g, head.cx, head.dir, -2.5, head.headY - 2, 4.5, 1.2, effect.color, 0.85);
      return;
    }

    fillRect(g, head.cx - 5, head.headY - 2.5, 4, 3.5, effect.color);
    fillRect(g, head.cx + 1, head.headY - 2.5, 4, 3.5, effect.color);
    fillRect(g, head.cx - 1.5, head.headY - 2, 3, 1.5, effect.color);
    fillRect(g, head.cx - 5, head.headY - 2, 3.5, 1, 0xffffff, 0.35);
    fillRect(g, head.cx + 1, head.headY - 2, 3.5, 1, 0xffffff, 0.35);
  },

  beard(g, head, effect, look) {
    if (head.away) {
      return;
    }

    const isLong = effect.length === 'long' || effect.type === 'beard_long';

    if (head.profile) {
      profileRounded(g, head.cx, head.dir, 0.5, head.headY + 1, isLong ? 7.5 : 6.5, isLong ? 10.5 : 7, 3, effect.color);
      if (isLong) {
        profileRounded(g, head.cx, head.dir, 1, head.headY + 5.5, 6, 4, 2, effect.color);
      }
      profileRect(g, head.cx, head.dir, 2.5, head.headY + 2.5, 2.5, 1.5, look?.skinShade ?? 0xd09a72);
      profileRect(g, head.cx, head.dir, 3.5, head.headY + 3, 1.5, 0.8, 0x8a3830, 0.9);
      return;
    }

    fillRounded(g, head.cx - 5.5, head.headY + 1, 11, isLong ? 11 : 7, 3.5, effect.color);
    if (isLong) {
      fillRounded(g, head.cx - 4, head.headY + 5.5, 8, 4.5, 2.5, effect.color);
    }
    fillRounded(g, head.cx - 2, head.headY + 2.5, 4, 1.8, 0.8, look?.skinShade ?? 0xd09a72);
    fillRect(g, head.cx - 1.5, head.headY + 3, 3, 0.8, 0x8a3830, 0.95);
  },

  mustache(g, head, effect) {
    if (head.away) {
      return;
    }

    if (head.profile) {
      profileRounded(g, head.cx, head.dir, 1.5, head.headY + 1.5, 4, 2, 1, effect.color);
      return;
    }

    fillRounded(g, head.cx - 2.5, head.headY + 1.5, 5, 2, 1, effect.color);
  },

  hat(g, head, effect) {
    const isCoppola = effect.style === 'coppola' || effect.style === 'flat_cap';

    if (head.profile) {
      const h = isCoppola ? 6.5 : 9;
      profileRounded(g, head.cx, head.dir, -5.5, head.headY - (isCoppola ? 8 : 10), 12.5, h, 2.5, effect.color);
      profileRect(g, head.cx, head.dir, -5.5, head.headY - 2.5, 12.5, 2, effect.shade);
      profileRect(g, head.cx, head.dir, 4.5, head.headY - 2.5, isCoppola ? 4.5 : 3.5, 1.8, effect.shade);
      profileRect(g, head.cx, head.dir, -4.5, head.headY - (isCoppola ? 7.5 : 9), 10, 1.2, 0xffffff, 0.18);
      return;
    }

    const h = isCoppola ? 7 : 9;
    fillRounded(g, head.cx - (isCoppola ? 8.5 : 7.5), head.headY - (isCoppola ? 8.5 : 10), isCoppola ? 17 : 15, h, 3, effect.color);
    fillRect(g, head.cx - (isCoppola ? 8.5 : 8), head.headY - 2.5, isCoppola ? 17 : 16, 2, effect.shade);
    if (isCoppola) {
      fillRect(g, head.cx - 4.5, head.headY - 2.8, 9, 1.8, effect.shade);
    }
    fillRect(g, head.cx - 7, head.headY - (isCoppola ? 8 : 9), 14, 1.5, 0xffffff, 0.18);
  },

  headphones(g, head, effect) {
    if (head.profile) {
      // Archetto cuffie verso la sommità della testa
      profileRounded(g, head.cx, head.dir, -4, head.headY - 9, 3, 9, 1.5, effect.color);
      // Padiglione auricolare sul centro dell'orecchio
      profileRounded(g, head.cx, head.dir, -4.5, head.headY - 3, 4.5, 8, 2, effect.color);
      profileRounded(g, head.cx, head.dir, -4, head.headY - 2, 3, 6, 1.5, effect.shade, 0.85);
      return;
    }
    g.lineStyle(2.4, tint(effect.color), 1);
    g.beginPath();
    g.arc(head.cx, head.headY, 8.6, Math.PI, Math.PI * 2);
    g.strokePath();

    fillRounded(g, head.cx - 10, head.headY - 2, 4, 7, 1.5, effect.color);
    fillRounded(g, head.cx + 6, head.headY - 2, 4, 7, 1.5, effect.color);
    fillRounded(g, head.cx - 9, head.headY - 1, 2, 5, 1, effect.shade, 0.8);
    fillRounded(g, head.cx + 7, head.headY - 1, 2, 5, 1, effect.shade, 0.8);
  },

  scarf(g, head, effect) {
    if (head.profile) {
      profileRounded(g, head.cx, head.dir, -4.5, head.headY + 6.5, 10, 6, 2.5, effect.color);
      profileRect(g, head.cx, head.dir, -4.5, head.headY + 11, 4, 8, 1.5, effect.color);
      return;
    }
    fillRounded(g, head.cx - 7, head.headY + 6.5, 14, 6, 2.5, effect.color);
    fillRect(g, head.cx - 7, head.headY + 6.5, 14, 1.5, effect.shade, 0.6);
    fillRounded(g, head.cx + 3, head.headY + 11, 4, 9, 1.5, effect.color);
  },

  strap(g, head, effect) {
    if (head.profile) {
      profileRect(g, head.cx, head.dir, -1.5, head.headY + 7, 3.2, 17, effect.color);
      profileRect(g, head.cx, head.dir, -1.5, head.headY + 7, 1, 17, effect.shade, 0.7);
      return;
    }
    fillQuad(
      g,
      [
        { x: head.cx - 7, y: head.headY + 7 },
        { x: head.cx - 2.5, y: head.headY + 7 },
        { x: head.cx + 8, y: head.headY + 24 },
        { x: head.cx + 3.5, y: head.headY + 24 }
      ],
      effect.color
    );
    fillQuad(
      g,
      [
        { x: head.cx - 7, y: head.headY + 7 },
        { x: head.cx - 2.5, y: head.headY + 7 },
        { x: head.cx - 4, y: head.headY + 9 },
        { x: head.cx - 7.5, y: head.headY + 9 }
      ],
      effect.shade,
      0.8
    );
  }
};

function drawHead(g, head, look) {
  if (head.profile) {
    profileCircle(g, head.cx, head.dir, 0.5, head.headY, head.radius, look.skin);
    profileCircle(g, head.cx, head.dir, -1, head.headY + 2.5, 4, look.skinShade, 0.18);
  } else {
    fillCircle(g, head.cx, head.headY, head.radius, look.skin);

    if (head.away) {
      fillCircle(g, head.cx, head.headY + 4, 5, look.skinShade, 0.35);
    } else {
      fillCircle(g, head.cx - 2.5, head.headY + 2.5, 4.5, look.skinShade, 0.18);
    }
  }

  const drawer = HAIR_DRAWERS[look.hairStyle] ?? HAIR_DRAWERS.short;
  drawer(g, head, look);
  drawFace(g, head, look);
}

function drawEffects(g, head, look) {
  for (const effect of look.effects) {
    const drawer = EFFECT_DRAWERS[effect.type];

    if (!drawer) {
      console.warn(`[characterArt] nessun disegno per l'effetto "${effect.type}"`);
      continue;
    }

    drawer(g, head, effect, look);
  }
}

/** Disegna il personaggio in vista laterale (profilo sinistro o destro). */
function drawProfileCell(g, cx, feetY, look, head, phase, bob) {
  const dir = head.dir;
  const legSwing = Math.sin(phase) * 5;
  const armSwing = Math.sin(phase) * 4;
  const top = feetY + TORSO_TOP + bob;
  const bare = look.outfitStyle === 'dress';
  const sleeveless = look.outfitStyle === 'sleeveless';

  // 1. Braccio posteriore (far arm) - oscilla in senso opposto alla gamba anteriore
  const backArmOffset = -2.5 - armSwing * 0.7;
  const backArmY = top + 1 + Math.abs(armSwing) * 0.2;
  profileRounded(g, cx, dir, backArmOffset, backArmY, 4, 7, 2, sleeveless ? look.skinShade : look.shirtShade);
  if (sleeveless) {
    profileRect(g, cx, dir, backArmOffset, backArmY, 4, 2, look.shirtShade);
  }
  profileRect(g, cx, dir, backArmOffset, backArmY + 6.5, 4, 2.5, look.skinShade);

  // 2. Gamba posteriore (far leg) - oscilla indietro quando la gamba anteriore va avanti
  const backLegOffset = -3 - legSwing * 0.8;
  const backLegColor = bare ? look.skinShade : look.pantsShade;
  profileRounded(g, cx, dir, backLegOffset, feetY + LEG_TOP, 5.5, 10, 2, backLegColor);
  // Scarpa posteriore rivolta in direzione dir
  profileRect(g, cx, dir, backLegOffset - 0.5, feetY + SHOE_TOP, 8.5, 3, look.shoes);

  // 3. Collo
  profileRect(g, cx, dir, -2, head.headY + 4, 4.5, 5, look.skinShade);

  // 4. Gamba anteriore (near leg)
  const frontLegOffset = -3 + legSwing * 0.8;
  const frontLegColor = bare ? look.skin : look.pants;
  profileRounded(g, cx, dir, frontLegOffset, feetY + LEG_TOP, 5.5, 10, 2, frontLegColor);
  if (!bare) {
    profileRounded(g, cx, dir, frontLegOffset, feetY + LEG_TOP, 5.5, 10, 2, look.pantsShade, 0.25);
  }
  // Scarpa anteriore rivolta in direzione dir
  profileRect(g, cx, dir, frontLegOffset - 0.5, feetY + SHOE_TOP, 8.5, 3, look.shoes);
  profileRect(g, cx, dir, frontLegOffset - 0.5, feetY + SHOE_TOP, 8.5, 1, look.shoeLight, 0.45);

  // 5. Torso in profilo
  profileRounded(g, cx, dir, -5.5, top, 11, TORSO_HEIGHT, 3.5, look.shirt);
  profileRect(g, cx, dir, -4.5, top, 9, 2, look.shirtLight, 0.7);
  profileRect(g, cx, dir, -5.5, top, 2, TORSO_HEIGHT, look.shirtShade, 0.45);

  if (look.outfitStyle === 'hoodie') {
    profileRounded(g, cx, dir, -7.5, top - 1, 4.5, 7, 2, look.shirtShade);
    profileRounded(g, cx, dir, -1.5, top + 8, 7, 5, 2, look.shirtShade, 0.8);
  } else if (look.outfitStyle === 'jacket') {
    profileRect(g, cx, dir, 2.5, top, 3, TORSO_HEIGHT, look.shirtShade, 0.85);
    profileRect(g, cx, dir, 4, top, 1.5, TORSO_HEIGHT, look.shirtLight, 0.7);
  } else if (look.outfitStyle === 'sleeveless') {
    profileRounded(g, cx, dir, -3, top, 6, 3, 1.5, look.skinShade, 0.4);
  } else {
    // Logo bianco sul petto in vista di profilo
    profileRect(g, cx, dir, 1, top + 4, 2.5, 2.5, 0xffffff, 0.95);
    profileRect(g, cx, dir, 1.5, top + 6.5, 1.5, 1, 0xffffff, 0.9);
  }

  if (look.outfitStyle === 'dress') {
    const quad = [
      { x: dir === 1 ? cx - 5.5 : cx + 5.5, y: top + TORSO_HEIGHT - 3 },
      { x: dir === 1 ? cx + 5.5 : cx - 5.5, y: top + TORSO_HEIGHT - 3 },
      { x: dir === 1 ? cx + 8.5 : cx - 8.5, y: feetY - 6 },
      { x: dir === 1 ? cx - 7.5 : cx + 7.5, y: feetY - 6 }
    ];
    fillQuad(g, quad, look.shirt);
    profileRect(g, cx, dir, -7.5, feetY - 7, 16, 2, look.shirtShade, 0.7);
  }

  // 6. Braccio anteriore (near arm) - in primo piano sul torso
  const frontArmOffset = -2 + armSwing * 0.7;
  const frontArmY = top + 1 - Math.abs(armSwing) * 0.2;
  profileRounded(g, cx, dir, frontArmOffset, frontArmY, 4, 7, 2, sleeveless ? look.skin : look.shirt);
  if (sleeveless) {
    profileRect(g, cx, dir, frontArmOffset, frontArmY, 4, 2, look.shirt);
  }
  profileRect(g, cx, dir, frontArmOffset, frontArmY + 6.5, 4, 2.5, look.skin);

  // 7. Testa
  drawHead(g, head, look);

  // 8. Effetti/Accessori
  drawEffects(g, head, look);
}

/** Disegna il personaggio in vista frontale o dorsale. */
function drawFrontBackCell(g, cx, feetY, look, head, phase, bob) {
  const legLeft = Math.sin(phase) * SWING;
  const legRight = -legLeft;

  drawNeck(g, head, look);
  drawLegsFrontBack(g, cx, feetY, look, legLeft, legRight);
  drawTorsoFrontBack(g, cx, feetY, look, bob, head.away);
  drawArmsFrontBack(g, cx, feetY, look, bob, legLeft, legRight);
  drawHead(g, head, look);
  drawEffects(g, head, look);
}

/**
 * Disegna una cella del foglio: `facing` è una delle quattro direzioni e `phase`
 * è l'angolo dell'animazione (0 = fermo in piedi).
 */
export function drawCharacterCell(g, cx, feetY, look, facing, phase) {
  const bob = Math.abs(Math.cos(phase));
  const head = headContext(cx, feetY, facing);

  g.save();
  g.translateCanvas(cx, feetY);
  g.scaleCanvas(look.build.width, look.build.height);
  g.translateCanvas(-cx, -feetY);

  if (head.profile) {
    drawProfileCell(g, cx, feetY, look, head, phase, bob);
  } else {
    drawFrontBackCell(g, cx, feetY, look, head, phase, bob);
  }

  g.restore();
}

/** Genera il foglio 4 direzioni × 4 frame del personaggio, se non esiste già. */
export function createCharacterTexture(scene, character) {
  const key = characterTextureKey(character.id);

  if (scene.textures.exists(key)) {
    return key;
  }

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const look = resolveLook(character);

  for (let row = 0; row < CHARACTER_FACINGS.length; row += 1) {
    for (let col = 0; col < FRAMES_PER_ROW; col += 1) {
      const cx = col * CHARACTER_FRAME_WIDTH + CHARACTER_FRAME_WIDTH / 2;
      const feetY = row * CHARACTER_FRAME_HEIGHT + CHARACTER_FRAME_HEIGHT - CELL_BOTTOM_INSET;
      const phase = col === 0 ? 0 : (col / FRAMES_PER_ROW) * Math.PI * 2;

      drawCharacterCell(g, cx, feetY, look, CHARACTER_FACINGS[row], phase);
    }
  }

  g.generateTexture(key, CHARACTER_FRAME_WIDTH * FRAMES_PER_ROW, CHARACTER_FRAME_HEIGHT * CHARACTER_FACINGS.length);
  g.clear();
  g.destroy();

  const texture = scene.textures.get(key);
  const total = CHARACTER_FACINGS.length * FRAMES_PER_ROW;

  for (let index = 0; index < total; index += 1) {
    const col = index % FRAMES_PER_ROW;
    const row = Math.floor(index / FRAMES_PER_ROW);

    texture.add(
      index,
      0,
      col * CHARACTER_FRAME_WIDTH,
      row * CHARACTER_FRAME_HEIGHT,
      CHARACTER_FRAME_WIDTH,
      CHARACTER_FRAME_HEIGHT
    );
  }

  return key;
}

/**
 * Le quattro fasi del foglio sono `[0, +SWING, 0, -SWING]`: la cella 0 è la
 * posizione ferma e le altre tre sono i due passi e il passaggio centrale.
 * Perciò la camminata parte dalla cella 1 e torna sulla 2 prima di ripetere:
 * senza quel ritorno al centro il ciclo zoppica, perché il primo e l'ultimo
 * frame sono due pose di contatto opposte.
 */
const WALK_FRAME_SEQUENCE = [1, 2, 3, 2];

/** Crea `character-<id>-idle-<facing>` e `character-<id>-walk-<facing>`. */
export function createCharacterAnimations(scene, character) {
  const id = character.id;
  const texture = characterTextureKey(id);

  CHARACTER_FACINGS.forEach((facing, row) => {
    const base = row * FRAMES_PER_ROW;
    const idleKey = characterAnimKey(id, 'idle', facing);
    const walkKey = characterAnimKey(id, 'walk', facing);

    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: WALK_FRAME_SEQUENCE.map((step) => ({ key: texture, frame: base + step })),
        frameRate: WALK_FRAME_RATE,
        repeat: -1
      });
    }

    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key: texture, frame: base }],
        frameRate: 1,
        repeat: -1
      });
    }
  });
}

/** Entry point unico: foglio + animazioni di un personaggio. */
export function ensureCharacterAssets(scene, character) {
  createCharacterTexture(scene, character);
  createCharacterAnimations(scene, character);
}
