export const GAME = {
  title: 'Giochino Jackanal',
  width: 960,
  height: 540,
  portraitWidth: 540,
  portraitHeight: 960,
  landscapeZoom: 1.0,
  portraitZoom: 1.5,
  backgroundColor: '#14100c',
  pixelArt: true,
  roundPixels: true,
  physics: {
    gravityX: 0,
    gravityY: 0,
    debug: false
  },
  controls: {
    up: ['W', 'UP'],
    down: ['S', 'DOWN'],
    left: ['A', 'LEFT'],
    right: ['D', 'RIGHT'],
    sprint: ['SHIFT'],
    interact: ['E', 'ENTER', 'SPACE'],
    toggleDebug: ['G']
  },
  player: {
    walkSpeed: 132,
    sprintSpeed: 205,
    bodyWidth: 18,
    bodyHeight: 12,
    interactRange: 78
  },
  selection: {
    spriteScale: 3,
    selectedSpriteScale: 3.15
  },
  font: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif'
};

export function isPortraitMode() {
  return typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
}

export function getGameResolution() {
  if (isPortraitMode()) {
    return {
      width: GAME.portraitWidth,
      height: GAME.portraitHeight,
      zoom: GAME.portraitZoom
    };
  }

  return {
    width: GAME.width,
    height: GAME.height,
    zoom: GAME.landscapeZoom
  };
}

export const DEFAULT_ROOM_ID = 'sala-prove';

/** Personaggio usato quando nessuno è stato scelto (o quando la scelta non esiste). */
export const DEFAULT_CHARACTER_ID = 'luca';
