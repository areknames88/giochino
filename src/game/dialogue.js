import { findCharacter, findPlayableCharacter, listNpcCharacters, listPlayableCharacters } from './characters.js';

import riccardo from '../data/dialogues/riccardo.json';
import concy from '../data/dialogues/concy.json';
import marco from '../data/dialogues/marco.json';
import davide from '../data/dialogues/davide.json';

/**
 * Registro dei dialoghi: un personaggio = un file in `src/data/dialogues/<id>.json`.
 * Una conversazione è un grafo di nodi: ogni nodo ha le battute (`lines`) e,
 * opzionalmente, le risposte del giocatore (`options`), ciascuna con il nodo
 * successivo (`next`). Il nodo d'ingresso si sceglie con una mappa per chi
 * ascolta (`entries[listenerId]` → `entries.default`), e senza file si cade
 * sulle `lines` del JSON del personaggio.
 *
 * La validazione parte a caricamento del modulo: riferimenti rotti e chiavi
 * sconosciute finiscono in console una volta sola (come in `characters.js`).
 */
export const DIALOGUES = [riccardo, concy, marco, davide];
export const MAX_OPTIONS = Infinity;

const warned = new Set();

function warnOnce(message) {
  if (warned.has(message)) {
    return;
  }

  warned.add(message);
  console.warn(`[dialogue] ${message}`);
}

/**
 * Chi parla, come id: serve all'UI per mostrare l'avatar (`avatar-<id>`).
 * L'id esplicito della riga vince; altrimenti si cerca il personaggio con
 * quel nome. Nessun match = nessun avatar specifico.
 */
function resolveSpeakerId(speakerName, explicitId) {
  if (typeof explicitId === 'string' && explicitId.trim()) {
    return explicitId.trim().toLowerCase();
  }

  const nameOrId = typeof speakerName === 'string' ? speakerName.trim().toLowerCase() : '';
  const match = [...listPlayableCharacters(), ...listNpcCharacters()]
    .find((character) => character.name?.toLowerCase() === nameOrId || character.id?.toLowerCase() === nameOrId);

  return match ? match.id : null;
}

function normalizeLines(character, rawLines) {
  const name = character.name ?? character.id;

  if (!Array.isArray(rawLines)) {
    return [];
  }

  return rawLines.flatMap((line) => {
    if (typeof line === 'string') {
      return line.trim()
        ? [{ speaker: name, speakerId: character.id, text: line.trim() }]
        : [];
    }

    if (line && typeof line.text === 'string' && line.text.trim()) {
      const speaker = typeof line.speaker === 'string' && line.speaker.trim() ? line.speaker : name;
      const speakerId = typeof line.speaker === 'string' && line.speaker.trim()
        ? resolveSpeakerId(speaker, line.speakerId)
        : character.id;
      return [{ speaker, speakerId, text: line.text.trim() }];
    }

    return [];
  });
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return null;
  }

  return rawOptions.flatMap((option) => {
    if (!option || typeof option.text !== 'string' || !option.text.trim()) {
      return [];
    }

    return [{
      text: option.text.trim(),
      next: typeof option.next === 'string' && option.next.trim() ? option.next.trim() : null
    }];
  });
}

function buildNode(character, nodeId, node) {
  const lines = normalizeLines(character, node.lines);

  if (lines.length === 0) {
    warnOnce(`nodo "${nodeId}" di "${character.id}" senza battute: ignorato`);
    return null;
  }

  return { nodeId, lines, options: normalizeOptions(node.options), giveItem: node.giveItem ?? null };
}

