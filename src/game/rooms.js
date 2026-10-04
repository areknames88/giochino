import salaProve from '../data/rooms/sala-prove.json';

export const ROOMS = {
  [salaProve.id]: salaProve
};

export function getRoom(id) {
  const room = ROOMS[id];

  if (!room) {
    throw new Error(`Stanza sconosciuta: "${id}"`);
  }

  return room;
}