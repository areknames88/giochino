import { Events, emit } from '../core/eventBus.js';

/**
 * Catalogo degli oggetti dell'inventario.
 * Ciascun oggetto ha un identificativo univoco, nome, categoria, icona procedurale
 * e descrizione narrativa dettagliata.
 */
export const ITEMS = {
  cables: {
    id: 'cables',
    name: 'Matassa di cavi di scorta',
    shortName: 'Cavi di scorta',
    category: 'Connessioni',
    description: 'Un cavo audio spiralato nero ben arrotolato con fascetta a strappo. Prontissimo per collegare un ampli, una cassa o un microfono in caso di emergenza.',
    iconKey: 'item-cables'
  },
  'concy-tuner': {
    id: 'concy-tuner',
    name: 'Accordatore a pedale',
    shortName: 'Accordatore',
    category: 'Effetti & Pedali',
    description: 'Un robusto pedale d\'acciaio blu notte di Concy con display luminoso a LED. Fondamentale per tenere il basso intonato e le frequenze basse solide.',
    iconKey: 'item-concy-tuner'
  },
  'marco-pick': {
    id: 'marco-pick',
    name: 'Plettro Jackanal Heavy',
    shortName: 'Plettro Heavy',
    category: 'Accessori Chitarra',
    description: 'Un plettro triangolare in celluloide tartarugata regalato da Marco, con il logo Jackanal stampato a caldo. Rigido e perfetto per i riff veloci.',
    iconKey: 'item-marco-pick'
  },
  'davide-drumkey': {
    id: 'davide-drumkey',
    name: 'Chiavetta per batteria',
    shortName: 'Chiavetta',
    category: 'Attrezzi Batteria',
    description: 'Una chiave a T cromata da taschino che Davide usa per accordare i tiranti del rullante e stringere i morsetti delle aste piatti.',
    iconKey: 'item-davide-drumkey'
  },
  'riccardo-popfilter': {
    id: 'riccardo-popfilter',
    name: 'Filtro antipop tascabile',
    shortName: 'Filtro antipop',
    category: 'Accessori Voce',
    description: 'Una retina circolare nera con morsetto regolabile che Riccardo porta sempre con sé. Ferma i colpi d\'aria prima che facciano fischiare l\'impianto.',
    iconKey: 'item-riccardo-popfilter'
  }
};

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
