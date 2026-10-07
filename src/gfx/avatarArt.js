/**
 * Generatore di avatar a runtime che riutilizza DIRETTAMENTE drawCharacterCell
 * da characterArt.js: i volti e i busti degli avatar sono identici al 100%
 * a quelli del gioco (confronto diretto con Screenshot.png e Davide e Marco.png).
 * Zero immagini statiche, rendering pixel-art retrò con texture filter NEAREST.
 */

import Phaser from 'phaser';
import { resolveLook } from '../game/characters.js';
import { drawCharacterCell } from './characterArt.js';

/**
 * Crea la texture dell'avatar per il personaggio usando la grafica originale del gioco.
 */
export function createAvatarTexture(scene, key, size, character) {
  const look = resolveLook(character);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // 1. Sfondo sala prove retrò
  g.fillStyle(0x150e08, 1);
  g.fillRoundedRect(2, 2, size - 4, size - 4, 8);

  // Alone caldo vintage dietro la testa
  g.fillStyle(0x28180c, 0.75);
  g.fillCircle(size * 0.5, size * 0.42, size * 0.38);

  // 2. Disegno del busto del personaggio con drawCharacterCell originale del gioco
  const scale = 3.4;
  const cx = (size / scale) * 0.5;
  const feetY = 47.3;

  g.save();
  g.scaleCanvas(scale, scale);
  drawCharacterCell(g, cx, feetY, look, 'down', 0);
  g.restore();

  // 3. Cornice retrò a doppio profilo in ottone/oro antico
  g.lineStyle(3, 0x5c3818, 1);
  g.strokeRoundedRect(2, 2, size - 4, size - 4, 8);
  g.lineStyle(1.5, 0xc49d52, 1);
  g.strokeRoundedRect(4.5, 4.5, size - 9, size - 9, 6);

  // Genera la texture Phaser 128x128
  g.generateTexture(key, size, size);
  g.destroy();

  const texture = scene.textures.get(key);
  if (texture) {
    texture.setFilter(Phaser.Textures.NEAREST);
  }
}
