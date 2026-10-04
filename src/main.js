import Phaser from 'phaser';
import { DEFAULT_ROOM_ID, GAME, getGameResolution } from './config.js';
import { ROOMS } from './game/rooms.js';
import BootScene from './scenes/BootScene.js';
import HudScene from './scenes/HudScene.js';
import RoomScene from './scenes/RoomScene.js';

function hideBootMessage() {
  const node = document.getElementById('boot-message');

  if (!node) {
    return;
  }

  node.classList.add('hidden');
  window.setTimeout(() => node.remove(), 500);
}

const initialResolution = getGameResolution();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: initialResolution.width,
  height: initialResolution.height,
  backgroundColor: GAME.backgroundColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: GAME.pixelArt,
    antialias: false,
    roundPixels: GAME.roundPixels
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: GAME.physics.gravityX, y: GAME.physics.gravityY },
      debug: GAME.physics.debug,
      tileBias: 32
    }
  },
  input: {
    keyboard: true
  },
  scene: [BootScene, RoomScene, HudScene],
  callbacks: {
    preBoot(game) {
      game.registry.set('title', GAME.title);
      game.registry.set('rooms', ROOMS);
      game.registry.set('currentRoomId', DEFAULT_ROOM_ID);
    },
    postBoot(game) {
      game.events.once(Phaser.Core.Events.POST_RENDER, () => hideBootMessage());
      game.scale.on(Phaser.Scale.Events.RESIZE, (size) => {
        game.canvas.style.maxWidth = `${size.width}px`;
        game.canvas.style.maxHeight = `${size.height}px`;
      });

      const handleOrientation = () => {
        const target = getGameResolution();
        if (
          game.scale.gameSize.width !== target.width ||
          game.scale.gameSize.height !== target.height
        ) {
          game.scale.setGameSize(target.width, target.height);
        }
      };

      window.addEventListener('resize', handleOrientation);
      window.addEventListener('orientationchange', handleOrientation);
    }
  }
});

export default game;

if (import.meta.env.DEV) {
  window.__game = game;
}