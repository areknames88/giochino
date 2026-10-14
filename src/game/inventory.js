import { Events, emit } from '../core/eventBus.js';
import cables from '../data/items/cables.json';
import concyTuner from '../data/items/concy-tuner.json';
import marcoPick from '../data/items/marco-pick.json';
import davideDrumkey from '../data/items/davide-drumkey.json';
import riccardoPopfilter from '../data/items/riccardo-popfilter.json';

/**
 * Catalogo degli oggetti dell'inventario.
 * Ciascun oggetto ha un identificativo univoco, nome, categoria, icona procedurale
 * e descrizione narrativa dettagliata.
 * Gli oggetti vengono caricati da `src/data/items/*.json`.
 */
const staticItems = {
  [cables.id]: cables,
  [concyTuner.id]: concyTuner,
  [marcoPick.id]: marcoPick,
  [davideDrumkey.id]: davideDrumkey,
  [riccardoPopfilter.id]: riccardoPopfilter
};

let dynamicItems = {};
try {
  const itemModules = import.meta.glob('../data/items/*.json', { eager: true });
  for (const itemPath in itemModules) {
    const mod = itemModules[itemPath];
    const item = mod?.default ?? mod;
    if (item && item.id) {
      dynamicItems[item.id] = item;
    }
  }
} catch {
  // In caso di ambiente non-Vite, ripiega su staticItems
}

export const ITEMS = Object.keys(dynamicItems).length > 0 ? dynamicItems : staticItems;

/**
 * Gestione dello stato dell'inventario (singleton).
 */
class InventoryManager {
  constructor() {
    this.itemIds = new Set();
  }

  hasItem(id) {
    return this.itemIds.has(id);
  }

  getItem(id) {
    return ITEMS[id] ?? null;
  }

  getItems() {
    return Array.from(this.itemIds)
      .map((id) => ITEMS[id])
      .filter(Boolean);
  }

  getItemCount() {
    return this.itemIds.size;
  }

  addItem(id) {
    const item = ITEMS[id];
    if (!item) {
      console.warn(`[inventory] Tentativo di aggiungere un oggetto sconosciuto: ${id}`);
      return false;
    }

    if (this.itemIds.has(id)) {
      return false;
    }

    this.itemIds.add(id);
    emit(Events.ITEM_COLLECTED, { item });
    emit(Events.TOAST, `Hai ottenuto: ${item.name}`);
    return true;
  }

  removeItem(id) {
    if (!this.itemIds.has(id)) {
      return false;
    }

    const item = ITEMS[id];
    this.itemIds.delete(id);
    emit(Events.ITEM_REMOVED, { item });
    return true;
  }

  reset() {
    this.itemIds.clear();
  }
}

export const inventory = new InventoryManager();
