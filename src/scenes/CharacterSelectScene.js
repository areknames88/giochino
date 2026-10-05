import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit } from '../core/eventBus.js';
import { createControls, isTouchPrimary } from '../core/input.js';
import {
  characterTextureKey,
  getCharacter,
  listPlayableCharacters,
  resolveForcedCharacterId
} from '../game/characters.js';
import { ensureCharacterAssets } from '../gfx/characterArt.js';

const PANEL_STYLE = {
  fontFamily: GAME.font,
  fontSize: '15px',
  color: '#e8d9c3'
};

const LAYOUTS = {
  landscape: {
    columns: 4,
    card: { width: 176, height: 226 },
    gridTop: null,
    buttonGap: 72,
    feetInset: 64,
    nameInset: 52,
    taglineInset: 32
  },
  portrait: {
    columns: 2,
    card: { width: 200, height: 232 },
    gridTop: 120,
    buttonGap: 90,
    feetInset: 70,
    nameInset: 58,
    taglineInset: 36
  }
};

const CARD_GAP = 18;
const BUTTON = { width: 280, height: 56 };
const PANEL_FILL = 0x140d07;
const PANEL_EDGE = 0x6b4220;
const PANEL_HIGHLIGHT = 0xf0c27a;

/**
 * Scelta del personaggio: una scheda per ogni giocabile, disegnata dagli stessi
 * JSON che userà la stanza. Un tocco sceglie la scheda, il bottone entra nel
 * gioco. `?char=<id>` salta la schermata.
 */
