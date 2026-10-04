function markRect(grid, columns, rows, rect, value) {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(columns, Math.ceil(rect.x + rect.w));
  const y1 = Math.min(rows, Math.ceil(rect.y + rect.h));

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      grid[y][x] = value;
    }
  }
}

export function buildRoomLayout(room) {
  const tileSize = room.tileSize;
  const columns = room.columns;
  const rows = room.rows;
  const grid = Array.from({ length: rows }, () => new Array(columns).fill(false));

  for (const rect of room.walls ?? []) {
    markRect(grid, columns, rows, rect, true);
  }

  for (const rect of room.openings ?? []) {
    markRect(grid, columns, rows, rect, false);
  }

  const runs = [];
  let solidCells = 0;

  for (let y = 0; y < rows; y += 1) {
    let x = 0;

    while (x < columns) {
      if (!grid[y][x]) {
        x += 1;
        continue;
      }

      let width = 1;
      while (x + width < columns && grid[y][x + width]) {
        width += 1;
      }

      runs.push({ x, y, w: width, h: 1 });
      solidCells += width;
      x += width;
    }
  }

  return {
    tileSize,
    columns,
    rows,
    pixelWidth: columns * tileSize,
    pixelHeight: rows * tileSize,
    runs,
    solidCells,
    isSolid: (x, y) => grid[y]?.[x] ?? false,
    isWalkable: (x, y) => !(grid[y]?.[x] ?? false)
  };
}