import Phaser from 'phaser';
import { createCharacterAnimations, createProceduralTextures } from '../gfx/textureFactory.js';
import { Events, emit } from '../core/eventBus.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createProceduralTextures(this);
    createCharacterAnimations(this);

    emit(Events.BOOT_READY, { textures: this.textures.getTextureKeys().length });

    this.scene.launch('Hud');
    this.scene.start('Room', { roomId: this.registry.get('currentRoomId') });
  }
}