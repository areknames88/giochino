import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, on } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';

const BOX_WIDTH = 760;
const BOX_HEIGHT = 150;
const PADDING = 22;

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
      .text(-BOX_WIDTH / 2 + PADDING, -BOX_HEIGHT + 16, '', {
        fontFamily: GAME.font,
        fontSize: '19px',
        color: '#f0c27a',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.body = scene.add
      .text(-BOX_WIDTH / 2 + PADDING, -BOX_HEIGHT + 46, '', {
        fontFamily: GAME.font,
        fontSize: '17px',
        color: '#f2e6d2',
        wordWrap: { width: BOX_WIDTH - PADDING * 2 },
        lineSpacing: 7
      })
      .setOrigin(0, 0);

    this.continueMark = scene.add
      .text(BOX_WIDTH / 2 - PADDING - 4, -22, '▼', {
        fontFamily: GAME.font,
        fontSize: '13px',
        color: '#f0c27a'
      })
      .setOrigin(1, 1)
      .setAlpha(0);

    this.add([this.panel, this.nameTab, this.speaker, this.body, this.continueMark]);

    this.drawPanel();
    this.setVisible(false);

    this.unsubscribe = [
      on(Events.DIALOGUE_SAY, (payload) => this.say(payload)),
      on(Events.DIALOGUE_ADVANCE, () => this.advance())
    ];
  }

  drawPanel() {
    const left = -BOX_WIDTH / 2;
    const top = -BOX_HEIGHT;

    this.panel.clear();
    this.panel.fillStyle(0x140d07, 0.94);
    this.panel.fillRoundedRect(left, top, BOX_WIDTH, BOX_HEIGHT, 10);
    this.panel.lineStyle(3, 0x6b4220, 1);
    this.panel.strokeRoundedRect(left, top, BOX_WIDTH, BOX_HEIGHT, 10);
    this.panel.fillStyle(0xa8703a, 0.55);
    this.panel.fillRect(left + 10, top + 3, BOX_WIDTH - 20, 2);

    this.nameTab.clear();
    this.nameTab.fillStyle(0x2a1a0e, 1);
    this.nameTab.fillRoundedRect(
      left + PADDING - 10,
      top + 10,
      Math.max(120, this.speaker.width + 20),
      28,
      6
    );
    this.nameTab.lineStyle(2, 0x8b5a2b, 1);
    this.nameTab.strokeRoundedRect(
      left + PADDING - 10,
      top + 10,
      Math.max(120, this.speaker.width + 20),
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
    this.drawPanel();
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