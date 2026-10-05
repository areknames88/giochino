import Phaser from 'phaser';
import { Events, emit } from '../core/eventBus.js';

const TOUCH_PADDING = 14;
const DEFAULT_TOUCH_RADIUS = 34;

export default class InteractionSystem {
  constructor(scene, interactables, range) {
    this.scene = scene;
    this.interactables = interactables;
    this.range = range;
    this.current = null;
  }

  touchRadius(item) {
    if (typeof item.touchRadius === 'number') {
      return item.touchRadius;
    }

    if (!item.footprint) {
      return DEFAULT_TOUCH_RADIUS + TOUCH_PADDING;
    }

    const { w, h } = item.footprint;

    return Math.hypot(w, h) / 2 + TOUCH_PADDING;
  }

  nearest(origin) {
    let best = null;
    let bestDistance = this.range;

    for (const item of this.interactables) {
      const distance = Phaser.Math.Distance.Between(origin.x, origin.y, item.x, item.y);

      if (distance <= bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }

    return best;
  }

  hitTest(point) {
    let best = null;
    let bestDistance = Infinity;

    for (const item of this.interactables) {
      const distance = Phaser.Math.Distance.Between(point.x, point.y, item.x, item.y);

      if (distance <= this.touchRadius(item) && distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }

    return best;
  }

  update(origin) {
    const found = this.nearest(origin);

    if (found === this.current) {
      return;
    }

    this.current = found;

    if (found) {
      emit(Events.HINT_CHANGED, { prompt: found.prompt, label: found.label });
    } else {
      emit(Events.HINT_CHANGED, null);
    }
  }

  trigger(item = this.current) {
    if (!item) {
      return false;
    }

    const payload = item.describe();
    const pages = Array.isArray(payload) ? payload : [payload];

    for (const page of pages) {
      emit(Events.DIALOGUE_SAY, page);
    }

    return true;
  }
}