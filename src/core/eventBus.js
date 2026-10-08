import Phaser from 'phaser';

export const Events = {
  BOOT_READY: 'boot:ready',
  CHARACTER_SELECTED: 'character:selected',
  ROOM_READY: 'room:ready',
  HINT_CHANGED: 'hint:changed',
  DIALOGUE_SAY: 'dialogue:say',
  DIALOGUE_NODE: 'dialogue:node',
  DIALOGUE_CHOICE: 'dialogue:choice',
  DIALOGUE_ADVANCE: 'dialogue:advance',
  DIALOGUE_CLOSED: 'dialogue:closed',
  PLAYER_MOVED: 'player:moved',
  TOAST: 'toast',
  INVENTORY_TOGGLE: 'inventory:toggle',
  INVENTORY_OPEN: 'inventory:open',
  INVENTORY_CLOSE: 'inventory:close',
  ITEM_COLLECTED: 'item:collected',
  ITEM_REMOVED: 'item:removed',
  PROP_REMOVED: 'prop:removed'
};

export const eventBus = new Phaser.Events.EventEmitter();

export function emit(event, payload) {
  eventBus.emit(event, payload);
}

export function on(event, handler) {
  eventBus.on(event, handler);
  return () => eventBus.off(event, handler);
}

export function off(event, handler) {
  eventBus.off(event, handler);
}