import Phaser from 'phaser';
import { createAvatarTextures, createPropsTextures, createSoftTextures } from '../gfx/textureFactory.js';
import { ensureCharacterAssets } from '../gfx/characterArt.js';
import { LOGO_BLUE_DATA } from '../data/avatars.js';
import { listPlayableCharacters } from '../game/characters.js';
import { Events, emit } from '../core/eventBus.js';

function loadDataImage(textures, key, dataUri, filter = Phaser.Textures.NEAREST) {
  return new Promise((resolve) => {
    if (textures.exists(key)) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      const texture = textures.addImage(key, img);
      if (texture) {
        texture.setFilter(filter);
        for (const source of texture.source) {
          source.scaleMode = filter;
        }
      }
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = dataUri;
  });
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create() {
    if (this.game.renderer && this.game.renderer.config) {
      this.game.renderer.config.antialias = true;
    }
    await loadDataImage(this.textures, 'logo-blu', LOGO_BLUE_DATA, Phaser.Textures.LINEAR);

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
