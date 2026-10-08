import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { isTouchPrimary } from '../core/input.js';
import { uiState } from '../core/uiState.js';
import DialogueBox from '../ui/DialogueBox.js';
import InventoryBox from '../ui/InventoryBox.js';
import { inventory } from '../game/inventory.js';

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

    this.inventoryBox = new InventoryBox(this);
    this.inventoryBox.setDepth(150);

    this.buildRoomPlate();
    this.buildBackpackButton();
    this.buildHint();
    this.buildLegend();
    this.buildToast();
    this.layoutElements();

    this.input.on('pointerdown', () => {
      if (uiState.dialogueOpen && !uiState.dialogueOptionsOpen) {
        emit(Events.DIALOGUE_ADVANCE);
      }
    });

    this.input.keyboard.on('keydown-I', () => this.toggleInventory());
    this.input.keyboard.on('keydown-B', () => this.toggleInventory());
    this.input.keyboard.on('keydown-ESC', () => {
      if (uiState.inventoryOpen) {
        this.inventoryBox.close();
      }
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      this.layoutElements();
    });

    this.unsubscribe = [
      on(Events.ROOM_READY, (room) => this.onRoomReady(room)),
      on(Events.HINT_CHANGED, (hint) => this.onHint(hint)),
      on(Events.PLAYER_MOVED, (position) => this.setCoordinates(position.x, position.y)),
      on(Events.TOAST, (message) => this.showToast(message)),
      on(Events.INVENTORY_TOGGLE, () => this.toggleInventory()),
      on(Events.INVENTORY_OPEN, () => this.inventoryBox.open()),
      on(Events.INVENTORY_CLOSE, () => this.inventoryBox.close()),
      on(Events.ITEM_COLLECTED, () => this.updateBackpackBadge()),
      on(Events.ITEM_REMOVED, () => this.updateBackpackBadge())
    ];

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) {
        off();
      }

      uiState.ready = false;
    });

    uiState.ready = true;
    this.updateBackpackBadge();
  }

  layoutElements() {
    const isPortrait = this.scale.height > this.scale.width;
    const { width, height } = this.scale;
    if (this.coordinates) {
      this.coordinates.setPosition(width - 18, 16);
    }
    if (this.backpackButton) {
      this.backpackButton.setPosition(width - 38, isPortrait ? 60 : 54);
    }
    if (this.hint) {
      this.hint.setPosition(width / 2, height - (isPortrait ? 210 : 190));
    }
    if (this.legend) {
      this.legend.setPosition(width - 16, height - 16);
    }
    if (this.toast) {
      this.toast.setPosition(width / 2, 96);
    }
    if (this.dialogue) {
      this.dialogue.layout();
    }
    if (this.inventoryBox) {
      this.inventoryBox.layout();
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
      .text(width - 18, 16, '', { ...PANEL_STYLE, fontSize: '12px', color: '#7d6a56' })
      .setOrigin(1, 0);
  }

  buildBackpackButton() {
    this.backpackButton = this.add.container(0, 0);
    this.backpackBg = this.add.graphics();
    this.drawBackpackBg(false);

    this.backpackIcon = this.add.image(0, 0, 'ui-backpack')
      .setDisplaySize(30, 30);

    this.backpackKeyHint = this.add.text(0, 24, '[I]', {
      fontFamily: GAME.font,
      fontSize: '10px',
      color: '#a8917a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.backpackBadgeContainer = this.add.container(14, -14);
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xd9534f, 1);
    badgeBg.fillCircle(0, 0, 9);
    badgeBg.lineStyle(1.5, 0xf0c27a, 1);
    badgeBg.strokeCircle(0, 0, 9);

    this.backpackBadgeText = this.add.text(0, 0, '0', {
      fontFamily: GAME.font,
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.backpackBadgeContainer.add([badgeBg, this.backpackBadgeText]);
    this.backpackBadgeContainer.setVisible(false);

    const hit = this.add.zone(0, 0, 48, 54)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      this.drawBackpackBg(true);
    });
    hit.on('pointerout', () => {
      this.drawBackpackBg(false);
    });
    hit.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.toggleInventory();
    });

    this.backpackButton.add([
      this.backpackBg,
      this.backpackIcon,
      this.backpackKeyHint,
      this.backpackBadgeContainer,
      hit
    ]);
  }

  drawBackpackBg(isHover = false) {
    this.backpackBg.clear();
    this.backpackBg.fillStyle(isHover ? 0x2a170b : 0x140d07, 0.9);
    this.backpackBg.fillRoundedRect(-22, -22, 44, 44, 8);
    this.backpackBg.lineStyle(1.5, isHover ? 0xf0c27a : 0x6b4220, 1);
    this.backpackBg.strokeRoundedRect(-22, -22, 44, 44, 8);
  }

  toggleInventory() {
    if (uiState.dialogueLocked) {
      return;
    }
    this.inventoryBox.toggle();
  }

  updateBackpackBadge() {
    if (!this.backpackBadgeContainer || !this.backpackBadgeText) {
      return;
    }
    const count = inventory.getItemCount();
    if (count > 0) {
      this.backpackBadgeText.setText(String(count));
      this.backpackBadgeContainer.setVisible(true);
    } else {
      this.backpackBadgeContainer.setVisible(false);
    }
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
      ? ['tocca dove vuoi andare', 'tocca un oggetto per esaminarlo', 'tocca lo zaino per l\'inventario']
      : ['WASD / frecce  muoviti', 'click  muoviti a destinazione', 'E / INVIO  interagisci', 'I / zaino  inventario', 'G  griglia e collisioni'];

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