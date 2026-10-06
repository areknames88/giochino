import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { MAX_OPTIONS } from '../game/dialogue.js';

/**
 * Riquadro dei dialoghi: una sola box in basso, avatar quadrato a sinistra di
 * chi parla (stile Baldur's Gate), risposte elencate SOTTO il testo dentro la
 * stessa box, e una riga di uscita sempre presente quando ci sono risposte.
 *
 * Toccare il testo (o `E`/`INVIO`) avanza; le risposte si scelgono col tap o
 * con i tasti `1`–`3`; `ESC` o la riga "Esci" chiudono la conversazione.
 */

const COLORS = {
  panel: 0x150e08,
  panelTop: 0x221609,
  panelStroke: 0x8b5a2b,
  panelInner: 0x3a2614,
  accent: 0xa8703a,
  divider: 0x4a301a,
  dividerAccent: 0xc08a4a,
  rowBg: 0x211508,
  rowStroke: 0x5a3a1e,
  rowHoverBg: 0x3a2510,
  rowHoverStroke: 0xc08a4a,
  exitBg: 0x1a1109,
  exitHoverBg: 0x2c1c0d,
  badgeBg: 0x8b5a2b,
  badgeStroke: 0xc9a05a
};

const OPTION_STYLE = {
  fontFamily: GAME.font,
  color: '#efdfc4'
};

const EXIT_STYLE = {
  fontFamily: GAME.font,
  color: '#c99b6a',
  fontStyle: 'italic'
};

const HINT_STYLE = {
  fontFamily: GAME.font,
  color: '#9a7f5e',
  fontStyle: 'bold'
};

