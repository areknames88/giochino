import Phaser from 'phaser';
import { DEFAULT_CHARACTER_ID, DEFAULT_ROOM_ID, GAME } from '../config.js';
import { Events, emit, on } from '../core/eventBus.js';
import { createControls } from '../core/input.js';
import { uiState } from '../core/uiState.js';
import Player from '../entities/Player.js';
import Prop from '../entities/Prop.js';
import Npc from '../entities/Npc.js';
import { DEPTHS, createSolid } from '../game/collision.js';
import { characterTextureKey, getCharacter, resolveLook } from '../game/characters.js';
import { buildRoomLayout } from '../game/roomLayout.js';
import { getRoom } from '../game/rooms.js';
import { buildWalkableGrid, cellsToPoints, findPath, nearestWalkableCell } from '../game/navigation.js';
import { ensureCharacterAssets } from '../gfx/characterArt.js';
import { createFloorTexture, createWallTexture } from '../gfx/roomTextures.js';
import InteractionSystem from '../systems/interaction.js';
import DialogueRunner from '../systems/dialogueRunner.js';
import { inventory } from '../game/inventory.js';

/** Quanto può spostarsi il puntatore durante un tocco prima che diventi un trascinamento. */
const TAP_SLOP = 12;

/** Intervallo massimo (in ms) tra due tocchi/click per considerare l'azione una corsa (doppio tocco). */
const DOUBLE_TAP_DELAY = 350;

/** Distanza massima a schermo (in pixel) consentita tra due tocchi per attivare la corsa. */
const DOUBLE_TAP_MAX_DISTANCE = 40;

