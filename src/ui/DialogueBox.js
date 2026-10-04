import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, on } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';

export default class DialogueBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height - 18);
    scene.add.existing(this);

    this.queue = [];
    this.current = null;
    this.visible = false;

    this.panel = scene.add.graphics();
    this.nameTab = scene.add.graphics();

    this.speaker = scene.add
      .text(0, 0, '', {
        fontFamily: GAME.font,
        fontSize: '19px',
        color: '#f0c27a',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.body = scene.add
      .text(0, 0, '', {
        fontFamily: GAME.font,
        fontSize: '17px',
        color: '#f2e6d2',
        lineSpacing: 7
      })
      .setOrigin(0, 0);

    this.continueMark = scene.add
      .text(0, 0, '▼', {
        fontFamily: GAME.font,
        fontSize: '13px',
        color: '#f0c27a'
      })
      .setOrigin(1, 1)
      .setAlpha(0);

    this.add([this.panel, this.nameTab, this.speaker, this.body, this.continueMark]);

    this.layout();
    this.setVisible(false);

    this.unsubscribe = [
      on(Events.DIALOGUE_SAY, (payload) => this.say(payload)),
      on(Events.DIALOGUE_ADVANCE, () => this.advance())
    ];

    scene.scale.on(Phaser.Scale.Events.RESIZE, () => this.layout());
  }

  layout() {
    const isPortrait = this.scene.scale.height > this.scene.scale.width;
    const boxWidth = isPortrait ? Math.min(500, this.scene.scale.width - 24) : 760;
    const boxHeight = isPortrait ? 170 : 150;
    const padding = isPortrait ? 18 : 22;

    this.boxWidth = boxWidth;
    this.boxHeight = boxHeight;
    this.padding = padding;

    this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - (isPortrait ? 24 : 18));

    this.speaker.setPosition(-boxWidth / 2 + padding, -boxHeight + (isPortrait ? 12 : 16));
    this.body.setPosition(-boxWidth / 2 + padding, -boxHeight + (isPortrait ? 42 : 46));
    this.body.setWordWrapWidth(boxWidth - padding * 2);

    this.continueMark.setPosition(boxWidth / 2 - padding - 4, -18);

    this.drawPanel();
  }

  drawPanel() {
    const boxWidth = this.boxWidth ?? 760;
    const boxHeight = this.boxHeight ?? 150;
    const padding = this.padding ?? 22;
    const left = -boxWidth / 2;
    const top = -boxHeight;

    this.panel.clear();
    this.panel.fillStyle(0x140d07, 0.94);
    this.panel.fillRoundedRect(left, top, boxWidth, boxHeight, 10);
    this.panel.lineStyle(3, 0x6b4220, 1);
    this.panel.strokeRoundedRect(left, top, boxWidth, boxHeight, 10);
    this.panel.fillStyle(0xa8703a, 0.55);
    this.panel.fillRect(left + 10, top + 3, boxWidth - 20, 2);

    this.nameTab.clear();
    this.nameTab.fillStyle(0x2a1a0e, 1);
    const tabW = Math.max(120, this.speaker.width + 20);
    this.nameTab.fillRoundedRect(
      left + padding - 8,
      top + 8,
      tabW,
      28,
      6
    );
    this.nameTab.lineStyle(2, 0x8b5a2b, 1);
    this.nameTab.strokeRoundedRect(
      left + padding - 8,
      top + 8,
      tabW,
      28,
      6
    );
  }

  say({ speaker, text }) {
    this.queue.push({ speaker: speaker ?? '', text: text ?? '' });

    if (!this.visible) {
      this.openNext();
    }
  }

  openNext() {
    const next = this.queue.shift();

    if (!next) {
      this.close();
      return;
    }

    this.current = next;
    this.speaker.setText(next.speaker);
    this.body.setText(next.text);
    this.layout();
    this.setVisible(true);
    this.continueMark.setAlpha(1);
    uiState.dialogueOpen = true;
  }

  get isBusy() {
    return this.visible;
  }

  advance() {
    if (!this.visible) {
      return;
    }

    if (this.queue.length > 0) {
      this.openNext();
      return;
    }

    this.close();
  }

  close() {
    this.current = null;
    this.queue.length = 0;
    this.setVisible(false);
    this.continueMark.setAlpha(0);
    uiState.dialogueOpen = false;
    this.scene.events.emit(Events.DIALOGUE_CLOSED);
  }

  update(time) {
    if (!this.visible) {
      return;
    }

    this.continueMark.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(time / 320)));
  }

  destroy(fromScene) {
    for (const off of this.unsubscribe) {
      off();
    }

    super.destroy(fromScene);
  }
}