import Phaser from 'phaser';
import { propFootprint, propHasShadow, propTexture } from '../game/propTypes.js';

export default class Prop extends Phaser.GameObjects.Container {
  constructor(scene, data, layout) {
    super(scene, data.x * layout.tileSize, data.y * layout.tileSize);

    this.propData = data;
    this.type = data.type;
    this.variant = data.variant ?? null;
    this.label = data.label ?? data.type;
    this.description = data.description ?? '';
    this.prompt = data.prompt ?? 'Esamina';
    this.options = Array.isArray(data.options) ? data.options : null;
    this.nodes = data.nodes && typeof data.nodes === 'object' ? data.nodes : null;
    this.footprint = propFootprint(data.type, this.variant);
    this.solid = null;

    const texture = propTexture(data.type, this.variant);
    const hasShadow = data.shadow ?? propHasShadow(data.type, this.variant);
    const shadowWidth = this.footprint ? this.footprint.w * 0.82 : 26;

    this.shadow = scene.add.image(0, -2, 'soft-shadow');
    this.shadow.setDisplaySize(shadowWidth, Math.max(8, shadowWidth * 0.3));
    this.shadow.setTint(0x000000);
    this.shadow.setAlpha(0.32);
    if (!hasShadow) {
      this.shadow.setVisible(false);
    }

    this.visual = scene.add.image(0, 0, texture).setOrigin(0.5, 1);

    this.add([this.shadow, this.visual]);

    if (this.type === 'drum-kit' && scene.textures.exists('logo-blu')) {
      // Center of bass drum head is (78, 82) on 168x124 canvas.
      // Relative to origin (0.5, 1): x = 78 - 84 = -6, y = 82 - 124 = -42
      this.logo = scene.add.image(-6, -42, 'logo-blu');
      this.logo.setDisplaySize(36, 42);
      this.add(this.logo);
    }

    scene.add.existing(this);
    this.setDepthByPosition();

    if (this.footprint) {
      const { w, h } = this.footprint;
      this.solid = scene.add.rectangle(this.x, this.y - h / 2, w, h, 0xffffff, 0);
      scene.physics.add.existing(this.solid, true);
      this.solid.setVisible(false);
    }
  }

  setDepthByPosition() {
    this.setDepth(this.y);
  }

  hasOptions() {
    return Array.isArray(this.options) && this.options.length > 0;
  }

  describe() {
    return {
      speaker: this.label,
      text: this.description,
      prompt: this.prompt
    };
  }
}