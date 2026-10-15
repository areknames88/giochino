import { Events, emit } from '../core/eventBus.js';

/**
 * Catalogo degli obiettivi / missioni.
 * Ciascun obiettivo ha identificativo univoco, titolo, categoria,
 * descrizione narrativa e target / suggerimento.
 * Vengono caricati dinamicamente da `src/data/objectives/*.json` via `import.meta.glob`.
 * In questo modo l'aggiunta o rimozione di obiettivi dall'editor viene gestita
 * automaticamente senza alcun import statico manuale.
 */
export const OBJECTIVES = {};

try {
  const objectiveModules = import.meta.glob('../data/objectives/*.json', { eager: true });
  for (const objPath in objectiveModules) {
    const mod = objectiveModules[objPath];
    const obj = mod?.default ?? mod;
    if (obj && obj.id) {
      OBJECTIVES[obj.id] = obj;
    }
  }
} catch (err) {
  console.warn('[objectives] Impossibile caricare gli obiettivi dinamici:', err);
}

/**
 * Gestore dello stato delle missioni e degli obiettivi (singleton).
 */
class ObjectivesManager {
  constructor() {
    this.objectiveIds = new Set();
    this.completedIds = new Set();
  }

  hasObjective(id) {
    return this.objectiveIds.has(id);
  }

  isCompleted(id) {
    return this.completedIds.has(id);
  }

  getObjective(id) {
    return OBJECTIVES[id] ?? null;
  }

  getObjectives() {
    return Array.from(this.objectiveIds)
      .map((id) => {
        const base = OBJECTIVES[id] || { id, title: id, category: 'Varie', description: '' };
        return {
          ...base,
          completed: this.completedIds.has(id)
        };
      })
      .filter(Boolean);
  }

  getActiveObjectives() {
    return this.getObjectives().filter((o) => !o.completed);
  }

  getActiveCount() {
    let count = 0;
    for (const id of this.objectiveIds) {
      if (!this.completedIds.has(id)) {
        count++;
      }
    }
    return count;
  }

  getTotalCount() {
    return this.objectiveIds.size;
  }

  addObjective(id) {
    const objective = OBJECTIVES[id];
    if (!objective) {
      console.warn(`[objectives] Tentativo di aggiungere un obiettivo sconosciuto: ${id}`);
      return false;
    }

    if (this.objectiveIds.has(id)) {
      return false;
    }

    this.objectiveIds.add(id);
    emit(Events.OBJECTIVE_ADDED, { objective });
    emit(Events.TOAST, `🎯 Nuovo obiettivo: ${objective.title || objective.id}`);
    return true;
  }

  completeObjective(id) {
    if (!this.objectiveIds.has(id)) {
      this.objectiveIds.add(id);
    }

    if (this.completedIds.has(id)) {
      return false;
    }

    this.completedIds.add(id);
    const objective = OBJECTIVES[id];
    emit(Events.OBJECTIVE_COMPLETED, { objective, id });
    emit(Events.TOAST, `✅ Obiettivo completato: ${objective?.title || id}`);
    return true;
  }

  removeObjective(id) {
    if (!this.objectiveIds.has(id)) {
      return false;
    }

    this.objectiveIds.delete(id);
    this.completedIds.delete(id);
    emit(Events.OBJECTIVE_REMOVED, { id });
    return true;
  }

  reset() {
    this.objectiveIds.clear();
    this.completedIds.clear();
  }
}

export const objectives = new ObjectivesManager();