export default class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  init(data) {
    this.roomId = data?.roomId ?? this.registry.get('currentRoomId') ?? DEFAULT_ROOM_ID;
    this.spawnOverride = data?.spawn ?? null;
    this.registry.set('currentRoomId', this.roomId);
  }

  create() {
    this.room = getRoom(this.roomId);
    this.layout = buildRoomLayout(this.room);
    this.colliders = [];
    this.props = [];
    this.pendingProp = null;
    this.drag = null;
    this.lastTap = null;
    this.dialogueTarget = null;
    this.dialogueMaxDistance = 120;
    this.isTransitioning = false;
    this.southDoorWarningCooldown = false;

    this.unsubscribeDialogueClosed = on(Events.DIALOGUE_CLOSED, () => {
      this.dialogueTarget = null;
    });

    this.unsubscribePropRemoved = on(Events.PROP_REMOVED, ({ prop }) => {
      this.removeProp(prop);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      emit(Events.HINT_CHANGED, null);
      if (this.interactions) {
        this.interactions.current = null;
      }
      if (this.dialogueRunner) {
        this.dialogueRunner.destroy();
        this.dialogueRunner = null;
      }
      if (this.unsubscribeDialogueClosed) {
        this.unsubscribeDialogueClosed();
        this.unsubscribeDialogueClosed = null;
      }
      if (this.unsubscribePropRemoved) {
        this.unsubscribePropRemoved();
        this.unsubscribePropRemoved = null;
      }
    });

    this.physics.world.setBounds(
      0,
      0,
      this.layout.pixelWidth,
      this.layout.pixelHeight
    );
    this.physics.world.resume();

    this.createFloorAndWalls();
    this.createWallBodies();

    this.props = this.room.props
      .filter((propData) => !propData.id || !inventory.hasItem(propData.id))
      .map((prop) => new Prop(this, prop, this.layout));
    for (const prop of this.props) {
      if (prop.solid) {
        this.colliders.push(prop.solid);
      }
    }

    this.character = getCharacter(this.registry.get('currentCharacterId') ?? DEFAULT_CHARACTER_ID);
    this.look = resolveLook(this.character);
    ensureCharacterAssets(this, this.character);

    this.npcs = (this.room.characters ?? [])
      .filter((npcData) => npcData.id !== this.character.id)
      .map((npcData) => {
        const character = getCharacter(npcData.id);
        ensureCharacterAssets(this, character);
        const npc = new Npc(this, npcData, character, this.layout);
        if (npc.solid) {
          this.colliders.push(npc.solid);
        }
        return npc;
      });

    const spawnConfig = this.spawnOverride ?? this.room.spawn;
    const spawn = {
      x: spawnConfig.x * this.layout.tileSize,
      y: spawnConfig.y * this.layout.tileSize,
      facing: spawnConfig.facing ?? 'down'
    };

    this.player = new Player(this, spawn, {
      textureKey: characterTextureKey(this.character.id),
      shadowScale: this.look.build.width,
      walkSpeed: GAME.player.walkSpeed,
      sprintSpeed: GAME.player.sprintSpeed,
      bodyWidth: GAME.player.bodyWidth,
      bodyHeight: GAME.player.bodyHeight,
      controls: createControls(this.input.keyboard, GAME.controls)
    });

    this.physics.add.collider(this.player, this.colliders);
    this.createCamera();

    this.interactions = new InteractionSystem(
      this,
      [...this.props.filter((prop) => prop.description || prop.targetRoom), ...this.npcs],
      GAME.player.interactRange
    );
    this.dialogueRunner = new DialogueRunner(this);

    this.navigation = buildWalkableGrid(
      this.layout,
      [...this.props, ...this.npcs],
      Math.max(GAME.player.bodyWidth, GAME.player.bodyHeight) / 2
    );

    this.createInput();
    this.createDebugOverlay();

    this.cameras.main.fadeIn(280, 0, 0, 0);

    if (this.spawnOverride) {
      this.isTransitioning = true;
      const facing = spawnConfig.facing ?? 'down';
      const stepDist = 14;
      const stepX = facing === 'left' ? -stepDist : facing === 'right' ? stepDist : 0;
      const stepY = facing === 'up' ? -stepDist : facing === 'down' ? stepDist : 0;
      this.player.playWalk();
      this.tweens.add({
        targets: this.player,
        x: this.player.x + stepX,
        y: this.player.y + stepY,
        duration: 220,
        ease: 'Linear',
        onUpdate: () => {
          this.player.playWalk();
          this.player.finishStep();
        },
        onComplete: () => {
          this.player.body.setVelocity(0, 0);
          this.player.playIdle();
          this.player.finishStep();
          this.isTransitioning = false;
        }
      });
    }

    emit(Events.HINT_CHANGED, null);
    emit(Events.ROOM_READY, this.room);
  }

  createFloorAndWalls() {
    const floorKey = `room-${this.room.id}-floor`;
    const wallKey = `room-${this.room.id}-walls`;

    if (!this.textures.exists(floorKey)) {
      createFloorTexture(this, floorKey, this.room, this.layout);
    }

    if (!this.textures.exists(wallKey)) {
      createWallTexture(this, wallKey, this.room, this.layout);
    }

    this.floor = this.add
      .image(0, 0, floorKey)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.FLOOR);

    this.walls = this.add
      .image(0, 0, wallKey)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.WALL);
  }

  createWallBodies() {
    const { tileSize } = this.layout;

    for (const run of this.layout.runs) {
      this.colliders.push(
        createSolid(
          this,
          run.x * tileSize + (run.w * tileSize) / 2,
          run.y * tileSize + (run.h * tileSize) / 2,
          run.w * tileSize,
          run.h * tileSize
        )
      );
    }
  }

  createCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.layout.pixelWidth, this.layout.pixelHeight);
    camera.setRoundPixels(true);
    camera.setZoom(this.scale.height > this.scale.width ? GAME.portraitZoom : GAME.landscapeZoom);
    camera.startFollow(this.player, true, 0.14, 0.14);

    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize) => {
      camera.setZoom(gameSize.height > gameSize.width ? GAME.portraitZoom : GAME.landscapeZoom);
    });
  }

  createInput() {
    this.input.keyboard.on('keydown-E', () => this.requestInteract());
    this.input.keyboard.on('keydown-ENTER', () => this.requestInteract());
    this.input.keyboard.on('keydown-SPACE', () => this.requestInteract());
    this.input.keyboard.on('keydown-G', () => this.toggleDebug());

    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
    this.input.on('pointermove', (pointer) => this.handlePointerMove(pointer));
    this.input.on('pointerup', (pointer) => this.handlePointerUp(pointer));
    this.input.on('pointerupoutside', (pointer) => this.handlePointerUp(pointer));
  }

  /**
   * Tieni premuto = stai guidando il personaggio: la destinazione segue il dito
   * o il mouse e nessuna interazione può partire. Solo un tocco breve (che non
   * sposta il puntatore) arma l'arredo sotto al puntatore: da lì in poi il
   * dialogo si apre quando il personaggio gli arriva vicino.
   */
  handlePointerDown(pointer) {
    if (this.isTransitioning || pointer.rightButtonDown()) {
      return;
    }

    const now = this.time.now;
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const targetProp = this.interactions.hitTest(point);

    let isDoubleTap = false;
    if (this.lastTap) {
      const timeDiff = now - this.lastTap.time;
      const screenDist = Phaser.Math.Distance.Between(this.lastTap.x, this.lastTap.y, pointer.x, pointer.y);
      const sameProp = Boolean(targetProp && this.lastTap.prop === targetProp);

      if (timeDiff < DOUBLE_TAP_DELAY && (screenDist < DOUBLE_TAP_MAX_DISTANCE || sameProp)) {
        isDoubleTap = true;
      }
    }

    this.drag = {
      id: pointer.id,
      x: pointer.x,
      y: pointer.y,
      blocked: uiState.dialogueOpen,
      isDoubleTap
    };

    if (uiState.dialogueOpen) {
      return;
    }

    if (isDoubleTap) {
      this.player.runningToTarget = true;
      this.lastTap = null;
    } else {
      this.player.runningToTarget = false;
    }

    this.pendingProp = null;
    this.steerTo(pointer);
  }

  handlePointerMove(pointer) {
    if (this.isTransitioning || !this.drag || pointer.id !== this.drag.id || this.drag.blocked || uiState.dialogueOpen) {
      return;
    }

    this.steerTo(pointer);
  }

  handlePointerUp(pointer) {
    if (!this.drag || pointer.id !== this.drag.id) {
      return;
    }

    const drag = this.drag;
    this.drag = null;

    if (this.isTransitioning || drag.blocked || uiState.dialogueOpen) {
      return;
    }

    const travelled = Phaser.Math.Distance.Between(drag.x, drag.y, pointer.x, pointer.y);
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const hitProp = this.interactions.hitTest(point);

    if (travelled > TAP_SLOP && !hitProp) {
      if (drag.isDoubleTap) {
        this.player.stopWalking();
      }
      return;
    }

    this.pendingProp = hitProp;
    if (this.pendingProp && typeof this.pendingProp.faceTowards === 'function') {
      this.pendingProp.faceTowards(this.player.x, this.player.y);
    }

    if (!drag.isDoubleTap) {
      this.lastTap = {
        time: this.time.now,
        x: pointer.x,
        y: pointer.y,
        prop: this.pendingProp
      };
    }
  }

  steerTo(pointer) {
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const prop = this.interactions.hitTest(point);

    this.walkTowards(prop ? { x: prop.x, y: prop.y } : point, prop);
  }

  walkTowards(point, prop) {
    const { tileSize, columns, rows } = this.layout;
    const cellX = Math.min(columns - 1, Math.max(0, Math.floor(point.x / tileSize)));
    const cellY = Math.min(rows - 1, Math.max(0, Math.floor(point.y / tileSize)));

    const goal = nearestWalkableCell(this.navigation, this.layout, cellX, cellY, (x, y) => {
      if (!prop) {
        return true;
      }

      const worldX = x * tileSize + tileSize / 2;
      const worldY = y * tileSize + tileSize / 2;

      return Phaser.Math.Distance.Between(worldX, worldY, prop.x, prop.y) <= GAME.player.interactRange;
    });

    if (!goal) {
      this.player.walkTo(point.x, point.y);
      return;
    }

    const start = {
      x: Math.min(columns - 1, Math.max(0, Math.floor(this.player.x / tileSize))),
      y: Math.min(rows - 1, Math.max(0, Math.floor(this.player.y / tileSize)))
    };

    const cells = findPath(this.navigation, this.layout, start, goal);

    if (!cells || cells.length === 0) {
      this.player.walkTo(goal.x * tileSize + tileSize / 2, goal.y * tileSize + tileSize / 2);
      return;
    }

    this.player.followPath(cellsToPoints(cells, this.layout));
  }

  resolvePending() {
    if (!this.pendingProp || this.isTransitioning) {
      return;
    }

    const prop = this.pendingProp;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, prop.x, prop.y);
    const inRange = distance <= GAME.player.interactRange;

    if (!this.player.arrived && !inRange) {
      return;
    }

    this.pendingProp = null;
    this.player.stopWalking();

    if (prop.targetRoom) {
      this.triggerRoomTransition(prop);
      return;
    }

    if (this.dialogueRunner.start(prop)) {
      this.dialogueTarget = prop;
    }
  }

  requestInteract() {
    if (this.isTransitioning) {
      return;
    }

    if (uiState.dialogueOpen) {
      emit(Events.DIALOGUE_ADVANCE);
      return;
    }

    const current = this.interactions.current;
    if (current?.targetRoom) {
      this.triggerRoomTransition(current);
      return;
    }

    if (this.dialogueRunner.start(current)) {
      this.dialogueTarget = current;
      this.pendingProp = null;
    }
  }

  removeProp(prop) {
    if (!prop) {
      return;
    }

    const idx = this.props.indexOf(prop);
    if (idx !== -1) {
      this.props.splice(idx, 1);
    }

    if (prop.solid) {
      const colIdx = this.colliders.indexOf(prop.solid);
      if (colIdx !== -1) {
        this.colliders.splice(colIdx, 1);
      }
      prop.solid.destroy();
    }

    if (this.interactions) {
      this.interactions.interactables = this.interactions.interactables.filter((t) => t !== prop);
      if (this.interactions.current === prop) {
        this.interactions.current = null;
        emit(Events.HINT_CHANGED, null);
      }
    }

    if (this.dialogueTarget === prop) {
      this.dialogueTarget = null;
    }
    if (this.pendingProp === prop) {
      this.pendingProp = null;
    }

    prop.destroy();
  }

  createDebugOverlay() {
    const { tileSize, columns, rows } = this.layout;
    const graphics = this.add.graphics().setDepth(DEPTHS.GRID).setVisible(false);

    graphics.lineStyle(1, 0xffffff, 0.08);

    for (let x = 0; x <= columns; x += 1) {
      graphics.lineBetween(x * tileSize, 0, x * tileSize, rows * tileSize);
    }

    for (let y = 0; y <= rows; y += 1) {
      graphics.lineBetween(0, y * tileSize, columns * tileSize, y * tileSize);
    }

    this.debugOverlay = graphics;
    this.debugEnabled = false;
  }

  toggleDebug() {
    this.debugEnabled = !this.debugEnabled;
    this.debugOverlay.setVisible(this.debugEnabled);

    if (this.debugEnabled) {
      if (!this.physics.world.debugGraphic) {
        this.physics.world.createDebugGraphic();
      }

      this.physics.world.drawDebug = true;
    } else {
      this.physics.world.drawDebug = false;
      this.physics.world.debugGraphic?.clear();
    }

    emit(Events.TOAST, this.debugEnabled ? 'DEBUG ON' : 'DEBUG OFF');
  }

  checkDoorTriggers() {
    if (this.isTransitioning) {
      return;
    }

    for (const prop of this.props) {
      if (prop.type !== 'door') {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, prop.x, prop.y);

      if (prop.targetRoom) {
        if (dist <= 26) {
          this.triggerRoomTransition(prop);
          return;
        }
      } else if (dist <= 20) {
        if (!this.southDoorWarningCooldown) {
          this.southDoorWarningCooldown = true;
          emit(Events.TOAST, "La porta d'ingresso: le prove devono ancora iniziare!");
          this.time.delayedCall(2500, () => {
            this.southDoorWarningCooldown = false;
          });
        }
      }
    }
  }

  triggerRoomTransition(door) {
    if (this.isTransitioning) {
      return;
    }

    const targetRoom = door.targetRoom ?? door.propData?.targetRoom;
    const targetSpawn = door.targetSpawn ?? door.propData?.targetSpawn;
    const direction = door.direction ?? door.propData?.direction;

    if (!targetRoom) {
      return;
    }

    this.isTransitioning = true;
    this.pendingProp = null;
    this.player.stopWalking();
    this.player.body.setVelocity(0, 0);

    emit(Events.HINT_CHANGED, null);
    if (this.interactions) {
      this.interactions.current = null;
    }

    if (direction) {
      this.player.facing = direction;
    }

    const stepDist = 14;
    const stepX = direction === 'left' ? -stepDist : direction === 'right' ? stepDist : 0;
    const stepY = direction === 'up' ? -stepDist : direction === 'down' ? stepDist : 0;

    this.tweens.add({
      targets: this.player,
      x: this.player.x + stepX,
      y: this.player.y + stepY,
      duration: 220,
      ease: 'Linear',
      onUpdate: () => {
        this.player.playWalk();
        this.player.finishStep();
      }
    });

    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.changeRoom(targetRoom, targetSpawn);
    });
  }

  update() {
    if (this.isTransitioning) {
      return;
    }

    this.player.update();
    this.interactions.update(this.player);
    this.resolvePending();
    this.checkDoorTriggers();

    if (this.dialogueTarget && uiState.dialogueOpen) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.dialogueTarget.x, this.dialogueTarget.y);
      if (distance > this.dialogueMaxDistance) {
        emit(Events.DIALOGUE_CLOSED);
      }
    }

    emit(Events.PLAYER_MOVED, { x: this.player.x, y: this.player.y });
  }

  changeRoom(roomId, spawn = null) {
    this.scene.restart({ roomId, spawn });
  }

  destroy() {
    if (this.dialogueRunner) {
      this.dialogueRunner.destroy();
      this.dialogueRunner = null;
    }

    if (this.unsubscribeDialogueClosed) {
      this.unsubscribeDialogueClosed();
      this.unsubscribeDialogueClosed = null;
    }

    if (this.unsubscribePropRemoved) {
      this.unsubscribePropRemoved();
      this.unsubscribePropRemoved = null;
    }
    super.destroy();
  }
}