import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { isTouchPrimary } from '../core/input.js';
import { uiState } from '../core/uiState.js';
import DialogueBox from '../ui/DialogueBox.js';

const PANEL_STYLE = {
  fontFamily: GAME.font,
  fontSize: '15px',
  color: '#e8d9c3'
};

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.touchFirst = isTouchPrimary();
    this.dialogue = new DialogueBox(this);
    this.dialogue.setDepth(100);

    this.buildRoomPlate();
    this.buildHint();
    this.buildLegend();
    this.buildToast();
    this.layoutElements();

    this.input.on('pointerdown', () => {
      if (uiState.dialogueOpen && !uiState.dialogueOptionsOpen) {
        emit(Events.DIALOGUE_ADVANCE);
      }
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      this.layoutElements();
    });

    this.unsubscribe = [
      on(Events.ROOM_READY, (room) => this.onRoomReady(room)),
      on(Events.HINT_CHANGED, (hint) => this.onHint(hint)),
      on(Events.PLAYER_MOVED, (position) => this.setCoordinates(position.x, position.y)),
      on(Events.TOAST, (message) => this.showToast(message))
    ];

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) {
        off();
      }

      uiState.ready = false;
    });

    uiState.ready = true;
  }

  layoutElements() {
    const isPortrait = this.scale.height > this.scale.width;
    if (this.coordinates) {
      this.coordinates.setPosition(this.scale.width - 18, 22);
    }
    if (this.hint) {
      this.hint.setPosition(this.scale.width / 2, this.scale.height - (isPortrait ? 210 : 190));
    }
    if (this.legend) {
      this.legend.setPosition(this.scale.width - 16, this.scale.height - 16);
    }
    if (this.toast) {
      this.toast.setPosition(this.scale.width / 2, 96);
    }
    if (this.dialogue) {
      this.dialogue.layout();
    }
  }

  buildRoomPlate() {
    const { width } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x140d07, 0.86);
    graphics.fillRoundedRect(14, 14, 296, 62, 8);
    graphics.lineStyle(2, 0x6b4220, 1);
    graphics.strokeRoundedRect(14, 14, 296, 62, 8);

    this.roomName = this.add
      .text(30, 24, '', { ...PANEL_STYLE, fontSize: '22px', color: '#f0c27a', fontStyle: 'bold' })
      .setOrigin(0, 0);

    this.roomTagline = this.add
      .text(30, 52, '', { ...PANEL_STYLE, fontSize: '13px', color: '#a8917a' })
      .setOrigin(0, 0);

    this.coordinates = this.add
      .text(width - 18, 22, '', { ...PANEL_STYLE, fontSize: '12px', color: '#7d6a56' })
      .setOrigin(1, 0);
  }

  buildHint() {
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 190, '', {
        ...PANEL_STYLE,
        fontSize: '15px',
        color: '#f0c27a',
        backgroundColor: '#140d07cc',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
  }

  buildLegend() {
    const lines = this.touchFirst
      ? ['tocca dove vuoi andare', 'tocca un oggetto per esaminarlo', 'tocca il testo per andare avanti']
      : ['WASD / frecce  muoviti', 'click  muoviti a destinazione', 'E / INVIO  interagisci', 'G  griglia e collisioni'];

    this.legend = this.add
      .text(this.scale.width - 16, this.scale.height - 16, lines.join('\n'), {
        ...PANEL_STYLE,
        fontSize: '12px',
        color: '#8d7a63',
        align: 'right',
        lineSpacing: 3
      })
      .setOrigin(1, 1);
  }

  buildToast() {
    this.toast = this.add
      .text(this.scale.width / 2, 96, '', {
        ...PANEL_STYLE,
        fontSize: '20px',
        color: '#f0c27a',
        backgroundColor: '#140d07cc',
        padding: { x: 14, y: 8 }
      })
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
  }

  onRoomReady(room) {
    this.roomName.setText(room.name);
    this.roomTagline.setText(room.tagline ?? '');
    this.showToast(room.name);
  }

  onHint(hint) {
    if (!hint || this.dialogue.isBusy) {
      this.hint.setVisible(false);
      return;
    }

    const verb = this.touchFirst ? '[tocca]' : '[E]';
    this.hint.setText(`${verb} ${hint.prompt} — ${hint.label}`);
    this.hint.setVisible(true);
  }

  showToast(message) {
    if (!message) {
      return;
    }

    this.toast.setText(message);
    this.toast.setAlpha(0);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({
      targets: this.toast,
      alpha: { from: 0, to: 1 },
      duration: 220,
      yoyo: true,
      hold: 900,
      onComplete: () => this.toast.setAlpha(0)
    });
  }

  setCoordinates(x, y) {
    this.coordinates.setText(`x ${Math.round(x)}  y ${Math.round(y)}`);
  }
}