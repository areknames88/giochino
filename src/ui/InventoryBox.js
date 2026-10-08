import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { inventory } from '../game/inventory.js';

const COLORS = {
  panelBg: 0x150e08,
  panelBorder: 0x8b5a2b,
  panelBorderGold: 0xc08a4a,
  headerLine: 0x4a301a,
  slotBg: 0x211508,
  slotBorder: 0x5a3a1e,
  slotHoverBg: 0x321e0b,
  slotHoverBorder: 0x9a652a,
  slotSelectedBg: 0x3f2710,
  slotSelectedBorder: 0xf0c27a,
  closeBg: 0x2a170b,
  closeHoverBg: 0x4a240e,
  closeBorder: 0x8b5a2b
};

export default class InventoryBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    scene.add.existing(this);

    this.selectedIndex = 0;
    this.slotObjects = [];
    this.visible = false;

    // Sfondo e cornice
    this.panelGraphic = scene.add.graphics();
    this.add(this.panelGraphic);

    // Titolo e sottotitolo
    this.titleText = scene.add.text(0, 0, '🎒 ZAINO DELLA BAND', {
      fontFamily: GAME.font,
      fontSize: '20px',
      color: '#f0c27a',
      fontStyle: 'bold'
    });
    this.subtitleText = scene.add.text(0, 0, 'Attrezzatura e strumenti raccolti', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: '#a8917a'
    });
    this.add([this.titleText, this.subtitleText]);

    // Pulsante Chiudi in alto a destra
    this.closeBtnContainer = scene.add.container(0, 0);
    this.closeBtnGraphic = scene.add.graphics();
    this.closeBtnText = scene.add.text(0, 0, '✕', {
      fontFamily: GAME.font,
      fontSize: '18px',
      color: '#f0c27a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.closeBtnHitArea = scene.add.zone(0, 0, 36, 36)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    this.closeBtnHitArea.on('pointerover', () => {
      this.drawCloseButton(true);
    });
    this.closeBtnHitArea.on('pointerout', () => {
      this.drawCloseButton(false);
    });
    this.closeBtnHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.close();
    });

    this.closeBtnContainer.add([this.closeBtnGraphic, this.closeBtnText, this.closeBtnHitArea]);
    this.add(this.closeBtnContainer);

    // Contenitore per gli slot
    this.slotsContainer = scene.add.container(0, 0);
    this.add(this.slotsContainer);

    // Pannello di dettaglio oggetto selezionato
    this.detailContainer = scene.add.container(0, 0);
    this.detailPanelGraphic = scene.add.graphics();
    this.detailIcon = scene.add.image(0, 0, 'item-cables').setOrigin(0.5, 0.5);
    this.detailNameText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '17px',
      color: '#f0c27a',
      fontStyle: 'bold'
    });
    this.detailCategoryText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: '#c99b6a',
      fontStyle: 'italic'
    });
    this.detailDescText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '14px',
      color: '#f2e6d2',
      lineSpacing: 5,
      wordWrap: { width: 280 }
    });
    this.detailStatusText = scene.add.text(0, 0, '✓ Custodito nello zaino', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: '#8d7a63',
      fontStyle: 'italic'
    });

    this.detailContainer.add([
      this.detailPanelGraphic,
      this.detailIcon,
      this.detailNameText,
      this.detailCategoryText,
      this.detailDescText,
      this.detailStatusText
    ]);
    this.add(this.detailContainer);

    // Messaggio inventario vuoto
    this.emptyText = scene.add.text(0, 0, 'Lo zaino è vuoto.\n\nEsplora la sala prove o parla con i compagni della band\nper raccogliere cavi, accessori e strumenti musicali.', {
      fontFamily: GAME.font,
      fontSize: '15px',
      color: '#a8917a',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5, 0.5);
    this.add(this.emptyText);

    // Gestione click sullo sfondo del pannello per non propagare al canvas
    this.bgHitArea = scene.add.zone(0, 0, 100, 100)
      .setOrigin(0.5, 0.5)
      .setInteractive();
    this.bgHitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
    });
    this.addAt(this.bgHitArea, 0);

    this.layout();
  }

  drawCloseButton(isHover = false) {
    this.closeBtnGraphic.clear();
    this.closeBtnGraphic.fillStyle(isHover ? COLORS.closeHoverBg : COLORS.closeBg, 1);
    this.closeBtnGraphic.fillRoundedRect(-18, -18, 36, 36, 6);
    this.closeBtnGraphic.lineStyle(1.5, isHover ? COLORS.slotSelectedBorder : COLORS.closeBorder, 1);
    this.closeBtnGraphic.strokeRoundedRect(-18, -18, 36, 36, 6);
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
    emit(Events.INVENTORY_OPEN);
    this.render();
  }

  close() {
    if (!this.visible) {
      return;
    }

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
    const isPortrait = this.scene.scale.height > this.scene.scale.width;
    const { width: sw, height: sh } = this.scene.scale;

    this.boxW = isPortrait ? Math.min(sw - 36, 480) : Math.min(sw - 48, 620);
    this.boxH = isPortrait ? Math.min(sh - 120, 560) : Math.min(sh - 40, 390);

    this.setPosition(sw / 2, sh / 2);
    this.bgHitArea.setSize(this.boxW, this.boxH);

    // Disegna il pannello principale
    const g = this.panelGraphic;
    g.clear();
    const halfW = this.boxW / 2;
    const halfH = this.boxH / 2;

    // Sfondo solido scuro legno
    g.fillStyle(COLORS.panelBg, 0.96);
    g.fillRoundedRect(-halfW, -halfH, this.boxW, this.boxH, 10);

    // Bordo doppio vintage
    g.lineStyle(3, COLORS.panelBorder, 1);
    g.strokeRoundedRect(-halfW, -halfH, this.boxW, this.boxH, 10);
    g.lineStyle(1, COLORS.panelBorderGold, 0.8);
    g.strokeRoundedRect(-halfW + 4, -halfH + 4, this.boxW - 8, this.boxH - 8, 8);

    // Divisore header
    g.lineStyle(1.5, COLORS.headerLine, 1);
    g.lineBetween(-halfW + 16, -halfH + 54, halfW - 16, -halfH + 54);

    // Header testo
    this.titleText.setPosition(-halfW + 20, -halfH + 14);
    this.subtitleText.setPosition(-halfW + 22, -halfH + 36);

    // Bottone chiudi
    this.closeBtnContainer.setPosition(halfW - 32, -halfH + 28);
    this.drawCloseButton(false);

    this.render();
  }

  render() {
    const isPortrait = this.scene.scale.height > this.scene.scale.width;
    const halfW = this.boxW / 2;
    const halfH = this.boxH / 2;
    const items = inventory.getItems();

    // Rimuovi gli slot precedenti
    for (const slot of this.slotObjects) {
      slot.destroy();
    }
    this.slotObjects = [];

    if (items.length === 0) {
      this.emptyText.setVisible(true);
      this.emptyText.setPosition(0, 20);
      this.detailContainer.setVisible(false);
      this.slotsContainer.setVisible(false);
      return;
    }

    this.emptyText.setVisible(false);
    this.slotsContainer.setVisible(true);
    this.detailContainer.setVisible(true);

    if (this.selectedIndex < 0 || this.selectedIndex >= items.length) {
      this.selectedIndex = 0;
    }

    if (isPortrait) {
      // Layout Portrait: griglia in alto, dettaglio sotto
      this.layoutPortrait(items, halfW, halfH);
    } else {
      // Layout Landscape: lista/slot a sinistra, dettaglio a destra
      this.layoutLandscape(items, halfW, halfH);
    }

    this.renderDetails(items[this.selectedIndex]);
  }

  layoutLandscape(items, halfW, halfH) {
    const listLeft = -halfW + 20;
    const listTop = -halfH + 68;
    const listW = 240;
    const rowH = 46;
    const gap = 8;

    items.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      const slotContainer = this.scene.add.container(listLeft, listTop + index * (rowH + gap));

      const bg = this.scene.add.graphics();
      this.drawSlotBg(bg, listW, rowH, isSelected);

      const icon = this.scene.add.image(24, rowH / 2, item.iconKey)
        .setDisplaySize(32, 32);

      const name = this.scene.add.text(48, 8, item.shortName ?? item.name, {
        fontFamily: GAME.font,
        fontSize: '14px',
        color: isSelected ? '#f0c27a' : '#efdfc4',
        fontStyle: isSelected ? 'bold' : 'normal'
      });

      const category = this.scene.add.text(48, 26, item.category, {
        fontFamily: GAME.font,
        fontSize: '11px',
        color: '#8d7a63'
      });

      const hit = this.scene.add.zone(listW / 2, rowH / 2, listW, rowH)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        if (index !== this.selectedIndex) {
          bg.clear();
          bg.fillStyle(COLORS.slotHoverBg, 1);
          bg.fillRoundedRect(0, 0, listW, rowH, 6);
          bg.lineStyle(1.5, COLORS.slotHoverBorder, 1);
          bg.strokeRoundedRect(0, 0, listW, rowH, 6);
        }
      });

      hit.on('pointerout', () => {
        if (index !== this.selectedIndex) {
          this.drawSlotBg(bg, listW, rowH, false);
        }
      });

      hit.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) {
          event.stopPropagation();
        }
        this.selectItem(index);
      });

      slotContainer.add([bg, icon, name, category, hit]);
      this.slotsContainer.add(slotContainer);
      this.slotObjects.push(slotContainer);
    });

    // Dettaglio a destra
    const detailLeft = listLeft + listW + 20;
    const detailTop = listTop;
    const detailW = this.boxW - listW - 60;
    const detailH = this.boxH - 96;

    this.detailContainer.setPosition(detailLeft, detailTop);
    const dg = this.detailPanelGraphic;
    dg.clear();
    dg.fillStyle(0x191009, 0.85);
    dg.fillRoundedRect(0, 0, detailW, detailH, 8);
    dg.lineStyle(1.5, COLORS.headerLine, 1);
    dg.strokeRoundedRect(0, 0, detailW, detailH, 8);

    // Icona in riquadro
    dg.fillStyle(0x28190d, 1);
    dg.fillRoundedRect(16, 16, 56, 56, 6);
    dg.lineStyle(1, COLORS.slotBorder, 1);
    dg.strokeRoundedRect(16, 16, 56, 56, 6);

    this.detailIcon.setPosition(44, 44).setDisplaySize(44, 44);
    this.detailNameText.setPosition(84, 18);
    this.detailCategoryText.setPosition(84, 44);

    dg.lineStyle(1, COLORS.headerLine, 0.8);
    dg.lineBetween(16, 84, detailW - 16, 84);

    this.detailDescText.setPosition(18, 98);
    this.detailDescText.setWordWrapWidth(detailW - 36);

    this.detailStatusText.setPosition(18, detailH - 26);
  }

  layoutPortrait(items, halfW, halfH) {
    const listLeft = -halfW + 18;
    const listTop = -halfH + 64;
    const gridW = this.boxW - 36;
    const colW = (gridW - 10) / 2;
    const rowH = 46;
    const gap = 8;

    items.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      const col = index % 2;
      const row = Math.floor(index / 2);
      const slotX = listLeft + col * (colW + 10);
      const slotY = listTop + row * (rowH + gap);

      const slotContainer = this.scene.add.container(slotX, slotY);

      const bg = this.scene.add.graphics();
      this.drawSlotBg(bg, colW, rowH, isSelected);

      const icon = this.scene.add.image(22, rowH / 2, item.iconKey)
        .setDisplaySize(28, 28);

      const name = this.scene.add.text(42, 8, item.shortName ?? item.name, {
        fontFamily: GAME.font,
        fontSize: '13px',
        color: isSelected ? '#f0c27a' : '#efdfc4',
        fontStyle: isSelected ? 'bold' : 'normal'
      });

      const category = this.scene.add.text(42, 26, item.category, {
        fontFamily: GAME.font,
        fontSize: '10px',
        color: '#8d7a63'
      });

      const hit = this.scene.add.zone(colW / 2, rowH / 2, colW, rowH)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) {
          event.stopPropagation();
        }
        this.selectItem(index);
      });

      slotContainer.add([bg, icon, name, category, hit]);
      this.slotsContainer.add(slotContainer);
      this.slotObjects.push(slotContainer);
    });

    const gridRows = Math.ceil(items.length / 2);
    const gridBottom = listTop + gridRows * (rowH + gap) + 6;

    // Dettaglio sotto la griglia
    const detailW = gridW;
    const detailH = halfH - (gridBottom - listTop) - 24;

    this.detailContainer.setPosition(listLeft, gridBottom);
    const dg = this.detailPanelGraphic;
    dg.clear();
    dg.fillStyle(0x191009, 0.85);
    dg.fillRoundedRect(0, 0, detailW, detailH, 8);
    dg.lineStyle(1.5, COLORS.headerLine, 1);
    dg.strokeRoundedRect(0, 0, detailW, detailH, 8);

    dg.fillStyle(0x28190d, 1);
    dg.fillRoundedRect(14, 14, 48, 48, 6);
    dg.lineStyle(1, COLORS.slotBorder, 1);
    dg.strokeRoundedRect(14, 14, 48, 48, 6);

    this.detailIcon.setPosition(38, 38).setDisplaySize(38, 38);
    this.detailNameText.setPosition(72, 16).setFontSize('15px');
    this.detailCategoryText.setPosition(72, 40).setFontSize('11px');

    dg.lineStyle(1, COLORS.headerLine, 0.8);
    dg.lineBetween(14, 72, detailW - 14, 72);

    this.detailDescText.setPosition(16, 84);
    this.detailDescText.setWordWrapWidth(detailW - 32);
    this.detailDescText.setFontSize('13px');

    this.detailStatusText.setPosition(16, detailH - 22);
  }

  drawSlotBg(g, w, h, isSelected) {
    g.clear();
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

  renderDetails(item) {
    if (!item) {
      this.detailContainer.setVisible(false);
      return;
    }

    this.detailContainer.setVisible(true);
    this.detailIcon.setTexture(item.iconKey);
    this.detailNameText.setText(item.name);
    this.detailCategoryText.setText(`CATEGORIA: ${item.category.toUpperCase()}`);
    this.detailDescText.setText(item.description);
  }
}