export default class DialogueBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, scene.scale.width / 2, scene.scale.height - 18);
    scene.add.existing(this);

    this.queue = [];
    this.current = null;
    this.pendingOptions = null;
    this.optionsShowing = false;
    this.suppressAdvance = false;
    this.isNpcConversation = false;
    this.rows = [];
    this.optionRows = [];
    this.optionsTop = 0;
    this.visible = false;

    this.panel = scene.add.graphics();

    this.avatar = scene.add.image(0, 0, 'avatar-generic').setOrigin(0, 0).setVisible(false);

    this.speaker = scene.add
      .text(0, 0, '', {
        fontFamily: GAME.font,
        fontSize: '18px',
        color: '#f0c27a',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.body = scene.add
      .text(0, 0, '', {
        fontFamily: GAME.font,
        fontSize: '16px',
        color: '#f2e6d2',
        lineSpacing: 6
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

    this.add([this.panel, this.avatar, this.speaker, this.body, this.continueMark]);

    this.layout();
    this.setVisible(false);

    this.unsubscribe = [
      on(Events.DIALOGUE_SAY, (payload) => this.say(payload)),
      on(Events.DIALOGUE_NODE, (payload) => this.node(payload)),
      on(Events.DIALOGUE_ADVANCE, () => this.advance()),
      on(Events.DIALOGUE_CLOSED, () => this.close())
    ];

    this.optionKeys = ['ONE', 'TWO', 'THREE'].map((name, index) => {
      const handler = () => this.pickOption(index);
      scene.input.keyboard?.on(`keydown-${name}`, handler);
      return { name, handler };
    });

    this.escapeHandler = () => this.exitConversation();
    scene.input.keyboard?.on('keydown-ESC', this.escapeHandler);

    scene.scale.on(Phaser.Scale.Events.RESIZE, () => {
      if (this.optionsShowing) {
        this.clearOptions();
        this.renderOptions();
      } else {
        this.layout();
      }
    });
  }

  /** Dimensioni correnti in base all'orientamento: usate da layout e righe. */
  measure() {
    const { width, height } = this.scene.scale;
    const isPortrait = height > width;

    return {
      isPortrait,
      boxWidth: isPortrait ? Math.min(500, width - 24) : Math.min(760, width - 24),
      pad: isPortrait ? 16 : 20,
      avatarSize: isPortrait ? 70 : 76,
      minHeight: isPortrait ? 156 : 148,
      bottomOffset: isPortrait ? 24 : 18,
      speakerFontSize: isPortrait ? '22px' : '18px',
      bodyFontSize: isPortrait ? '21px' : '16px',
      bodyLineSpacing: 6,
      continueMarkFontSize: isPortrait ? '15px' : '13px',
      optionFontSize: isPortrait ? '19px' : '15px',
      optionLineSpacing: isPortrait ? 3 : 2,
      exitFontSize: isPortrait ? '17px' : '14px',
      badgeFontSize: isPortrait ? '14px' : '13px',
      badgeSize: isPortrait ? 26 : 20,
      badgeCenterX: isPortrait ? 22 : 20,
      labelXOffset: isPortrait ? 48 : 40,
      hintFontSize: isPortrait ? '13px' : '11px',
      rowMinHeight: isPortrait ? 44 : 30,
      rowPaddingY: isPortrait ? 18 : 14,
      rowGap: isPortrait ? 8 : 6,
      exitGap: isPortrait ? 12 : 10
    };
  }

  layout() {
    const metrics = this.measure();
    const { isPortrait, boxWidth, pad, avatarSize, minHeight, bottomOffset } = metrics;

    this.boxWidth = boxWidth;
    this.padding = pad;
    this.avatarSize = avatarSize;

    const { width, height } = this.scene.scale;
    this.setPosition(width / 2, height - bottomOffset);

    // Aggiorna le dimensioni tipografiche in base all'orientamento
    this.speaker.setFontSize(metrics.speakerFontSize);
    this.body.setFontSize(metrics.bodyFontSize);
    this.body.setLineSpacing(metrics.bodyLineSpacing);
    this.continueMark.setFontSize(metrics.continueMarkFontSize);

    const left = -boxWidth / 2;

    // Avatar: presente solo per chi ha un id parlante con texture dedicata.
    let hasAvatar = false;
    const speakerKey = this.current?.speakerId
      ? `avatar-${this.current.speakerId.toLowerCase()}`
      : (this.current?.speaker ? `avatar-${this.current.speaker.toLowerCase()}` : null);

    if (speakerKey && this.scene.textures.exists(speakerKey)) {
      hasAvatar = true;
      this.avatar.setTexture(speakerKey);
    }

    this.avatar.setVisible(hasAvatar);
    this.contentLeft = left + pad + (hasAvatar ? avatarSize + 14 : 0);
    const wrapWidth = boxWidth - (this.contentLeft - left) - pad;
    this.body.setWordWrapWidth(wrapWidth);

    const nameH = this.speaker.text ? Math.max(this.speaker.height, isPortrait ? 22 : 18) : 0;
    const bodyH = this.body.height;
    const textH = this.speaker.text ? (nameH + 6 + bodyH) : bodyH;
    const contentH = Math.max(textH, hasAvatar ? avatarSize : 0);
    this.contentH = contentH;

    let boxHeight;
    if (this.optionsShowing && this.rows.length > 0) {
      this.optionsTop = pad + contentH + 8;
      boxHeight = this.optionsTop + 8 + 1 + 7 + this.rowsHeight() + pad;
    } else {
      this.optionsTop = 0;
      boxHeight = Math.max(minHeight, pad + contentH + 18 + pad);
    }

    this.boxHeight = boxHeight;

    this.drawPanel(nameH);

    const boxTop = -boxHeight;

    if (hasAvatar) {
      this.avatar
        .setDisplaySize(avatarSize, avatarSize)
        .setPosition(left + pad, boxTop + pad);
    }

    this.speaker.setPosition(this.contentLeft, boxTop + pad);
    this.body.setPosition(this.contentLeft, boxTop + pad + (this.speaker.text ? nameH + 6 : 0));
    this.continueMark.setPosition(left + boxWidth - pad - 4, boxTop + boxHeight - 10);

    if (this.optionsShowing && this.rows.length > 0) {
      this.layoutRows(left, boxTop);
    }
  }

  rowsHeight() {
    if (this.rows.length === 0) {
      return 0;
    }

    const { rowGap, exitGap } = this.measure();
    const options = this.rows.filter((row) => row.kind === 'option');
    const exit = this.rows.find((row) => row.kind === 'exit');
    const gaps = rowGap * Math.max(0, options.length - 1);

    return options.reduce((sum, row) => sum + row.height, 0)
      + gaps
      + (exit ? (options.length > 0 ? exitGap : 0) + exit.height : 0);
  }

  drawPanel(nameH) {
    const w = this.boxWidth;
    const h = this.boxHeight;
    const pad = this.padding;
    const left = -w / 2;
    const top = -h;

    this.panel.clear();

    // Fondo con fascia superiore più chiara (simula una luce dall'alto).
    this.panel.fillStyle(COLORS.panel, 0.97);
    this.panel.fillRoundedRect(left, top, w, h, 12);
    this.panel.fillStyle(COLORS.panelTop, 0.75);
    this.panel.fillRoundedRect(left + 4, top + 4, w - 8, 44, 9);

    // Doppio bordo: oro esterno, filetto scuro interno.
    this.panel.lineStyle(2, COLORS.panelStroke, 1);
    this.panel.strokeRoundedRect(left + 1, top + 1, w - 2, h - 2, 11);
    this.panel.lineStyle(1, COLORS.panelInner, 1);
    this.panel.strokeRoundedRect(left + 4.5, top + 4.5, w - 9, h - 9, 8);

    // Filetto sotto il nome di chi parla.
    if (this.speaker.text) {
      const lineY = top + pad + nameH + 1;
      const lineW = Math.min(this.speaker.width, w * 0.5);
      this.panel.fillStyle(COLORS.accent, 0.9);
      this.panel.fillRect(this.contentLeft, lineY, lineW, 2);
    }

    // Cornice dell'avatar.
    if (this.avatar.visible) {
      const ax = left + pad;
      const ay = top + pad;
      const s = this.avatarSize;
      this.panel.fillStyle(0x0d0906, 1);
      this.panel.fillRect(ax - 3, ay - 3, s + 6, s + 6);
      this.panel.lineStyle(3, COLORS.panelStroke, 1);
      this.panel.strokeRect(ax - 3, ay - 3, s + 6, s + 6);
      this.panel.lineStyle(1, COLORS.dividerAccent, 0.6);
      this.panel.strokeRect(ax - 1, ay - 1, s + 2, s + 2);
    }

    // Separatore fra testo e risposte.
    if (this.optionsShowing && this.rows.length > 0) {
      const y = top + this.optionsTop;
      this.panel.fillStyle(COLORS.divider, 1);
      this.panel.fillRect(left + pad, y, w - pad * 2, 1);
      this.panel.fillStyle(COLORS.dividerAccent, 0.9);
      this.panel.fillRect(left + pad, y, 56, 1);
    }
  }

  layoutRows(left, top) {
    const { isPortrait, pad, labelXOffset, badgeCenterX, rowGap, exitGap, boxWidth } = this.measure();
    const labelX = left + pad + labelXOffset;
    const badgeX = left + pad + badgeCenterX;
    const optionsCount = this.rows.filter((r) => r.kind === 'option').length;
    let y = top + this.optionsTop + 8;

    for (const row of this.rows) {
      if (row.kind === 'exit' && optionsCount > 0) {
        y += (exitGap - rowGap);
      }

      const centerY = y + row.height / 2;
      row.hit.setPosition(0, centerY);

      if (row.kind === 'option') {
        row.badge.setPosition(badgeX, centerY);
        row.badgeText.setPosition(badgeX, centerY + 1);
        row.text.setPosition(labelX, y + (row.height - row.text.height) / 2);
      } else {
        row.text.setPosition(labelX, y + (row.height - row.text.height) / 2);
        row.hint.setPosition(left + boxWidth - pad - (isPortrait ? 18 : 16), centerY);
      }

      y += row.height + rowGap;
    }
  }

  say({ speaker, speakerId, text }) {
    this.isNpcConversation = false;
    this.queue.push({ speaker: speaker ?? '', speakerId: speakerId ?? null, text: text ?? '' });

    if (!this.visible) {
      this.openNext();
    }
  }

  /**
   * Un nodo del grafo dei dialoghi: battute da mostrare in coda e, alla fine,
   * eventuali risposte del giocatore da scegliere.
   */
  node({ lines, options }) {
    this.isNpcConversation = true;
    for (const line of lines ?? []) {
      if (line && typeof line.text === 'string') {
        this.queue.push({
          speaker: line.speaker ?? '',
          speakerId: line.speakerId ?? null,
          text: line.text
        });
      }
    }

    this.pendingOptions = Array.isArray(options) && options.length > 0
      ? options.slice(0, MAX_OPTIONS)
      : null;

    if (!this.visible || this.optionsShowing) {
      this.openNext();
    }
  }

  openNext() {
    this.clearOptions();

    const next = this.queue.shift();

    if (!next) {
      if (this.pendingOptions || this.isNpcConversation) {
        this.renderOptions();
        return;
      }

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

    // Se siamo arrivati all'ultima battuta della conversazione con l'NPC,
    // mostriamo subito le opzioni (o la sola riga di uscita se non ci sono scelte):
    // in questo modo la conversazione si chiude solo col tasto "Esci" / ESC e un click
    // accidentale sulla mappa non chiude il dialogo né fa muovere il personaggio.
    if (this.isNpcConversation && this.queue.length === 0) {
      this.renderOptions();
    }
  }

  get isBusy() {
    return this.visible;
  }

  advance() {
    if (this.suppressAdvance || !this.visible || this.optionsShowing) {
      return;
    }

    this.openNext();
  }

  renderOptions() {
    const options = this.pendingOptions ?? [];

    if (options.length === 0 && !this.isNpcConversation) {
      this.close();
      return;
    }

    const {
      isPortrait,
      boxWidth,
      pad,
      optionFontSize,
      optionLineSpacing,
      exitFontSize,
      badgeFontSize,
      badgeSize,
      hintFontSize,
      rowMinHeight,
      rowPaddingY
    } = this.measure();

    const rowWrap = boxWidth - pad * 2 - (isPortrait ? 58 : 48);
    const hitWidth = boxWidth - pad * 2;

    this.optionsShowing = true;
    uiState.dialogueOptionsOpen = true;
    this.continueMark.setAlpha(0);
    this.rows = [];
    this.optionRows = [];

    options.forEach((label, index) => {
      const text = this.scene.add
        .text(0, 0, label, {
          ...OPTION_STYLE,
          fontSize: optionFontSize,
          lineSpacing: optionLineSpacing,
          wordWrap: { width: rowWrap }
        })
        .setOrigin(0, 0);
      const height = Math.max(rowMinHeight, text.height + rowPaddingY);

      const hit = this.scene.add
        .rectangle(0, 0, hitWidth, height, COLORS.rowBg, 0.96)
        .setStrokeStyle(1, COLORS.rowStroke);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.pickOption(index));
      hit.on('pointerover', () => this.setRowHover(row, true));
      hit.on('pointerout', () => this.setRowHover(row, false));

      const badge = this.scene.add
        .rectangle(0, 0, badgeSize, badgeSize, COLORS.badgeBg, 1)
        .setStrokeStyle(1, COLORS.badgeStroke);
      const badgeText = this.scene.add
        .text(0, 0, String(index + 1), {
          fontFamily: GAME.font,
          fontSize: badgeFontSize,
          color: '#f7e7cf',
          fontStyle: 'bold'
        })
        .setOrigin(0.5, 0.5);

      const row = { index, kind: 'option', hit, text, badge, badgeText, height };
      this.rows.push(row);
      this.optionRows.push(hit, text, badge, badgeText);
      this.add([hit, badge, badgeText, text]);
    });

    const exitWrap = boxWidth - pad * 2 - (isPortrait ? 80 : 70);
    const exitText = this.scene.add
      .text(0, 0, 'Esci dalla conversazione', {
        ...EXIT_STYLE,
        fontSize: exitFontSize,
        wordWrap: { width: exitWrap }
      })
      .setOrigin(0, 0);
    const exitHeight = Math.max(rowMinHeight, exitText.height + rowPaddingY);

    const exitHit = this.scene.add
      .rectangle(0, 0, hitWidth, exitHeight, COLORS.exitBg, 0.9)
      .setStrokeStyle(1, COLORS.rowStroke);
    exitHit.setInteractive({ useHandCursor: true });
    exitHit.on('pointerdown', () => this.exitConversation());
    exitHit.on('pointerover', () => this.setRowHover(exitRow, true));
    exitHit.on('pointerout', () => this.setRowHover(exitRow, false));

    const exitHint = this.scene.add
      .text(0, 0, 'ESC', {
        ...HINT_STYLE,
        fontSize: hintFontSize
      })
      .setOrigin(1, 0.5);

    const exitRow = { kind: 'exit', hit: exitHit, text: exitText, hint: exitHint, height: exitHeight };
    this.rows.push(exitRow);
    this.optionRows.push(exitHit, exitText, exitHint);
    this.add([exitHit, exitText, exitHint]);

    this.layout();
  }

  setRowHover(row, hovered) {
    if (row.kind === 'option') {
      row.hit.setFillStyle(hovered ? COLORS.rowHoverBg : COLORS.rowBg, hovered ? 1 : 0.96);
      row.hit.setStrokeStyle(hovered ? 2 : 1, hovered ? COLORS.rowHoverStroke : COLORS.rowStroke);
      row.text.setColor(hovered ? '#ffe9c4' : OPTION_STYLE.color);
      row.badge.setFillStyle(hovered ? 0xa06a34 : COLORS.badgeBg, 1);
      return;
    }

    row.hit.setFillStyle(hovered ? COLORS.exitHoverBg : COLORS.exitBg, hovered ? 1 : 0.9);
    row.hit.setStrokeStyle(hovered ? 1 : 1, hovered ? COLORS.panelStroke : COLORS.rowStroke);
    row.text.setColor(hovered ? '#e8bb8d' : EXIT_STYLE.color);
  }

  pickOption(index) {
    if (!this.visible || !this.optionsShowing) {
      return;
    }

    // Phaser emette prima l'evento sul rettangolo e poi quello di scena: senza
    // sopprimere, lo stesso tocco che sceglie un'opzione avanzerebbe anche la
    // prima battuta del nodo successivo. Il microtask ripristina il flag appena
    // finisce l'elaborazione sincrona del tocco.
    this.suppressAdvance = true;
    queueMicrotask(() => {
      this.suppressAdvance = false;
    });

    emit(Events.DIALOGUE_CHOICE, { index });
  }

  /**
   * Uscita dal dialogo (riga "Esci" o `ESC`). La chiusura è rimandata a un
   * microtask: durante lo stesso pointerdown le scene devono ancora vedere il
   * dialogo aperto, altrimenti il tap che chiude partirebbe come tap sul
   * pavimento e il personaggio comincerebbe a camminare.
   */
  exitConversation() {
    if (!this.visible) {
      return;
    }

    queueMicrotask(() => this.close());
  }

  clearOptions() {
    for (const row of this.optionRows) {
      row.destroy();
    }

    this.optionRows = [];
    this.rows = [];
    this.optionsShowing = false;
    uiState.dialogueOptionsOpen = false;
  }

  close() {
    if (!this.visible) {
      return;
    }

    this.current = null;
    this.queue.length = 0;
    this.pendingOptions = null;
    this.isNpcConversation = false;
    this.clearOptions();
    this.setVisible(false);
    this.avatar.setVisible(false);
    this.continueMark.setAlpha(0);
    uiState.dialogueOpen = false;
    emit(Events.DIALOGUE_CLOSED);
  }

  update(time) {
    if (!this.visible || this.optionsShowing) {
      return;
    }

    this.continueMark.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(time / 320)));
  }

  destroy(fromScene) {
    for (const off of this.unsubscribe) {
      off();
    }

    for (const { name, handler } of this.optionKeys) {
      this.scene.input.keyboard?.off(`keydown-${name}`, handler);
    }

    this.scene.input.keyboard?.off('keydown-ESC', this.escapeHandler);

    this.clearOptions();

    super.destroy(fromScene);
  }
}
