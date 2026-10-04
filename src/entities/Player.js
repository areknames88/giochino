import Phaser from 'phaser';

const DIRS = ['down', 'left', 'right', 'up'];
const ARRIVE_DISTANCE = 5;
const STUCK_TIMEOUT = 420;
const STUCK_EPSILON = 1.5;

function faceFromVector(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) {
      return 'right';
    }

    if (dx < 0) {
      return 'left';
    }
  }

  if (dy > 0) {
    return 'down';
  }

  return dy < 0 ? 'up' : null;
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, spawn, options) {
    super(scene, spawn.x, spawn.y, 'player');

    const { walkSpeed, sprintSpeed, bodyWidth, bodyHeight, controls } = options;

    this.walkSpeed = walkSpeed;
    this.sprintSpeed = sprintSpeed;
    this.controls = controls;
    this.facing = DIRS.includes(spawn.facing) ? spawn.facing : 'down';
    this.moving = false;
    this.path = [];
    this.moveTarget = null;
    this.arrived = false;
    this.bestDistance = Infinity;
    this.progressAt = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset((this.width - bodyWidth) / 2, this.height - bodyHeight);
    this.setCollideWorldBounds(true);
    this.setDepth(this.y);
    this.play(`player-idle-${this.facing}`);

    this.shadow = scene.add
      .image(this.x, this.y - 2, 'soft-shadow')
      .setDisplaySize(20, 7)
      .setTint(0x000000)
      .setAlpha(0.3);
  }

  get isSprinting() {
    return this.controls.sprint.isDown;
  }

  get hasTarget() {
    return this.moveTarget !== null;
  }

  play(animKey) {
    if (this.anims.currentAnim?.key !== animKey) {
      this.anims.play(animKey, true);
    }
  }

  walkTo(x, y) {
    this.followPath([{ x, y }]);
  }

  followPath(points) {
    this.path = points.length > 0 ? points.map((point) => ({ ...point })) : [];
    this.moveTarget = this.path.shift() ?? null;
    this.bestDistance = Infinity;
    this.progressAt = this.scene.time.now;
  }

  stopWalking() {
    this.path = [];
    this.moveTarget = null;
  }

  readKeyboard() {
    const { up, down, left, right } = this.controls;

    return {
      x: (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0),
      y: (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0)
    };
  }

  steerToTarget() {
    while (this.moveTarget) {
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;

      if (Math.hypot(dx, dy) > ARRIVE_DISTANCE) {
        break;
      }

      this.moveTarget = this.path.shift() ?? null;

      if (!this.moveTarget) {
        this.arrived = true;
        return null;
      }

      this.bestDistance = Infinity;
      this.progressAt = this.scene.time.now;
    }

    const dx = this.moveTarget.x - this.x;
    const dy = this.moveTarget.y - this.y;
    const distance = Math.hypot(dx, dy);
    const now = this.scene.time.now;

    if (distance < this.bestDistance - STUCK_EPSILON) {
      this.bestDistance = distance;
      this.progressAt = now;
    } else if (now - this.progressAt > STUCK_TIMEOUT) {
      this.stopWalking();
      return null;
    }

    return { x: dx / distance, y: dy / distance };
  }

  update() {
    this.arrived = false;

    const keyboard = this.readKeyboard();
    const keyboardLength = Math.hypot(keyboard.x, keyboard.y);

    if (keyboardLength > 0) {
      this.stopWalking();
    }

    let direction = keyboard;
    let strength = keyboardLength;

    if (keyboardLength === 0 && this.moveTarget) {
      const steering = this.steerToTarget();

      if (steering) {
        direction = steering;
        strength = 1;
      }
    }

    this.moving = strength > 0.05;

    if (!this.moving) {
      this.body.setVelocity(0, 0);
      this.play(`player-idle-${this.facing}`);
      this.finishStep();
      return;
    }

    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
    const force = Math.min(1, strength);

    this.body.setVelocity((direction.x / strength) * speed * force, (direction.y / strength) * speed * force);

    this.facing = faceFromVector(direction.x, direction.y) ?? this.facing;

    this.play(`player-walk-${this.facing}`);
    this.finishStep();
  }

  finishStep() {
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 2);
  }
}