function validateDialogue(dialogue) {
  const speakerId = dialogue.speaker ?? dialogue.id;
  const character = findCharacter(speakerId);

  if (!character) {
    warnOnce(`speaker "${speakerId}" sconosciuto: il file "${dialogue.id}" viene ignorato`);
    return null;
  }

  if (BY_SPEAKER.has(speakerId)) {
    warnOnce(`due file per lo speaker "${speakerId}": il secondo viene ignorato`);
    return null;
  }

  const nodes = dialogue.nodes && typeof dialogue.nodes === 'object' ? dialogue.nodes : {};
  const entries = dialogue.entries && typeof dialogue.entries === 'object' ? dialogue.entries : {};

  if (typeof entries.default !== 'string' || !nodes[entries.default]) {
    warnOnce(`"${speakerId}": manca entries.default (o punta a un nodo inesistente)`);
  }

  for (const [key, nodeId] of Object.entries(entries)) {
    if (key !== 'default' && !findPlayableCharacter(key)) {
      warnOnce(`"${speakerId}": entries.${key} non è un id giocabile`);
    }

    if (typeof nodeId !== 'string' || !nodes[nodeId]) {
      warnOnce(`"${speakerId}": entries.${key} punta al nodo inesistente "${nodeId}"`);
    }
  }

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!node || !Array.isArray(node.lines) || node.lines.length === 0) {
      warnOnce(`"${speakerId}": nodo "${nodeId}" senza lines`);
      continue;
    }

    if (node.options === undefined) {
      continue;
    }

    if (!Array.isArray(node.options) || node.options.length === 0) {
      warnOnce(`"${speakerId}": nodo "${nodeId}" con options vuoto`);
      continue;
    }

    if (Number.isFinite(MAX_OPTIONS) && node.options.length > MAX_OPTIONS) {
      warnOnce(`"${speakerId}": nodo "${nodeId}" ha ${node.options.length} opzioni, massimo ${MAX_OPTIONS}`);
    }

    for (const option of node.options) {
      if (!option || typeof option.text !== 'string' || !option.text.trim()) {
        warnOnce(`"${speakerId}": nodo "${nodeId}" ha un'opzione senza text`);
        continue;
      }

      if (typeof option.next !== 'string' || !nodes[option.next]) {
        warnOnce(`"${speakerId}": opzione "${option.text}" del nodo "${nodeId}" punta al nodo inesistente "${option?.next}"`);
      }
    }
  }

  return character;
}

const BY_SPEAKER = new Map();

for (const dialogue of DIALOGUES) {
  const character = validateDialogue(dialogue);

  if (character) {
    BY_SPEAKER.set(character.id, dialogue);
  }
}

function nodeOf(character, nodeId) {
  const dialogue = BY_SPEAKER.get(character.id);
  const node = dialogue?.nodes?.[nodeId];

  if (!node) {
    return null;
  }

  return buildNode(character, nodeId, node);
}

function fallbackNode(character) {
  const lines = normalizeLines(character, character.lines);

  if (lines.length === 0 && typeof character.tagline === 'string' && character.tagline.trim()) {
    lines.push({
      speaker: character.name ?? character.id,
      speakerId: character.id,
      text: character.tagline.trim()
    });
  }

  if (lines.length === 0) {
    return null;
  }

  return { nodeId: null, lines, options: null };
}

/**
 * Nodo d'ingresso della conversazione per il personaggio che ascolta.
 * Catena: file del parlante `entries[listenerId]` → `entries.default` →
 * `lines` del JSON del personaggio → `tagline`.
 */
export function resolveEntry(character, listenerId) {
  const dialogue = BY_SPEAKER.get(character.id);

  if (dialogue) {
    const entries = dialogue.entries ?? {};
    const requested = listenerId != null ? entries[listenerId] : undefined;
    const nodeId = typeof requested === 'string' && dialogue.nodes[requested]
      ? requested
      : entries.default;
    const node = typeof nodeId === 'string' ? nodeOf(character, nodeId) : null;

    if (node) {
      return node;
    }
  }

  return fallbackNode(character);
}

/** Nodo raggiunto da un'opzione (`next`). Senza riferimento validi il dialogo finisce. */
export function resolveNext(character, nodeId) {
  if (typeof nodeId !== 'string' || !nodeId) {
    return null;
  }

  return nodeOf(character, nodeId);
}
