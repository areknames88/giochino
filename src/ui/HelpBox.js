import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { isTouchPrimary } from '../core/input.js';

const COLORS = {
  panelBg: 0x140d07,
  panelBorder: 0x8b5a2b,
  panelBorderGold: 0xc08a4a,
  headerLine: 0x4a301a,
  headerGrip: 0x6e4827,
  cardBg: 0x1c1208,
  cardBorder: 0x472d16,
  tabActiveBg: 0x3d220e,
  tabActiveBorder: 0xf0c27a,
  tabInactiveBg: 0x180f08,
  tabInactiveBorder: 0x5a341a,
  closeBg: 0x241409,
  closeHoverBg: 0x42200b,
  closeBorder: 0x7a4820
};

export default class HelpBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    scene.add.existing(this);

    this.activeTab = isTouchPrimary() ? 'touch' : 'desktop';
    this.visible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.customPosition = null;
    this.scrollOffsetY = 0;
    this.maxScrollY = 0;

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
      this.scene.bringModalToFront?.(this);
      this.startDrag(pointer);
    });
    this.add(this.headerHitArea);

    // Titolo per il pannello
    this.titleText = scene.add.text(0, 0, '📖 COME SI GIOCA', {
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

    // Tab bar container (per cambiare tra Computer e Touch)
    this.tabBarContainer = scene.add.container(0, 0);
    this.add(this.tabBarContainer);

    // Container per il contenuto
    this.cardsContainer = scene.add.container(0, 0);
    this.add(this.cardsContainer);

    // Drag globale
    scene.input.on('pointermove', (pointer) => {
      if (!this.isDragging) {
        return;
      }
      const newX = pointer.x - this.dragOffset.x;
      const newY = pointer.y - this.dragOffset.y;

      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      const clampedX = Phaser.Math.Clamp(newX, halfW + 10, scene.scale.width - halfW - 10);
      const clampedY = Phaser.Math.Clamp(newY, halfH + 10, scene.scale.height - halfH - 10);

      this.setPosition(clampedX, clampedY);
      this.customPosition = { x: clampedX, y: clampedY };
    });

    scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Supporto rotella del mouse per lo scroll
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.visible) {
        return;
      }
      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      if (
        pointer.x >= this.x - halfW &&
        pointer.x <= this.x + halfW &&
        pointer.y >= this.y - halfH &&
        pointer.y <= this.y + halfH
      ) {
        this.scroll(deltaY * 0.4);
      }
    });
  }

  scroll(delta) {
    if (this.maxScrollY <= 0) {
      return;
    }
    this.scrollOffsetY = Phaser.Math.Clamp(this.scrollOffsetY + delta, 0, this.maxScrollY);
    this.renderCards();
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
    this.scrollOffsetY = 0;
    this.setVisible(true);
    uiState.helpOpen = true;
    this.scene.bringModalToFront?.(this);
    emit(Events.HELP_OPEN);
    this.layout();
  }

  close() {
    if (!this.visible) {
      return;
    }
    this.isDragging = false;
    this.setVisible(false);
    queueMicrotask(() => {
      uiState.helpOpen = false;
      emit(Events.HELP_CLOSE);
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

    this.boxW = Math.min(520, sw - (isPortrait ? 20 : 36));
    this.boxH = Math.min(420, sh - (isPortrait ? 80 : 50));

    if (this.customPosition) {
      const halfW = this.boxW / 2;
      const halfH = this.boxH / 2;
      const clampedX = Phaser.Math.Clamp(this.customPosition.x, halfW + 10, sw - halfW - 10);
      const clampedY = Phaser.Math.Clamp(this.customPosition.y, halfH + 10, sh - halfH - 10);
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

    // Sfondo principale caldo scuro semi-trasparente
    g.fillStyle(COLORS.panelBg, 0.95);
    g.fillRoundedRect(-halfW, -halfH, w, h, 8);

    // Cornice esterna in cuoio e profilo dorato
    g.lineStyle(2, COLORS.panelBorder, 1);
    g.strokeRoundedRect(-halfW, -halfH, w, h, 8);

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

    // Posizionamento titolo e close button
    this.titleText.setPosition(-halfW + 16, -halfH + 19).setOrigin(0, 0.5);
    this.closeBtnContainer.setPosition(halfW - 20, -halfH + 19);
    this.drawCloseButton(false);
  }

  render() {
    this.renderTabs();
    this.renderCards();
  }

  renderTabs() {
    this.tabBarContainer.removeAll(true);
    const halfH = this.boxH / 2;
    const tabY = -halfH + 54;
    const tabW = Math.min(180, (this.boxW - 36) / 2);

    const tabs = [
      { id: 'desktop', label: '💻 Computer / Mouse' },
      { id: 'touch', label: '📱 Mobile / Touch' }
    ];

    tabs.forEach((tab, index) => {
      const isSelected = this.activeTab === tab.id;
      const tabX = (index === 0 ? -tabW / 2 - 4 : tabW / 2 + 4);
      const container = this.scene.add.container(tabX, tabY);

      const bg = this.scene.add.graphics();
      const drawTab = (hover = false) => {
        bg.clear();
        bg.fillStyle(isSelected ? COLORS.tabActiveBg : (hover ? 0x2a170b : COLORS.tabInactiveBg), 1);
        bg.fillRoundedRect(-tabW / 2, -14, tabW, 28, 5);
        bg.lineStyle(1.5, isSelected ? COLORS.tabActiveBorder : (hover ? COLORS.panelBorderGold : COLORS.tabInactiveBorder), 1);
        bg.strokeRoundedRect(-tabW / 2, -14, tabW, 28, 5);
      };
      drawTab(false);

      const txt = this.scene.add.text(0, 0, tab.label, {
        fontFamily: GAME.font,
        fontSize: '12px',
        color: isSelected ? '#f0c27a' : '#a8917a',
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setOrigin(0.5, 0.5);

      const hit = this.scene.add.zone(0, 0, tabW, 28)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => drawTab(true));
      hit.on('pointerout', () => drawTab(false));
      hit.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) {
          event.stopPropagation();
        }
        this.scene.bringModalToFront?.(this);
        if (this.activeTab !== tab.id) {
          this.activeTab = tab.id;
          this.scrollOffsetY = 0;
          this.render();
        }
      });

      container.add([bg, txt, hit]);
      this.tabBarContainer.add(container);
    });
  }

  getInstructions() {
    if (this.activeTab === 'touch') {
      return [
        {
          icon: '🚶',
          title: 'Movimento Punta-e-Tocca',
          desc: 'Tocca qualsiasi punto del pavimento per camminare fin lì, oppure trascina il dito per guidare continuamente i passi del tuo personaggio.'
        },
        {
          icon: '⚡',
          title: 'Corsa con Doppio Tocco',
          desc: 'Fai un doppio tocco rapido sul pavimento: il personaggio scatterà a tutta velocità (sprint) fino a raggiungere la meta!'
        },
        {
          icon: '💬',
          title: 'Interazione Diretta con NPC e Arredi',
          desc: 'Tocca un personaggio della band o un arredo (amplificatori, mixer, cavi): il personaggio ci andrà direttamente (anche correndo col doppio tocco) e avvierà il dialogo appena arrivato.'
        },
        {
          icon: '🎒',
          title: 'Zaino e Oggetti Raccolti',
          desc: 'Tocca l\'icona dello zaino in alto a destra per aprire l\'inventario e consultare i dettagli degli oggetti.'
        },
        {
          icon: '🎯',
          title: 'Obiettivi e Missioni',
          desc: 'Tocca l\'icona della cartellina in alto a destra per leggere i tuoi obiettivi attivi, le categorie e i prossimi passi.'
        },
        {
          icon: '🪟',
          title: 'Finestre Trascinabili e Simultanee',
          desc: 'Zaino, Obiettivi e Guida possono restare aperti contemporaneamente: puoi spostarli liberamente trascinando la barra superiore o toccare la [✕] per chiuderli.'
        }
      ];
    }

    return [
      {
        icon: '🚶',
        title: 'Movimento del Personaggio',
        desc: 'Fai click col mouse sul pavimento per raggiungere qualsiasi punto con pathfinding automatico, oppure usa i tasti WASD o le Frecce Direzionali.'
      },
      {
        icon: '⚡',
        title: 'Corsa Rapida (Sprint)',
        desc: 'Fai doppio click a terra per correre velocemente verso la destinazione, oppure tieni premuto il tasto SHIFT mentre ti muovi.'
      },
      {
        icon: '💬',
        title: 'Interazione con Personaggi e Arredi',
        desc: 'Clicca su un NPC o un arredo per raggiungerlo e interagire automaticamente (anche correndo col doppio click!). In alternativa, avvicinati e premi E, INVIO o SPAZIO.'
      },
      {
        icon: '🎒',
        title: 'Zaino (Inventario)',
        desc: 'Premi il tasto I (o B), oppure clicca sull\'icona dello zaino in alto a destra. Usa le frecce sinistra/destra per sfogliare gli oggetti.'
      },
      {
        icon: '🎯',
        title: 'Registro Obiettivi (Missioni)',
        desc: 'Premi il tasto O (o M), oppure clicca sull\'icona della cartellina in alto a destra per consultare le missioni attive e completate.'
      },
      {
        icon: '🪟',
        title: 'Finestre Simultanee e Trascinamento',
        desc: 'Puoi tenere aperti insieme Zaino, Obiettivi e Guida! Trascinali afferrando la barra in alto per disporli dove preferisci sullo schermo. Premi ESC per chiuderli.'
      }
    ];
  }

  renderCards() {
    this.cardsContainer.removeAll(true);

    const items = this.getInstructions();
    const halfH = this.boxH / 2;
    const contentTop = -halfH + 74;
    const contentW = this.boxW - 28;
    const viewportH = this.boxH - 86;

    let currentY = contentTop - this.scrollOffsetY;
    let totalHeight = 0;

    items.forEach((item) => {
      const card = this.scene.add.container(-contentW / 2, currentY);
      const bg = this.scene.add.graphics();

      const icon = this.scene.add.text(12, 10, item.icon, {
        fontSize: '18px'
      });

      const title = this.scene.add.text(38, 10, item.title, {
        fontFamily: GAME.font,
        fontSize: '13px',
        color: '#f0c27a',
        fontStyle: 'bold'
      });

      const desc = this.scene.add.text(12, 32, item.desc, {
        fontFamily: GAME.font,
        fontSize: '12px',
        color: '#f2e6d2',
        lineSpacing: 3,
        wordWrap: { width: contentW - 24 }
      });

      const cardH = 36 + desc.height + 10;

      bg.fillStyle(COLORS.cardBg, 0.9);
      bg.fillRoundedRect(0, 0, contentW, cardH, 6);
      bg.lineStyle(1.2, COLORS.cardBorder, 1);
      bg.strokeRoundedRect(0, 0, contentW, cardH, 6);

      card.add([bg, icon, title, desc]);

      // Mostra la card solo se ricade nell'area visibile del viewport
      const cardTopInBox = currentY;
      const cardBottomInBox = currentY + cardH;
      if (cardBottomInBox >= -halfH + 74 && cardTopInBox <= halfH - 12) {
        card.setVisible(true);
      } else {
        card.setVisible(false);
      }

      this.cardsContainer.add(card);

      const gap = 8;
      currentY += cardH + gap;
      totalHeight += cardH + gap;
    });

    this.maxScrollY = Math.max(0, totalHeight - viewportH);
  }
}
