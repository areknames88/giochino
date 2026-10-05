import Phaser from 'phaser';
import { createPropsTextures, createSoftTextures } from '../gfx/textureFactory.js';
import { ensureCharacterAssets } from '../gfx/characterArt.js';
import { listPlayableCharacters } from '../game/characters.js';
import { Events, emit } from '../core/eventBus.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createPropsTextures(this);
    createSoftTextures(this);

    for (const character of listPlayableCharacters()) {
      ensureCharacterAssets(this, character);
    }

    emit(Events.BOOT_READY, { textures: this.textures.getTextureKeys().length });

    this.scene.start('CharacterSelect');
  }
}
