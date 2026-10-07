import { propFootprint } from './propTypes.js';

const NEIGHBOURS = [
  { dx: 1, dy: 0, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 1, cost: Math.SQRT2 },
  { dx: 1, dy: -1, cost: Math.SQRT2 },
  { dx: -1, dy: 1, cost: Math.SQRT2 },
  { dx: -1, dy: -1, cost: Math.SQRT2 }
];

function blocksCell(prop, x, y, radius) {
  const footprint = prop.footprint ?? propFootprint(prop.type, prop.variant ?? null);

  if (!footprint) {
    return false;
  }

  const { w, h } = footprint;
  const left = prop.x - w / 2 - radius;
  const right = prop.x + w / 2 + radius;
  const top = prop.y - h - radius;
  const bottom = prop.y + radius;

  return x >= left && x <= right && y >= top && y <= bottom;
}

export function buildWalkableGrid(layout, props, radius) {
  const half = layout.tileSize / 2;

  return Array.from({ length: layout.rows }, (_, row) =>
    Array.from({ length: layout.columns }, (_, column) => {
      if (!layout.isWalkable(column, row)) {
        return false;
      }

      const x = column * layout.tileSize + half;
      const y = row * layout.tileSize + half;

      return !props.some((prop) => blocksCell(prop, x, y, radius));
    })
  );
}

function isFree(grid, x, y) {
  return grid[y]?.[x] ?? false;
}

export function nearestWalkableCell(grid, layout, cellX, cellY, isAllowed = () => true) {
  const maxRadius = Math.max(grid.length, grid[0]?.length ?? 0);

  for (let ring = 0; ring <= maxRadius; ring += 1) {
    for (let dy = -ring; dy <= ring; dy += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) {
          continue;
        }

        const x = cellX + dx;
        const y = cellY + dy;

        if (x < 0 || y < 0 || x >= layout.columns || y >= layout.rows) {
          continue;
        }

        if (isFree(grid, x, y) && isAllowed(x, y)) {
          return { x, y };
        }
      }
    }
  }

  return null;
}

function heuristic(x, y, goalX, goalY) {
  const dx = Math.abs(x - goalX);
  const dy = Math.abs(y - goalY);

  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

export function findPath(grid, layout, start, goal) {
  const rows = layout.rows;
  const columns = layout.columns;
  const startIndex = start.y * columns + start.x;
  const goalIndex = goal.y * columns + goal.x;

  const cameFrom = new Map();
  const score = new Map([[startIndex, 0]]);
  const open = [startIndex];
  const closed = new Set();

  while (open.length > 0) {
    let bestAt = 0;

    for (let i = 1; i < open.length; i += 1) {
      const current = open[i];
      const candidate = score.get(current) + heuristic(current % columns, (current / columns) | 0, goal.x, goal.y);
      const best = score.get(open[bestAt]) + heuristic(open[bestAt] % columns, (open[bestAt] / columns) | 0, goal.x, goal.y);

      if (candidate < best) {
        bestAt = i;
      }
    }

    const current = open.splice(bestAt, 1)[0];

    if (current === goalIndex) {
      break;
    }

    if (closed.has(current)) {
      continue;
    }

    closed.add(current);

    const x = current % columns;
    const y = (current / columns) | 0;

    for (const { dx, dy, cost } of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) {
        continue;
      }

      const walkable = isFree(grid, nx, ny) || nx === goal.x && ny === goal.y;

      if (!walkable) {
        continue;
      }

      if (dx !== 0 && dy !== 0 && (!isFree(grid, x + dx, y) || !isFree(grid, x, y + dy))) {
        continue;
      }

      const index = ny * columns + nx;
      const tentative = score.get(current) + cost;

      if (closed.has(index) || tentative >= (score.get(index) ?? Infinity)) {
        continue;
      }

      cameFrom.set(index, current);
      score.set(index, tentative);

      if (!open.includes(index)) {
        open.push(index);
      }
    }
  }

  if (!cameFrom.has(goalIndex) && startIndex !== goalIndex) {
    return null;
  }

  const cells = [];
  let index = goalIndex;

  while (index !== startIndex) {
    cells.push({ x: index % columns, y: (index / columns) | 0 });
    index = cameFrom.get(index);

    if (index === undefined) {
      return null;
    }
  }

  return cells.reverse();
}

export function cellsToPoints(cells, layout) {
  const half = layout.tileSize / 2;

  return cells.map((cell) => ({
    x: cell.x * layout.tileSize + half,
    y: cell.y * layout.tileSize + half
  }));
}