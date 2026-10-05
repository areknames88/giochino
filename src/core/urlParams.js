/**
 * Parametri dell'indirizzo, per provare il gioco senza toccare il codice:
 * `?touch=1` forza la legenda da dito, `?char=<id>` salta la scelta del
 * personaggio. La stanza si sceglie con `?room=<id>` solo quando quella
 * gestione esisterà: per ora `RoomScene` parte sempre da quella nel registry.
 */
export function getUrlParam(name) {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
}
