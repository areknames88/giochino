import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { objectives } from '../game/objectives.js';

const COLORS = {
  panelBg: 0x140d07,
  panelBorder: 0x8b5a2b,
  panelBorderGold: 0xc08a4a,
  headerLine: 0x4a301a,
  headerGrip: 0x6e4827,
  cardBg: 0x1c1208,
  cardBorder: 0x472d16,
  cardHoverBg: 0x27190d,
  cardHoverBorder: 0x8b5a2b,
  cardCompletedBg: 0x141812,
  cardCompletedBorder: 0x27492c,
  closeBg: 0x241409,
  closeHoverBg: 0x42200b,
  closeBorder: 0x7a4820,
  btnBg: 0x26160a,
  btnHoverBg: 0x3d220e,
  btnBorder: 0x73441d
};

export default class ObjectivesBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    scene.add.existing(this);

    this.currentPage = 0;
    this.itemsPerPage = 2;
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
      this.startDrag(pointer);
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
    this.titleText = scene.add.text(0, 0, '🎯 OBIETTIVI', {
      fontFamily: GAME.font,
      fontSize: '15px',
      color: '#f0c27a',
      fontStyle: 'bold'
    });
    this.add(this.titleText);

    // Contatore obiettivi
    this.countText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '11px',
      color: '#a8917a'
    }).setOrigin(1, 0.5);
    this.add(this.countText);

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

    // Contenitore per le card degli obiettivi
    this.cardsContainer = scene.add.container(0, 0);
    this.add(this.cardsContainer);

    // Barra paginazione (visibile quando ci sono più pagine)
    this.paginationContainer = scene.add.container(0, 0);
    this.prevPageBtn = this.createPageButton('◀ Prec', -60, () => this.changePage(-1));
    this.nextPageBtn = this.createPageButton('Succ ▶', 60, () => this.changePage(1));
    this.pageInfoText = scene.add.text(0, 0, '', {
      fontFamily: GAME.font,
      fontSize: '11px',
      color: '#a8917a'
    }).setOrigin(0.5, 0.5);

    this.paginationContainer.add([this.prevPageBtn, this.nextPageBtn, this.pageInfoText]);
    this.add(this.paginationContainer);

    // Messaggio obiettivi vuoti
    this.emptyText = scene.add.text(
      0,
      0,
      'Nessun obiettivo attivo al momento.\n\nParla con i membri della band ed esplora la stanza\nper ricevere nuovi compiti e missioni!',
      {
        fontFamily: GAME.font,
        fontSize: '13px',
        color: '#a8917a',
        align: 'center',
        lineSpacing: 6
      }
    ).setOrigin(0.5, 0.5);
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

    // Mouse wheel per navigare le pagine degli obiettivi
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.visible && this.getBounds().contains(pointer.x, pointer.y)) {
        if (deltaY > 0) {
          this.changePage(1);
        } else if (deltaY < 0) {
          this.changePage(-1);
        }
      }
    });

    this.layout();
  }

  createPageButton(label, xOffset, onClick) {
    const container = this.scene.add.container(xOffset, 0);
    const bg = this.scene.add.graphics();
    const txt = this.scene.add.text(0, 0, label, {
      fontFamily: GAME.font,
      fontSize: '11px',
      color: '#f0c27a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const hit = this.scene.add.zone(0, 0, 56, 24)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? COLORS.btnHoverBg : COLORS.btnBg, 1);
      bg.fillRoundedRect(-28, -12, 56, 24, 4);
      bg.lineStyle(1, hover ? COLORS.panelBorderGold : COLORS.btnBorder, 1);
      bg.strokeRoundedRect(-28, -12, 56, 24, 4);
    };

    draw(false);
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      onClick();
    });

    container.add([bg, txt, hit]);
    return container;
  }

  changePage(delta) {
    const list = objectives.getObjectives();
    const maxPage = Math.max(0, Math.ceil(list.length / this.itemsPerPage) - 1);
    const nextPage = Phaser.Math.Clamp(this.currentPage + delta, 0, maxPage);
    if (nextPage !== this.currentPage) {
      this.currentPage = nextPage;
      this.render();
    }
  }

  startDrag(pointer) {
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
    this.closeBtnGraphic.lineStyle(1.5, isHover ? COLORS.panelBorderGold : COLORS.closeBorder, 1);
    this.closeBtnGraphic.strokeRoundedRect(-14, -14, 28, 28, 5);
  }

  open() {
    if (this.visible) {
      return;
    }

    this.currentPage = 0;
    this.setVisible(true);
    uiState.objectivesOpen = true;
    emit(Events.OBJECTIVES_OPEN);
    this.layout();
  }

  close() {
    if (!this.visible) {
      return;
    }

    this.isDragging = false;
    this.setVisible(false);
    queueMicrotask(() => {
      uiState.objectivesOpen = false;
      emit(Events.OBJECTIVES_CLOSE);
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

    this.boxW = Math.min(460, sw - (isPortrait ? 20 : 36));
    const allObjs = objectives.getObjectives();

    if (allObjs.length === 0) {
      this.boxH = 180;
    } else {
      this.boxH = Math.min(390, sh - (isPortrait ? 80 : 50));
    }

    if (this.customPosition) {
      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      const pad = 10;
      const clampedX = Phaser.Math.Clamp(this.customPosition.x, halfW + pad, sw - halfW - pad);
      const clampedY = Phaser.Math.Clamp(this.customPosition.y, halfH + pad, sh - halfH - pad);
      this.setPosition(clampedX, clampedY);
    } else {
      this.setPosition(sw / 2, sh / 2);
    }

    this.drawPanel();
    this.render();
  }

  drawPanel() {
    const w = this.boxW;
    const h = this.boxH;
    const halfW = w / 2;
    const halfH = h / 2;

    this.bgHitArea.setSize(w, h);
    this.headerHitArea.setSize(w - 70, 36);
    this.headerHitArea.setPosition(-25, -halfH + 19);

    const g = this.panelGraphic;
    g.clear();

    // Sfondo principale semi-trasparente caldo scuro
    g.fillStyle(COLORS.panelBg, 0.94);
    g.fillRoundedRect(-halfW, -halfH, w, h, 8);

    // Cornice esterna principale
    g.lineStyle(2, COLORS.panelBorder, 1);
    g.strokeRoundedRect(-halfW, -halfH, w, h, 8);

    // Filetto dorato decorativo interno
    g.lineStyle(1, COLORS.panelBorderGold, 0.35);
    g.strokeRoundedRect(-halfW + 3, -halfH + 3, w - 6, h - 6, 6);

    // Separatore orizzontale sotto l'header
    g.lineStyle(1, COLORS.headerLine, 1);
    g.lineBetween(-halfW + 8, -halfH + 38, halfW - 8, -halfH + 38);

    // Grip texture (puntini centrali per indicare drag)
    g.fillStyle(COLORS.headerGrip, 0.8);
    for (let i = -2; i <= 2; i++) {
      g.fillCircle(i * 7, -halfH + 19, 1.8);
    }

    // Posizionamento elementi fissi dell'header
    this.titleText.setPosition(-halfW + 16, -halfH + 19).setOrigin(0, 0.5);
    this.closeBtnContainer.setPosition(halfW - 20, -halfH + 19);
    this.drawCloseButton(false);

    this.countText.setPosition(halfW - 42, -halfH + 19);
  }

  render() {
    this.cardsContainer.removeAll(true);

    const allObjs = objectives.getObjectives();
    const activeCount = objectives.getActiveCount();

    if (allObjs.length === 0) {
      this.countText.setText('0 Obiettivi');
      this.emptyText.setVisible(true);
      this.paginationContainer.setVisible(false);
      return;
    }

    this.emptyText.setVisible(false);
    this.countText.setText(`${activeCount} attivi / ${allObjs.length} tot`);

    const maxPage = Math.max(0, Math.ceil(allObjs.length / this.itemsPerPage) - 1);
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }

    const startIdx = this.currentPage * this.itemsPerPage;
    const pageItems = allObjs.slice(startIdx, startIdx + this.itemsPerPage);

    const halfH = this.boxH / 2;
    const contentTop = -halfH + 46;
    const contentWidth = this.boxW - 28;

    const availableH = this.boxH - 85;
    const cardH = Math.min(136, Math.floor((availableH - (pageItems.length - 1) * 8) / Math.max(1, pageItems.length)));

    pageItems.forEach((obj, idx) => {
      const cardY = contentTop + idx * (cardH + 8);
      const card = this.createObjectiveCard(obj, -contentWidth / 2, cardY, contentWidth, cardH);
      this.cardsContainer.add(card);
    });

    if (allObjs.length > this.itemsPerPage) {
      this.paginationContainer.setVisible(true);
      this.paginationContainer.setPosition(0, halfH - 20);
      this.pageInfoText.setText(`${this.currentPage + 1} / ${maxPage + 1}`);
    } else {
      this.paginationContainer.setVisible(false);
    }
  }

  createObjectiveCard(obj, x, y, width, height) {
    const card = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();

    const isCompleted = !!obj.completed;
    const cardBgColor = isCompleted ? COLORS.cardCompletedBg : COLORS.cardBg;
    const cardBorderColor = isCompleted ? COLORS.cardCompletedBorder : COLORS.cardBorder;

    bg.fillStyle(cardBgColor, 0.9);
    bg.fillRoundedRect(0, 0, width, height, 6);
    bg.lineStyle(1.2, cardBorderColor, 1);
    bg.strokeRoundedRect(0, 0, width, height, 6);

    // Icona di stato
    const statusIcon = isCompleted ? '✅' : '🎯';
    const statusText = this.scene.add.text(12, 10, statusIcon, {
      fontSize: '16px'
    });

    // Badge Categoria
    const catName = (obj.category || 'Principale').toUpperCase();
    const catBadge = this.scene.add.text(38, 11, catName, {
      fontFamily: GAME.font,
      fontSize: '10px',
      color: isCompleted ? '#48bb78' : '#c99b6a',
      fontStyle: 'bold'
    });

    // Titolo dell'obiettivo
    const title = this.scene.add.text(38, 27, obj.title || obj.id, {
      fontFamily: GAME.font,
      fontSize: '14px',
      color: isCompleted ? '#a0aec0' : '#f0c27a',
      fontStyle: 'bold',
      wordWrap: { width: width - 50 }
    });

    // Descrizione narrativa scritta
    const descText = this.scene.add.text(12, 48, obj.description || '', {
      fontFamily: GAME.font,
      fontSize: '12px',
      color: isCompleted ? '#718096' : '#f2e6d2',
      lineSpacing: 3,
      wordWrap: { width: width - 24 }
    });

    // Prossimo passo / target se presente
    const elements = [bg, statusText, catBadge, title, descText];

    if (obj.target) {
      const targetY = Math.min(height - 20, 48 + descText.height + 6);
      const targetLabel = isCompleted ? `✓ Completato: ${obj.target}` : `📍 Prossimo passo: ${obj.target}`;
      const targetText = this.scene.add.text(12, targetY, targetLabel, {
        fontFamily: GAME.font,
        fontSize: '11px',
        color: isCompleted ? '#48bb78' : '#a8917a',
        fontStyle: 'italic',
        wordWrap: { width: width - 24 }
      });
      elements.push(targetText);
    }

    card.add(elements);
    return card;
  }
}
