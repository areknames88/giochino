export const GAME = {
  title: 'Giochino Jackanal',
  width: 960,
  height: 540,
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
  font: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif'
};

export const DEFAULT_ROOM_ID = 'sala-prove';