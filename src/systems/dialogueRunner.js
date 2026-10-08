import { DEFAULT_CHARACTER_ID } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { uiState } from '../core/uiState.js';
import { getCharacter } from '../game/characters.js';
import { MAX_OPTIONS, resolveEntry, resolveNext } from '../game/dialogue.js';
import { inventory } from '../game/inventory.js';

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

  filterOptions(options, isProp, target, nodes) {
    if (!Array.isArray(options)) {
      return null;
    }

    const available = options.filter((option) => {
      if (!option.next) {
        return true;
      }
      if (isProp) {
        const nextNode = nodes?.[option.next];
        if (nextNode?.giveItem && inventory.hasItem(nextNode.giveItem)) {
          return false;
        }
      } else {
        const nextNode = resolveNext(target, option.next);
        if (nextNode?.giveItem && inventory.hasItem(nextNode.giveItem)) {
          return false;
        }
      }
      return true;
    });

    return available.length > 0 ? available : null;
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
      if (typeof target.hasOptions === 'function' && target.hasOptions()) {
        return this.startPropDialogue(target);
      }
      return this.describeProp(target);
    }

    const listenerId = this.listenerId();
    const entry = resolveEntry(character, listenerId);

    if (!entry) {
      return false;
    }

    this.subscribe();
    const options = this.filterOptions(entry.options, false, character, null);
    this.state = { isProp: false, character, listenerId, nodeId: entry.nodeId, options };
    uiState.dialogueLocked = true;
    this.emitNode(entry.lines, options, true);
    return true;
  }

  startPropDialogue(prop) {
    this.subscribe();
    const options = this.filterOptions(prop.options, true, prop, prop.nodes);
    this.state = {
      isProp: true,
      prop,
      nodeId: '__root__',
      options,
      nodes: prop.nodes ?? {}
    };
    uiState.dialogueLocked = true;

    const lines = [{
      speaker: prop.label,
      text: prop.description
    }];

    this.emitNode(lines, options, false);
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

    if (state.isProp) {
      if (!option.next || !state.nodes || !state.nodes[option.next]) {
        emit(Events.DIALOGUE_CLOSED);
        return;
      }

      const nextNode = state.nodes[option.next];
      if (nextNode.giveItem) {
        inventory.addItem(nextNode.giveItem);
      }
      if (nextNode.removeProp || nextNode.giveItem) {
        emit(Events.PROP_REMOVED, { prop: state.prop });
        emit(Events.DIALOGUE_CLOSED);
        return;
      }

      const player = getCharacter(this.listenerId());
      const playerLine = { speaker: player.name, speakerId: player.id, text: option.text };

      const rawLines = Array.isArray(nextNode.lines) ? nextNode.lines : [];
      const normalizedLines = rawLines.map((line) => {
        if (typeof line === 'string') {
          return { speaker: state.prop.label, text: line };
        }
        return {
          speaker: line.speaker ?? state.prop.label,
          text: line.text ?? ''
        };
      });

      const nextOptions = this.filterOptions(nextNode.options, true, state.prop, state.nodes);

      this.state = {
        ...state,
        nodeId: option.next,
        options: nextOptions
      };

      this.emitNode(
        [playerLine, ...normalizedLines],
        nextOptions,
        false
      );
      return;
    }

    const next = option.next ? resolveNext(state.character, option.next) : null;

    if (!next) {
      emit(Events.DIALOGUE_CLOSED);
      return;
    }

    if (next.giveItem) {
      inventory.addItem(next.giveItem);
    }

    const player = getCharacter(this.listenerId());
    const nextOptions = this.filterOptions(next.options, false, state.character, null);
    this.state = { ...state, nodeId: next.nodeId, options: nextOptions };
    this.emitNode(
      [{ speaker: player.name, speakerId: player.id, text: option.text }, ...next.lines],
      nextOptions
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

  emitNode(lines, options, isNpc = true) {
    const list = Array.isArray(options)
      ? (Number.isFinite(MAX_OPTIONS) ? options.slice(0, MAX_OPTIONS) : options)
      : [];
    const labels = list.map((option) => option.text);

    emit(Events.DIALOGUE_NODE, {
      lines,
      options: labels.length > 0 ? labels : null,
      isNpc
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
