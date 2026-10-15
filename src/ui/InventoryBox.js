import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { inventory } from '../game/inventory.js';

const COLORS = {
  panelBg: 0x140d07,
  panelBorder: 0x8b5a2b,
  panelBorderGold: 0xc08a4a,
  headerLine: 0x4a301a,
  headerGrip: 0x6e4827,
  slotBg: 0x1c1208,
  slotBorder: 0x472d16,
  slotHoverBg: 0x2e1c0c,
  slotHoverBorder: 0x9a652a,
  slotSelectedBg: 0x3d250f,
  slotSelectedBorder: 0xf0c27a,
  emptySlotBg: 0x130b05,
  emptySlotBorder: 0x2d1a0b,
  closeBg: 0x241409,
  closeHoverBg: 0x42200b,
  closeBorder: 0x7a4820,
  btnBg: 0x26160a,
  btnHoverBg: 0x3d220e,
  btnActiveBg: 0x4a2a10,
  btnBorder: 0x73441d,
  btnActiveBorder: 0xf0c27a
};

export default class InventoryBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    scene.add.existing(this);

    this.selectedIndex = 0;
    this.showInfo = false;
    this.slotObjects = [];
    this.visible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.customPosition = null;

    // Sfondo e cornice principale
    this.panelGraphic = scene.add.graphics();
    this.add(this.panelGraphic);

    // Hit area per bloccare i click e permettere il drag dal background
    this.bgHitArea = scene.add.zone(0, 0, 100, 100)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: false });

    this.bgHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.scene.bringModalToFront?.(this);
    });
    this.addAt(this.bgHitArea, 0);

    // Header bar drag zone
    this.headerHitArea = scene.add.zone(0, 0, 100, 38)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    this.headerHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.startDrag(pointer);
    });
    this.add(this.headerHitArea);

    // Titolo per il pannello
    this.titleText = scene.add.text(0, 0, '🎒 ZAINO', {
      fontFamily: GAME.font,
      fontSize: '15px',
      color: '#f0c27a',
      fontStyle: 'bold'
    });

    this.add(this.titleText);

    // Pulsante Chiudi in alto a destra
    this.closeBtnContainer = scene.add.container(0, 0);
    this.closeBtnGraphic = scene.add.graphics();
    this.closeBtnText = scene.add.text(0, 0, '✕', {
      fontFamily: GAME.font,
      fontSize: '15px',
      color: '#f0c27a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.closeBtnHitArea = scene.add.zone(0, 0, 28, 28)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    this.closeBtnHitArea.on('pointerover', () => this.drawCloseButton(true));
    this.closeBtnHitArea.on('pointerout', () => this.drawCloseButton(false));
    this.closeBtnHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.close();
    });

    this.closeBtnContainer.add([this.closeBtnGraphic, this.closeBtnText, this.closeBtnHitArea]);
    this.add(this.closeBtnContainer);

    // Contenitore per gli slot (solo icone)
    this.slotsContainer = scene.add.container(0, 0);
    this.add(this.slotsContainer);

    // Barra di controllo inferiore: nome oggetto + pulsante info
    this.controlBar = scene.add.container(0, 0);
    this.selectedItemName = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '13px',
      color: '#f0c27a',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Pulsante Info
    this.infoBtnContainer = scene.add.container(0, 0);
    this.infoBtnGraphic = scene.add.graphics();
    this.infoBtnText = scene.add.text(0, 0, 'ℹ Info', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: '#f0c27a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.infoBtnHitArea = scene.add.zone(0, 0, 68, 26)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    this.infoBtnHitArea.on('pointerover', () => this.drawInfoButton(true));
    this.infoBtnHitArea.on('pointerout', () => this.drawInfoButton(false));
    this.infoBtnHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.toggleInfo();
    });

    this.infoBtnContainer.add([this.infoBtnGraphic, this.infoBtnText, this.infoBtnHitArea]);
    this.controlBar.add([this.selectedItemName, this.infoBtnContainer]);
    this.add(this.controlBar);

    // Pannello di dettaglio (visibile solo se showInfo è attivo)
    this.detailContainer = scene.add.container(0, 0);
    this.detailPanelGraphic = scene.add.graphics();
    this.detailCategoryText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '11px',
      color: '#c99b6a',
      fontStyle: 'italic'
    });
    this.detailDescText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: '#f2e6d2',
      lineSpacing: 4,
      wordWrap: { width: 300 }
    });

    this.detailContainer.add([
      this.detailPanelGraphic,
      this.detailCategoryText,
      this.detailDescText
    ]);
    this.add(this.detailContainer);

    // Messaggio inventario vuoto
    this.emptyText = scene.add.text(0, 0, 'Lo zaino è vuoto.\nParla con la band o esplora la stanza\nper raccogliere oggetti e cavi.', {
      fontFamily: GAME.font,
      fontSize: '13px',
      color: '#a8917a',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5, 0.5);
    this.add(this.emptyText);

    // Ascolto globale del drag sulla scena
    scene.input.on('pointermove', (pointer) => {
      if (!this.visible || !this.isDragging) {
        return;
      }

      const { width: sw, height: sh } = this.scene.scale;
      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      const pad = 10;

      let nextX = pointer.x - this.dragOffset.x;
      let nextY = pointer.y - this.dragOffset.y;

      nextX = Phaser.Math.Clamp(nextX, halfW + pad, sw - halfW - pad);
      nextY = Phaser.Math.Clamp(nextY, halfH + pad, sh - halfH - pad);

      this.setPosition(nextX, nextY);
      this.customPosition = { x: nextX, y: nextY };
    });

    const stopDragging = () => {
      this.isDragging = false;
    };
    scene.input.on('pointerup', stopDragging);
    scene.input.on('pointerupoutside', stopDragging);

    // Frecce tastiera sinistra/destra per cambiare oggetto selezionato
    scene.input.keyboard.on('keydown-LEFT', () => {
      if (this.visible && inventory.getItemCount() > 0) {
        const count = inventory.getItemCount();
        this.selectedIndex = (this.selectedIndex - 1 + count) % count;
        this.render();
      }
    });

    scene.input.keyboard.on('keydown-RIGHT', () => {
      if (this.visible && inventory.getItemCount() > 0) {
        const count = inventory.getItemCount();
        this.selectedIndex = (this.selectedIndex + 1) % count;
        this.render();
      }
    });

    this.layout();
  }

  startDrag(pointer) {
    this.scene.bringModalToFront?.(this);
    this.isDragging = true;
    this.dragOffset = {
      x: pointer.x - this.x,
      y: pointer.y - this.y
    };
  }

  drawCloseButton(isHover = false) {
    this.closeBtnGraphic.clear();
    this.closeBtnGraphic.fillStyle(isHover ? COLORS.closeHoverBg : COLORS.closeBg, 1);
    this.closeBtnGraphic.fillRoundedRect(-14, -14, 28, 28, 5);
    this.closeBtnGraphic.lineStyle(1.5, isHover ? COLORS.slotSelectedBorder : COLORS.closeBorder, 1);
    this.closeBtnGraphic.strokeRoundedRect(-14, -14, 28, 28, 5);
  }

  drawInfoButton(isHover = false) {
    this.infoBtnGraphic.clear();
    const bg = this.showInfo
      ? (isHover ? COLORS.btnActiveBg : COLORS.btnHoverBg)
      : (isHover ? COLORS.btnHoverBg : COLORS.btnBg);
    const border = this.showInfo ? COLORS.btnActiveBorder : (isHover ? COLORS.btnActiveBorder : COLORS.btnBorder);

    this.infoBtnGraphic.fillStyle(bg, 1);
    this.infoBtnGraphic.fillRoundedRect(-34, -13, 68, 26, 5);
    this.infoBtnGraphic.lineStyle(1.5, border, 1);
    this.infoBtnGraphic.strokeRoundedRect(-34, -13, 68, 26, 5);
    this.infoBtnText.setColor(this.showInfo ? '#ffffff' : (isHover ? '#ffffff' : '#f0c27a'));
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
    this.layout();
  }

  open() {
    if (this.visible) {
      return;
    }

    const items = inventory.getItems();
    if (this.selectedIndex >= items.length) {
      this.selectedIndex = Math.max(0, items.length - 1);
    }

    this.setVisible(true);
    uiState.inventoryOpen = true;
    this.scene.bringModalToFront?.(this);
    emit(Events.INVENTORY_OPEN);
    this.layout();
  }

  close() {
    if (!this.visible) {
      return;
    }

    this.isDragging = false;
    this.setVisible(false);
    queueMicrotask(() => {
      uiState.inventoryOpen = false;
      emit(Events.INVENTORY_CLOSE);
    });
  }

  toggle() {
    if (this.visible) {
      this.close();
    } else {
      this.open();
    }
  }

  layout() {
    const { width: sw, height: sh } = this.scene.scale;
    const isPortrait = sh > sw;
    const items = inventory.getItems();

    // Larghezza compatta
    this.boxW = isPortrait ? Math.min(sw - 28, 330) : 340;

    // Calcolo altezza dinamica
    const headerH = 42;
    const slotsRowH = 54;
    const controlBarH = 34;
    const detailH = this.showInfo && items.length > 0 ? 116 : 0;
    const pad = 14;

    if (items.length === 0) {
      this.boxH = 144;
    } else {
      this.boxH = headerH + slotsRowH + controlBarH + detailH + pad;
    }

    // Posizionamento finestra
    if (this.customPosition) {
      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      const nextX = Phaser.Math.Clamp(this.customPosition.x, halfW + 10, sw - halfW - 10);
      const nextY = Phaser.Math.Clamp(this.customPosition.y, halfH + 10, sh - halfH - 10);
      this.setPosition(nextX, nextY);
    } else {
      this.setPosition(sw / 2, Math.max(this.boxH / 2 + 30, sh / 2));
    }

    this.bgHitArea.setSize(this.boxW, this.boxH);

    // Disegna il pannello principale in stile legno e profilo dorato
    const g = this.panelGraphic;
    g.clear();
    const halfW = this.boxW / 2;
    const halfH = this.boxH / 2;

    // Sfondo solido scuro legno
    g.fillStyle(COLORS.panelBg, 0.96);
    g.fillRoundedRect(-halfW, -halfH, this.boxW, this.boxH, 9);

    // Bordo doppio vintage
    g.lineStyle(2.5, COLORS.panelBorder, 1);
    g.strokeRoundedRect(-halfW, -halfH, this.boxW, this.boxH, 9);
    g.lineStyle(1, COLORS.panelBorderGold, 0.75);
    g.strokeRoundedRect(-halfW + 3, -halfH + 3, this.boxW - 6, this.boxH - 6, 7);

    // Divisore header
    g.lineStyle(1.5, COLORS.headerLine, 1);
    g.lineBetween(-halfW + 12, -halfH + headerH, halfW - 12, -halfH + headerH);

    // Header testo & pulsanti
    this.headerHitArea.setSize(this.boxW - 60, headerH);
    this.headerHitArea.setPosition(-20, -halfH + headerH / 2);

    this.titleText.setPosition(-halfW + 16, -halfH + 13);
    this.closeBtnContainer.setPosition(halfW - 22, -halfH + 21);
    this.drawCloseButton(false);

    this.render();
  }

  render() {
    const halfW = this.boxW / 2;
    const halfH = this.boxH / 2;
    const items = inventory.getItems();

    // Pulisci gli slot precedenti
    for (const slot of this.slotObjects) {
      slot.destroy();
    }
    this.slotObjects = [];

    if (items.length === 0) {
      this.emptyText.setVisible(true);
      this.emptyText.setPosition(0, 16);
      this.slotsContainer.setVisible(false);
      this.controlBar.setVisible(false);
      this.detailContainer.setVisible(false);
      return;
    }

    this.emptyText.setVisible(false);
    this.slotsContainer.setVisible(true);
    this.controlBar.setVisible(true);

    if (this.selectedIndex < 0 || this.selectedIndex >= items.length) {
      this.selectedIndex = 0;
    }

    // Griglia compatta di 5 slot (mostrando solo le icone!)
    const totalSlots = Math.max(5, items.length);
    const slotSize = 48;
    const gap = 8;
    const totalW = totalSlots * slotSize + (totalSlots - 1) * gap;
    const startX = -totalW / 2;
    const slotsY = -halfH + 42 + 10;

    for (let i = 0; i < totalSlots; i += 1) {
      const item = items[i] ?? null;
      const isSelected = i === this.selectedIndex && item !== null;
      const slotX = startX + i * (slotSize + gap);

      const slotContainer = this.scene.add.container(slotX, slotsY);

      const bg = this.scene.add.graphics();
      this.drawSlotBg(bg, slotSize, slotSize, isSelected, item !== null);

      if (item) {
        // Mostra l'icona (con fallback a item-generic se mancante)
        const textureKey = this.scene.textures.exists(item.iconKey) ? item.iconKey : 'item-generic';
        const icon = this.scene.add.image(slotSize / 2, slotSize / 2, textureKey)
          .setDisplaySize(34, 34);

        const hit = this.scene.add.zone(slotSize / 2, slotSize / 2, slotSize, slotSize)
          .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
          if (i !== this.selectedIndex) {
            bg.clear();
            bg.fillStyle(COLORS.slotHoverBg, 1);
            bg.fillRoundedRect(0, 0, slotSize, slotSize, 6);
            bg.lineStyle(1.5, COLORS.slotHoverBorder, 1);
            bg.strokeRoundedRect(0, 0, slotSize, slotSize, 6);
          }
        });

        hit.on('pointerout', () => {
          if (i !== this.selectedIndex) {
            this.drawSlotBg(bg, slotSize, slotSize, false, true);
          }
        });

        hit.on('pointerdown', (pointer, localX, localY, event) => {
          if (event && event.stopPropagation) {
            event.stopPropagation();
          }
          this.selectItem(i);
        });

        slotContainer.add([bg, icon, hit]);
      } else {
        // Slot vuoto decorativo
        slotContainer.add(bg);
      }

      this.slotsContainer.add(slotContainer);
      this.slotObjects.push(slotContainer);
    }

    // Posizionamento Barra di Controllo (Nome + Bottone Info)
    const controlY = slotsY + slotSize + 20;
    this.controlBar.setPosition(0, controlY);

    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      this.selectedItemName.setText(selectedItem.shortName ?? selectedItem.name);
      this.selectedItemName.setPosition(-halfW + 16, 0);

      this.infoBtnContainer.setPosition(halfW - 50, 0);
      this.drawInfoButton(false);
    }

    // Rendering Dettagli (se showInfo è attivo)
    if (this.showInfo && selectedItem) {
      this.detailContainer.setVisible(true);
      const detailTop = controlY + 22;
      const detailW = this.boxW - 28;
      const detailH = 104;

      this.detailContainer.setPosition(-halfW + 14, detailTop);

      const dg = this.detailPanelGraphic;
      dg.clear();
      dg.fillStyle(0x1a1109, 0.9);
      dg.fillRoundedRect(0, 0, detailW, detailH, 6);
      dg.lineStyle(1.5, COLORS.headerLine, 1);
      dg.strokeRoundedRect(0, 0, detailW, detailH, 6);

      this.detailCategoryText.setText(`CATEGORIA: ${selectedItem.category.toUpperCase()}`);
      this.detailCategoryText.setPosition(12, 10);

      dg.lineStyle(1, COLORS.headerLine, 0.7);
      dg.lineBetween(12, 28, detailW - 12, 28);

      this.detailDescText.setText(selectedItem.description);
      this.detailDescText.setPosition(12, 36);
      this.detailDescText.setWordWrapWidth(detailW - 24);
    } else {
      this.detailContainer.setVisible(false);
    }
  }

  drawSlotBg(g, w, h, isSelected, isOccupied) {
    g.clear();
    if (!isOccupied) {
      g.fillStyle(COLORS.emptySlotBg, 0.6);
      g.fillRoundedRect(0, 0, w, h, 6);
      g.lineStyle(1, COLORS.emptySlotBorder, 0.8);
      g.strokeRoundedRect(0, 0, w, h, 6);
      return;
    }

    if (isSelected) {
      g.fillStyle(COLORS.slotSelectedBg, 1);
      g.fillRoundedRect(0, 0, w, h, 6);
      g.lineStyle(2, COLORS.slotSelectedBorder, 1);
      g.strokeRoundedRect(0, 0, w, h, 6);
    } else {
      g.fillStyle(COLORS.slotBg, 1);
      g.fillRoundedRect(0, 0, w, h, 6);
      g.lineStyle(1.5, COLORS.slotBorder, 1);
      g.strokeRoundedRect(0, 0, w, h, 6);
    }
  }

  selectItem(index) {
    this.selectedIndex = index;
    this.render();
  }
}
