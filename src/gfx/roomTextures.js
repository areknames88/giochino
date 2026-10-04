import { createRng, shade, withAlpha } from './rng.js';

function drawPlanks(ctx, room, width, height, rng) {
  const palette = room.palette.floor;
  const plankHeight = 11;
  const plankWidth = 96;

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, width, height);

  let row = 0;

  for (let y = 0; y < height; y += plankHeight, row += 1) {
    const stagger = row % 2 === 0 ? 0 : plankWidth * 0.5;

    for (let x = -plankWidth + stagger; x < width; x += plankWidth) {
      const widthJitter = (rng() - 0.5) * 0.16;
      ctx.fillStyle = shade(palette.base, widthJitter);
      ctx.fillRect(x, y, plankWidth, plankHeight);

      const grains = 3 + Math.floor(rng() * 3);
      ctx.strokeStyle = withAlpha(palette.dark, 0.2 + rng() * 0.2);
      ctx.lineWidth = 1;

      for (let i = 0; i < grains; i += 1) {
        const grainY = y + 2 + rng() * (plankHeight - 4);
        const segments = 3;
        ctx.beginPath();
        ctx.moveTo(x + 3, grainY);

        for (let s = 1; s <= segments; s += 1) {
          ctx.lineTo(x + 3 + ((plankWidth - 6) * s) / segments, grainY + (rng() - 0.5) * 1.8);
        }

        ctx.stroke();
      }

      if (rng() < 0.16) {
        const knotX = x + 12 + rng() * (plankWidth - 24);
        const knotY = y + 3 + rng() * (plankHeight - 6);
        ctx.fillStyle = withAlpha(palette.dark, 0.5);
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, 3.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = withAlpha(palette.seam, 0.45);
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, 6, 3.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = withAlpha(palette.seam, 0.5);

  for (let y = 0; y < height; y += plankHeight) {
    ctx.fillRect(0, y, width, 1);
  }

  row = 0;

  for (let y = 0; y < height; y += plankHeight, row += 1) {
    const stagger = row % 2 === 0 ? 0 : plankWidth * 0.5;
    ctx.fillStyle = withAlpha(palette.seam, 0.35);

    for (let x = -plankWidth + stagger; x < width; x += plankWidth) {
      ctx.fillRect(x, y, 1, plankHeight);
    }
  }

  const sheen = ctx.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, withAlpha(palette.light, 0.14));
  sheen.addColorStop(0.55, withAlpha(palette.light, 0.02));
  sheen.addColorStop(1, withAlpha(palette.dark, 0.16));
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);
}

function drawWallContactShadow(ctx, layout, reach = 14) {
  const { tileSize, columns, rows, isSolid } = layout;

  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < columns; cx += 1) {
      if (!isSolid(cx, cy)) {
        continue;
      }

      const x = cx * tileSize;
      const y = cy * tileSize;
      const edges = [
        { solid: isSolid(cx, cy - 1), gradient: [x, y, x, y + reach] },
        { solid: isSolid(cx, cy + 1), gradient: [x, y + tileSize, x, y + tileSize - reach] },
        { solid: isSolid(cx - 1, cy), gradient: [x, y, x + reach, y] },
        { solid: isSolid(cx + 1, cy), gradient: [x + tileSize, y, x + tileSize - reach, y] }
      ];

      for (const edge of edges) {
        if (edge.solid) {
          continue;
        }

        const [x0, y0, x1, y1] = edge.gradient;
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          Math.min(x0, x1),
          Math.min(y0, y1),
          Math.abs(x1 - x0) || tileSize,
          Math.abs(y1 - y0) || tileSize
        );
      }
    }
  }
}

function drawWallTile(ctx, x, y, size, palette) {
  const gradient = ctx.createLinearGradient(x, y, x, y + size);
  gradient.addColorStop(0, shade(palette.face, 0.08));
  gradient.addColorStop(0.55, palette.face);
  gradient.addColorStop(1, palette.dark);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, size, size);

  const capHeight = 7;
  const cap = ctx.createLinearGradient(x, y, x, y + capHeight);
  cap.addColorStop(0, shade(palette.top, 0.1));
  cap.addColorStop(1, palette.top);
  ctx.fillStyle = cap;
  ctx.fillRect(x, y, size, capHeight);

  ctx.fillStyle = withAlpha(palette.seam, 0.75);
  ctx.fillRect(x, y + capHeight - 1, size, 1);

  ctx.fillStyle = withAlpha(palette.seam, 0.35);

  for (let i = 8; i < size; i += 8) {
    ctx.fillRect(x + i, y + capHeight, 1, size - capHeight);
  }

  ctx.fillStyle = withAlpha(palette.seam, 0.55);
  ctx.fillRect(x, y + size - 2, size, 2);
  ctx.fillStyle = withAlpha(palette.light, 0.18);
  ctx.fillRect(x, y, size, 1);
}

export function createFloorTexture(scene, key, room, layout) {
  const { pixelWidth, pixelHeight } = layout;
  const texture = scene.textures.createCanvas(key, pixelWidth, pixelHeight);
  const ctx = texture.getContext();
  const rng = createRng(room.seed);

  drawPlanks(ctx, room, pixelWidth, pixelHeight, rng);
  drawWallContactShadow(ctx, layout);

  texture.refresh();

  return texture;
}

export function createWallTexture(scene, key, room, layout) {
  const { tileSize, columns, rows, isSolid } = layout;
  const texture = scene.textures.createCanvas(key, layout.pixelWidth, layout.pixelHeight);
  const ctx = texture.getContext();
  const rng = createRng(room.seed + 7919);

  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < columns; cx += 1) {
      if (!isSolid(cx, cy)) {
        continue;
      }

      drawWallTile(ctx, cx * tileSize, cy * tileSize, tileSize, room.palette.wall);

      if (rng() < 0.08) {
        ctx.fillStyle = withAlpha(room.palette.wall.seam, 0.25);
        ctx.fillRect(cx * tileSize + 4 + rng() * 20, cy * tileSize + 10 + rng() * 14, 3, 2);
      }
    }
  }

  texture.refresh();

  return texture;
}