export const DEPTHS = {
  FLOOR: -2000,
  WALL: -1000,
  GRID: -900,
  SHADOW_OFFSET: 1
};

export function createSolid(scene, x, y, width, height) {
  const zone = scene.add.rectangle(x, y, width, height, 0xff00ff, 0);
  scene.physics.add.existing(zone, true);
  zone.setVisible(false);

  return zone;
}