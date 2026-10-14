import salaProve from '../data/rooms/sala-prove.json';
import stanzaNord from '../data/rooms/stanza-nord.json';
import stanzaOvest from '../data/rooms/stanza-ovest.json';
import stanzaEst from '../data/rooms/stanza-est.json';

export const ROOMS = {
  [salaProve.id]: salaProve,
  [stanzaNord.id]: stanzaNord,
  [stanzaOvest.id]: stanzaOvest,
  [stanzaEst.id]: stanzaEst
};

export function getRoom(id) {
  const room = ROOMS[id];

  if (!room) {
    throw new Error(`Stanza sconosciuta: "${id}"`);
  }

  return room;
}