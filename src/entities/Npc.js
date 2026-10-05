import Phaser from 'phaser';
import { GAME } from '../config.js';
import { characterAnimKey, characterTextureKey, resolveLook } from '../game/characters.js';

const SHADOW_HEIGHT = 7;
const SHADOW_OFFSET_Y = -2;
const NPC_BODY_WIDTH = 20;
const NPC_BODY_HEIGHT = 12;

/**
 * Personaggio non giocante in stanza.
 * Mostra sprite, animazione idle nella direzione di spawn, ombra,
 * e targhetta del nome (con eventuale ruolo).
 * Si integra con InteractionSystem come un arredo parlante.
 */
export default class Npc extends Phaser.GameObjects.Container {
  constructor(scene, data, character, layout) {
    const x = data.x * layout.tileSize;
    const y = data.y * layout.tileSize;

    super(scene, x, y);

    this.data = data;
    this.character = character;
    this.look = resolveLook(character);
    this.facing = data.facing ?? 'down';
    this.label = character.name;
    this.prompt = 'Parla con';
    this.touchRadius = 42;
    this.footprint = { w: NPC_BODY_WIDTH, h: NPC_BODY_HEIGHT };

    const textureKey = characterTextureKey(character.id);
    const shadowScale = this.look.build?.width ?? 1;

    this.shadow = scene.add
      .image(0, SHADOW_OFFSET_Y, 'soft-shadow')
      .setDisplaySize(20 * shadowScale, SHADOW_HEIGHT)
      .setTint(0x000000)
      .setAlpha(0.3);

    this.sprite = scene.add
      .sprite(0, 0, textureKey, 0)
      .setOrigin(0.5, 1);

    const idleKey = characterAnimKey(character.id, 'idle', this.facing);
    if (scene.anims.exists(idleKey)) {
      this.sprite.play(idleKey);
    }

    const headTop = Math.round(50 * (this.look.build?.height ?? 1));

    this.nameText = scene.add
      .text(0, -headTop - 13, character.name, {
        fontFamily: GAME.font,
        fontSize: '11px',
        color: '#f0c27a',
        fontStyle: 'bold',
        stroke: '#140d07',
        strokeThickness: 3
      })
      .setOrigin(0.5, 1);

    this.roleText = scene.add
      .text(0, -headTop - 1, character.role ?? '', {
        fontFamily: GAME.font,
        fontSize: '9px',
        color: '#cbb399',
        fontStyle: 'normal',
        stroke: '#140d07',
        strokeThickness: 2
      })
      .setOrigin(0.5, 1);

    this.add([this.shadow, this.sprite, this.nameText, this.roleText]);
    scene.add.existing(this);
    this.setDepth(this.y);

    this.solid = scene.add.rectangle(
      this.x,
      this.y - this.footprint.h / 2,
      this.footprint.w,
      this.footprint.h,
      0xffffff,
      0
    );
    scene.physics.add.existing(this.solid, true);
    this.solid.setVisible(false);
  }

  describe() {
    const speaker = this.character.name;
    const lines = Array.isArray(this.character.lines) && this.character.lines.length > 0
      ? this.character.lines
      : [this.character.tagline ?? ''];

    return lines.map((text) => ({
      speaker,
      text,
      prompt: this.prompt
    }));
  }

  destroy(fromScene) {
    if (this.solid) {
      this.solid.destroy();
      this.solid = null;
    }

    super.destroy(fromScene);
  }
}