export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelect');
  }

  init() {
    this.characters = listPlayableCharacters();
    this.selectedIndex = 0;
    this.touchFirst = isTouchPrimary();

    const forced = resolveForcedCharacterId();
    this.forcedCharacter = forced ? getCharacter(forced) : null;
  }

  create() {
    if (this.forcedCharacter) {
      this.confirm(this.forcedCharacter);
      return;
    }

    for (const character of this.characters) {
      ensureCharacterAssets(this, character);
    }

    this.background = this.add.graphics();
    this.title = this.add
      .text(0, 0, GAME.title, {
        ...PANEL_STYLE,
        fontSize: '26px',
        color: '#f0c27a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);
    this.subtitle = this.add
      .text(0, 0, 'Scegli chi sei', { ...PANEL_STYLE, fontSize: '16px', color: '#a8917a' })
      .setOrigin(0.5, 0);

    this.cards = this.characters.map((character) => this.buildCard(character));
    this.button = this.buildButton();
    this.hint = this.add
      .text(0, 0, '', {
        ...PANEL_STYLE,
        fontSize: '12px',
        color: '#7d6a56',
        align: 'center'
      })
      .setOrigin(0.5, 1);

    this.controls = createControls(this.input.keyboard, GAME.controls);

    this.registerKeyboard();

    this.layout();
    this.select(0);

    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.layout());
  }

  registerKeyboard() {
    const bind = (key, fn) => this.input.keyboard.on(`keydown-${key}`, fn);

    bind('LEFT', () => this.moveSelection(-1, 0));
    bind('RIGHT', () => this.moveSelection(1, 0));
    bind('UP', () => this.moveSelection(0, -1));
    bind('DOWN', () => this.moveSelection(0, 1));
    bind('A', () => this.moveSelection(-1, 0));
    bind('D', () => this.moveSelection(1, 0));
    bind('W', () => this.moveSelection(0, -1));
    bind('S', () => this.moveSelection(0, 1));

    bind('ENTER', () => this.confirmSelected());
    bind('SPACE', () => this.confirmSelected());
    bind('E', () => this.confirmSelected());
  }

  confirmSelected() {
    const card = this.cards[this.selectedIndex];
    if (card) {
      this.confirm(card.getData('character'));
    }
  }

  buildCard(character) {
    const container = this.add.container(0, 0);

    const panel = this.add.graphics();
    const sprite = this.add
      .sprite(0, 0, characterTextureKey(character.id), 0)
      .setOrigin(0.5, 1)
      .setScale(GAME.selection.spriteScale);
    const name = this.add
      .text(0, 0, character.name, {
        ...PANEL_STYLE,
        fontSize: '19px',
        color: '#f0c27a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 1);
    const tagline = this.add
      .text(0, 0, character.tagline ?? '', {
        ...PANEL_STYLE,
        fontSize: '12px',
        color: '#a8917a',
        align: 'center',
        lineSpacing: 2
      })
      .setOrigin(0.5, 1);

    container.add([panel, sprite, name, tagline]);
    container.setData('character', character);

    return container;
  }

  buildButton() {
    const button = this.add.container(0, 0);
    const panel = this.add.graphics();
    const label = this.add
      .text(0, 0, 'Entra', {
        ...PANEL_STYLE,
        fontSize: '20px',
        color: '#1b1208',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0.5);

    button.add([panel, label]);

    this.buttonPanel = panel;

    return button;
  }

  layout() {
    const portrait = this.scale.height > this.scale.width;
    const preset = portrait ? LAYOUTS.portrait : LAYOUTS.landscape;
    const { card, columns } = preset;
    const rows = Math.ceil(this.cards.length / columns);
    const gridWidth = columns * card.width + (columns - 1) * CARD_GAP;
    const gridHeight = rows * card.height + (rows - 1) * CARD_GAP;
    const gridLeft = (this.scale.width - gridWidth) / 2;
    const gridTop =
      preset.gridTop ?? Math.max(92, (this.scale.height - gridHeight) / 2 - 18);

    this.columns = columns;
    this.cardSize = card;

    this.background.clear();
    this.background.fillStyle(0x1b1208, 1);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.fillStyle(0x241708, 0.85);
    this.background.fillRect(0, gridTop - 26, this.scale.width, gridHeight + 52);
    this.background.fillStyle(0x3a2411, 0.55);
    this.background.fillRect(gridLeft - 12, gridTop + gridHeight + 8, gridWidth + 24, 3);

    this.title.setPosition(this.scale.width / 2, portrait ? 26 : 20);
    this.subtitle.setPosition(this.scale.width / 2, portrait ? 62 : 52);

    this.cards.forEach((container, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = gridLeft + column * (card.width + CARD_GAP);
      const y = gridTop + row * (card.height + CARD_GAP);

      container.setPosition(x, y);
      container.setData('index', index);
      container.setData('rect', new Phaser.Geom.Rectangle(x, y, card.width, card.height));

      container.getAt(1).setPosition(card.width / 2, card.height - preset.feetInset);
      container.getAt(2).setPosition(card.width / 2, card.height - preset.nameInset);

      const tagline = container.getAt(3);
      tagline.setWordWrapWidth(card.width - 24);
      tagline.setPosition(card.width / 2, card.height - preset.taglineInset);
    });

    const buttonY = Math.min(
      this.scale.height - 52,
      gridTop + gridHeight + preset.buttonGap
    );

    this.button.setPosition(this.scale.width / 2, buttonY);
    this.buttonRect = new Phaser.Geom.Rectangle(
      this.button.x - BUTTON.width / 2,
      this.button.y - BUTTON.height / 2,
      BUTTON.width,
      BUTTON.height
    );

    this.buttonPanel.clear();
    this.buttonPanel.fillStyle(0xf0c27a, 1);
    this.buttonPanel.fillRoundedRect(
      -BUTTON.width / 2,
      -BUTTON.height / 2,
      BUTTON.width,
      BUTTON.height,
      8
    );
    this.buttonPanel.lineStyle(3, 0x8b5a2b, 1);
    this.buttonPanel.strokeRoundedRect(
      -BUTTON.width / 2,
      -BUTTON.height / 2,
      BUTTON.width,
      BUTTON.height,
      8
    );

    this.hint.setPosition(this.scale.width / 2, this.scale.height - (portrait ? 24 : 16));
    this.hint.setText(
      this.touchFirst
        ? 'tocca una scheda per scegliere, poi Entra'
        : 'frecce o A D  scegli    INVIO  entra'
    );

    this.drawSelectedCard();
  }

  drawSelectedCard() {
    this.cards.forEach((container, index) => {
      const { width, height } = this.cardSize;
      const panel = container.getAt(0);
      const sprite = container.getAt(1);
      const selected = index === this.selectedIndex;

      panel.clear();
      panel.fillStyle(PANEL_FILL, selected ? 0.96 : 0.82);
      panel.fillRoundedRect(0, 0, width, height, 10);
      panel.lineStyle(selected ? 4 : 2, selected ? PANEL_HIGHLIGHT : PANEL_EDGE, 1);
      panel.strokeRoundedRect(0, 0, width, height, 10);
      panel.fillStyle(selected ? PANEL_HIGHLIGHT : 0x8b5a2b, selected ? 0.85 : 0.5);
      panel.fillRect(10, 3, width - 20, 2);

      sprite.setScale(selected ? GAME.selection.selectedSpriteScale : GAME.selection.spriteScale);
    });
  }

  select(index) {
    this.selectedIndex = index;
    this.drawSelectedCard();
  }

  moveSelection(dx, dy) {
    const current = this.selectedIndex;
    const next = current + dx + dy * this.columns;

    if (dx < 0 && current % this.columns === 0) {
      return;
    }

    if (dx > 0 && current % this.columns === this.columns - 1) {
      return;
    }

    if (next < 0 || next >= this.cards.length) {
      return;
    }

    this.select(next);
  }

  handlePointerDown(pointer) {
    if (this.buttonRect && Phaser.Geom.Rectangle.Contains(this.buttonRect, pointer.x, pointer.y)) {
      this.confirm(this.cards[this.selectedIndex].getData('character'));
      return;
    }

    const card = this.cards.find((container) =>
      Phaser.Geom.Rectangle.Contains(container.getData('rect'), pointer.x, pointer.y)
    );

    if (card) {
      this.select(card.getData('index'));
    }
  }

  confirm(character) {
    const chosen = getCharacter(character.id);

    this.registry.set('currentCharacterId', chosen.id);
    emit(Events.CHARACTER_SELECTED, chosen);

    this.scene.launch('Hud');
    this.scene.start('Room');
  }

  update() {
    // Navigazione e conferma gestite tramite event listeners in registerKeyboard()
  }
}
