import Phaser from 'phaser';
import { createAvatarTextures, createPropsTextures, createSoftTextures } from '../gfx/textureFactory.js';
import { ensureCharacterAssets } from '../gfx/characterArt.js';
import { listPlayableCharacters } from '../game/characters.js';
import { Events, emit } from '../core/eventBus.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('logo-bianco', 'logo-bianco.svg');
  }

  create() {
    createPropsTextures(this);
    createSoftTextures(this);
    createAvatarTextures(this);

    for (const character of listPlayableCharacters()) {
      ensureCharacterAssets(this, character);
    }

    emit(Events.BOOT_READY, { textures: this.textures.getTextureKeys().length });

    this.scene.start('CharacterSelect');
  }
}
