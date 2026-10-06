import { DEFAULT_CHARACTER_ID } from '../config.js';
import { getUrlParam } from '../core/urlParams.js';
import { shade } from '../gfx/rng.js';
import riccardo from '../data/characters/playable/riccardo.json';
import concy from '../data/characters/playable/concy.json';
import marco from '../data/characters/playable/marco.json';
import davide from '../data/characters/playable/davide.json';
import basso from '../data/characters/npc/basso.json';
import batterista from '../data/characters/npc/batterista.json';

/**
 * Registro dei personaggi: giocabili (scelti nella schermata iniziale) e NPC
 * (personaggi della stanza, che non si giocano ma si disegnano con lo stesso
 * metodo). Ogni personaggio è un JSON in `src/data/characters/<kind>/<id>.json`.
 */
export const PLAYABLE_CHARACTERS = [riccardo, concy, marco, davide];
export const NPC_CHARACTERS = [basso, batterista];

/** Vocabolario dei disegni: quello che `src/gfx/characterArt.js` sa disegnare. */
export const HAIR_STYLES = ['short', 'long', 'bun', 'ponytail', 'curly', 'bald'];
export const OUTFIT_STYLES = ['tee', 'hoodie', 'jacket', 'dress', 'sleeveless'];
export const EFFECT_TYPES = [
  'glasses',
  'beard',
  'mustache',
  'hat',
  'headphones',
  'scarf',
  'strap'
];

const DEFAULT_PALETTE = {
  skin: '#e8b98f',
  hair: '#4a3121',
  shirt: '#b8443c',
  pants: '#35486b',
  shoes: '#2a1f18',
  eye: '#241f1b'
};

const DEFAULT_BUILD = { height: 1, width: 1 };
const BUILD_RANGE = { min: 0.85, max: 1.15 };
const DEFAULT_HAIR_STYLE = 'short';
const DEFAULT_OUTFIT_STYLE = 'tee';

const CHARACTERS = new Map();
const warned = new Set();

for (const character of [...PLAYABLE_CHARACTERS, ...NPC_CHARACTERS]) {
  if (CHARACTERS.has(character.id)) {
    throw new Error(`Id personaggio duplicato: "${character.id}"`);
  }

  CHARACTERS.set(character.id, character);
}

function warnOnce(message) {
  if (warned.has(message)) {
    return;
  }

  warned.add(message);
  console.warn(`[characters] ${message}`);
}

export function normalizeColor(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `#${value.toString(16).padStart(6, '0').slice(-6)}`;
  }

  if (typeof value === 'string') {
    const hex = value.trim().replace(/^#/, '');

    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      return `#${hex.split('').map((c) => c + c).join('').toLowerCase()}`;
    }

    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      return `#${hex.toLowerCase()}`;
    }
  }

  return fallback;
}

function clampNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampScale(value, fallback) {
  return Math.min(BUILD_RANGE.max, Math.max(BUILD_RANGE.min, clampNumber(value, fallback)));
}

function pickFrom(list, value, fallback) {
  if (typeof value !== 'string' || !list.includes(value)) {
    if (value !== undefined) {
      warnOnce(`"${value}" non è uno stile noto, uso "${fallback}"`);
    }

    return fallback;
  }

  return value;
}

function resolveEffects(character) {
  const raw = Array.isArray(character.effects) ? character.effects : [];

  return raw.flatMap((effect) => {
    const type = effect?.type;

    if (!EFFECT_TYPES.includes(type)) {
      warnOnce(`effetto sconosciuto "${type}" nel personaggio "${character.id}": ignorato`);
      return [];
    }

    const color = normalizeColor(effect.color, DEFAULT_PALETTE.shirt);

    return [{
      ...effect,
      type,
      color,
      shade: shade(color, -0.3)
    }];
  });
}

/**
 * Completa un personaggio con tutti i valori che il disegno si aspetta. Un JSON
 * può omettere qualsiasi campo: le palette nei dati non sono mai parziali
 * (vedi `docs/KNOWLEDGE.md`, trabocchetto 6).
 */
export function resolveLook(character) {
  const palette = character?.palette ?? {};
  const pick = (key) => normalizeColor(palette[key], DEFAULT_PALETTE[key]);

  const skin = pick('skin');
  const hair = pick('hair');
  const shirt = pick('shirt');
  const pants = pick('pants');
  const shoes = pick('shoes');
  const eye = pick('eye');

  return {
    skin,
    skinShade: shade(skin, -0.18),
    hair,
    hairShade: shade(hair, -0.28),
    shirt,
    shirtShade: shade(shirt, -0.25),
    shirtLight: shade(shirt, 0.22),
    pants,
    pantsShade: shade(pants, -0.25),
    shoes,
    shoeLight: shade(shoes, 0.3),
    eye,
    hairStyle: pickFrom(HAIR_STYLES, character?.hair?.style, DEFAULT_HAIR_STYLE),
    outfitStyle: pickFrom(OUTFIT_STYLES, character?.outfit?.style, DEFAULT_OUTFIT_STYLE),
    build: {
      height: clampScale(character?.build?.height, DEFAULT_BUILD.height),
      width: clampScale(character?.build?.width, DEFAULT_BUILD.width)
    },
    effects: resolveEffects(character ?? {})
  };
}

export const AVATAR_FILES = {
  riccardo: 'Avatars/Avatar Riccardo.jpeg',
  concy: 'Avatars/Avatar Concy.jpg',
  marco: 'Avatars/Avatar Marco.jpeg',
  davide: 'Avatars/Avatar Davide.jpg'
};

export function characterAvatarKey(id) {
  return `avatar-${id}`;
}

export function characterTextureKey(id) {
  return `character-${id}`;
}

export function characterAnimKey(id, state, facing) {
  return `character-${id}-${state}-${facing}`;
}

export function findCharacter(id) {
  return CHARACTERS.get(id) ?? null;
}

export function findPlayableCharacter(id) {
  return PLAYABLE_CHARACTERS.find((character) => character.id === id) ?? null;
}

/** Il personaggio scelto con `?char=<id>`, se l'id è un giocabile valido. */
export function resolveForcedCharacterId() {
  const forced = findPlayableCharacter(getUrlParam('char'));

  return forced ? forced.id : null;
}

/** Il personaggio con cui si parte: `?char=<id>` se è valido, altrimenti il default. */
export function resolveStartupCharacterId() {
  return resolveForcedCharacterId() ?? DEFAULT_CHARACTER_ID;
}

export function getCharacter(id) {
  const character = findCharacter(id);

  if (!character) {
    throw new Error(`Personaggio sconosciuto: "${id}"`);
  }

  return character;
}

export function listPlayableCharacters() {
  return PLAYABLE_CHARACTERS;
}

export function listNpcCharacters() {
  return NPC_CHARACTERS;
}

export function defaultPlayableCharacter() {
  return getCharacter(DEFAULT_CHARACTER_ID);
}
