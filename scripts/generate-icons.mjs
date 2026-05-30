/**
 * generate-icons.mjs
 * Generates PNG icon assets from the Forked Flow icon geometry using pngjs (pure JS).
 * Run: node scripts/generate-icons.mjs
 * Outputs: public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 */

import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// ── Colours ──────────────────────────────────────────────────────────────────
const BG       = [0x11, 0x18, 0x27, 0xff]; // #111827
const CREAM    = [0xe5, 0xe7, 0xeb, 0xff]; // #e5e7eb
const RUST     = [0xc4, 0x6a, 0x2c, 0xff]; // #c46a2c
const TRANSP   = [0x00, 0x00, 0x00, 0x00];

// ── Low-level pixel helpers ───────────────────────────────────────────────────

function setPixel(data, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= data.length / (width * 4)) return;
  const idx = (y * width + x) * 4;
  data[idx]     = color[0];
  data[idx + 1] = color[1];
  data[idx + 2] = color[2];
  data[idx + 3] = color[3];
}

function blendPixel(data, width, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= width) return;
  const height = data.length / (width * 4);
  if (y >= height) return;
  const idx = (y * width + x) * 4;
  const a = alpha / 255;
  data[idx]     = Math.round(data[idx]     * (1 - a) + color[0] * a);
  data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + color[1] * a);
  data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + color[2] * a);
  data[idx + 3] = Math.min(255, data[idx + 3] + Math.round(color[3] * a));
}

// ── Filled rectangle with rounded corners (anti-aliased at corners) ───────────

function fillRoundRect(data, width, x, y, w, h, rx, color) {
  const x2 = x + w - 1;
  const y2 = y + h - 1;
  rx = Math.min(rx, Math.floor(Math.min(w, h) / 2));

  for (let py = y; py <= y2; py++) {
    for (let px = x; px <= x2; px++) {
      // determine corner coverage
      let inCorner = false;
      let cornerAlpha = 255;

      const corners = [
        [x + rx, y + rx],
        [x2 - rx, y + rx],
        [x + rx, y2 - rx],
        [x2 - rx, y2 - rx],
      ];

      let inAnyCornerZone = false;
      for (const [cx, cy] of corners) {
        const dx = px - cx;
        const dy = py - cy;
        if (Math.abs(dx) <= rx && Math.abs(dy) <= rx) {
          // Only apply rounding in the actual corner quadrant
          if ((px < x + rx || px > x2 - rx) && (py < y + rx || py > y2 - rx)) {
            inAnyCornerZone = true;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > rx + 0.5) {
              inCorner = true; // outside
              cornerAlpha = 0;
            } else if (dist > rx - 0.5) {
              inCorner = false;
              cornerAlpha = Math.round((rx + 0.5 - dist) * 255);
            }
            break;
          }
        }
      }

      if (cornerAlpha === 0) continue;

      if (cornerAlpha < 255) {
        blendPixel(data, width, px, py, color, cornerAlpha);
      } else {
        setPixel(data, width, px, py, color);
      }
    }
  }
}

// ── Thick line with round caps (Bresenham + perpendicular offset) ─────────────

function drawThickLine(data, width, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  // Perpendicular unit vector
  const nx = -dy / len;
  const ny =  dx / len;
  const r  = thickness / 2;

  // Bounding box
  const minX = Math.floor(Math.min(x1, x2) - r - 1);
  const maxX = Math.ceil(Math.max(x1, x2)  + r + 1);
  const minY = Math.floor(Math.min(y1, y2) - r - 1);
  const maxY = Math.ceil(Math.max(y1, y2)  + r + 1);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      // Signed distance to the capsule (line segment + round caps)
      const tx = px - x1;
      const ty = py - y1;
      const t  = Math.max(0, Math.min(1, (tx * dx + ty * dy) / (len * len)));
      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

      if (dist < r - 0.5) {
        setPixel(data, width, px, py, color);
      } else if (dist < r + 0.5) {
        const alpha = Math.round((r + 0.5 - dist) * 255);
        blendPixel(data, width, px, py, color, alpha);
      }
    }
  }
}

// ── Icon geometry (in normalised 0-100 coords, scaled to size) ───────────────

function drawIcon(size) {
  const s = size / 100; // scale factor

  const png = new PNG({ width: size, height: size, filterType: -1 });
  const { data } = png;

  // Start fully transparent
  data.fill(0);

  const rx_bg = 18 * s;
  // Background rounded rect
  fillRoundRect(data, size, 0, 0, size, size, Math.round(rx_bg), BG);

  // Top input node: x=29,y=9,w=42,h=16,rx=4
  fillRoundRect(
    data, size,
    Math.round(29 * s), Math.round(9 * s),
    Math.round(42 * s), Math.round(16 * s),
    Math.round(4 * s),
    CREAM
  );

  // Fork connectors (three segments, stroke-width=5.5)
  const sw = Math.max(2, 5.5 * s);
  // Stem: (50,25) → (50,55)
  drawThickLine(data, size, 50*s, 25*s, 50*s, 55*s, sw, RUST);
  // Left branch: (50,55) → (23,71)
  drawThickLine(data, size, 50*s, 55*s, 23*s, 71*s, sw, RUST);
  // Right branch: (50,55) → (77,71)
  drawThickLine(data, size, 50*s, 55*s, 77*s, 71*s, sw, RUST);

  // Bottom-left output node: x=4,y=71,w=38,h=16,rx=4 — cream (original)
  fillRoundRect(
    data, size,
    Math.round(4 * s), Math.round(71 * s),
    Math.round(38 * s), Math.round(16 * s),
    Math.round(4 * s),
    CREAM
  );

  // Bottom-right output node: x=58,y=71,w=38,h=16,rx=4 — rust (themed)
  fillRoundRect(
    data, size,
    Math.round(58 * s), Math.round(71 * s),
    Math.round(38 * s), Math.round(16 * s),
    Math.round(4 * s),
    RUST
  );

  return png;
}

// ── Generate and write ────────────────────────────────────────────────────────

const sizes = [
  { name: 'icon-512.png',         size: 512 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const png = drawIcon(size);
  const buf = PNG.sync.write(png);
  const dest = path.join(publicDir, name);
  fs.writeFileSync(dest, buf);
  console.log(`✓ ${dest}  (${size}×${size}px, ${buf.length} bytes)`);
}

console.log('\nAll icon assets generated.');
