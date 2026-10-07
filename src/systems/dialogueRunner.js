import { DEFAULT_CHARACTER_ID } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { getCharacter } from '../game/characters.js';
import { MAX_OPTIONS, resolveEntry, resolveNext } from '../game/dialogue.js';

/**
 * Guida una conversazione.
 *
 * Per un NPC apre il grafo dei dialoghi (`src/data/dialogues/`): tiene il nodo
 * corrente, emette le battute con `DIALOGUE_NODE` e, quando il giocatore
 * sceglie una risposta (`DIALOGUE_CHOICE`), prepone la battuta scelta a quelle
 * del nodo successivo. Per un arredo emette le pagine di descrizione con
 * `DIALOGUE_SAY`, come prima.
 *
 * Finché una conversazione con un NPC è aperta alza `uiState.dialogueLocked`:
 * il giocatore è fermo finché non finisce o sceglie di uscire. Le descrizioni
 * degli arredi non bloccano nulla.
 *
 * Lo stato vive finché il dialogo è aperto: `DIALOGUE_CLOSED` (fine naturale o
 * allontanamento) lo azzera.
 */
export default class DialogueRunner {
  constructor(scene) {
    this.scene = scene;
    this.state = null;
    this.unsubscribe = null;
  }

  start(target) {
    this.stop();

    if (!target) {
      return false;
    }

    if (typeof target.faceTowards === 'function' && this.scene.player) {
      target.faceTowards(this.scene.player.x, this.scene.player.y);
    }

    const character = target.character ?? null;

    if (!character) {
      return this.describeProp(target);
    }

    const listenerId = this.listenerId();
    const entry = resolveEntry(character, listenerId);

    if (!entry) {
      return false;
    }

    this.subscribe();
    this.state = { character, listenerId, nodeId: entry.nodeId, options: entry.options };
    uiState.dialogueLocked = true;
    this.emitNode(entry.lines, entry.options);
    return true;
  }

  choose(payload) {
    const state = this.state;

    if (!state || !Array.isArray(state.options)) {
      return;
    }

    const index = Number.isInteger(payload?.index) ? payload.index : -1;
    const option = state.options[index];

    if (!option) {
      return;
    }

    const next = option.next ? resolveNext(state.character, option.next) : null;

    if (!next) {
      emit(Events.DIALOGUE_CLOSED);
      return;
    }

    const player = getCharacter(this.listenerId());
    this.state = { ...state, nodeId: next.nodeId, options: next.options };
    this.emitNode(
      [{ speaker: player.name, speakerId: player.id, text: option.text }, ...next.lines],
      next.options
    );
  }

  listenerId() {
    return this.scene.registry.get('currentCharacterId') ?? DEFAULT_CHARACTER_ID;
  }

  describeProp(target) {
    if (typeof target.describe !== 'function') {
      return false;
    }

    const payload = target.describe();
    const pages = (Array.isArray(payload) ? payload : [payload]).filter(
      (page) => page && typeof page.text === 'string'
    );

    if (pages.length === 0) {
      return false;
    }

    for (const page of pages) {
      emit(Events.DIALOGUE_SAY, page);
    }

    return true;
  }

  emitNode(lines, options) {
    const labels = Array.isArray(options)
      ? options.slice(0, MAX_OPTIONS).map((option) => option.text)
      : [];

    emit(Events.DIALOGUE_NODE, {
      lines,
      options: labels.length > 0 ? labels : null
    });
  }

  subscribe() {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = [
      on(Events.DIALOGUE_CHOICE, (payload) => this.choose(payload)),
      on(Events.DIALOGUE_CLOSED, () => this.stop())
    ];
  }

  stop() {
    this.state = null;
    uiState.dialogueLocked = false;

    if (this.unsubscribe) {
      for (const off of this.unsubscribe) {
        off();
      }

      this.unsubscribe = null;
    }
  }

  destroy() {
    this.stop();
  }
}
