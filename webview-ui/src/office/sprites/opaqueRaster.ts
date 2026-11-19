import type { SpriteData } from '../types.js';

// Batch the common opaque hex palette into one ImageData upload. CSS colors and
// alpha-bearing sprites retain Canvas's original parser/compositor path.
const compiled = new WeakMap<SpriteData, Uint32Array | null>();
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
function compile(sprite: SpriteData): Uint32Array | null {
  if (compiled.has(sprite)) return compiled.get(sprite)!;
  const width = sprite[0].length,
    words = new Uint32Array(width * sprite.length);
  const palette = new Map<string, number>([['', 0]]);
  for (let y = 0; y < sprite.length; y++)
    for (let x = 0; x < width; x++) {
      const color = sprite[y][x];
      let word = palette.get(color);
      if (word === undefined) {
        if (!/^#[0-9a-f]{6}$/i.test(color)) {
          compiled.set(sprite, null);
          return null;
        }
        const rgb = parseInt(color.slice(1), 16);
        const r = rgb >>> 16,
          g = (rgb >>> 8) & 255,
          b = rgb & 255;
        word = littleEndian
          ? (r | (g << 8) | (b << 16) | (255 << 24)) >>> 0
          : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
        palette.set(color, word);
      }
      words[y * width + x] = word;
    }
  compiled.set(sprite, words);
  return words;
}
export function opaqueRaster(sprite: SpriteData, zoom: number): Uint8ClampedArray | null {
  const source = compile(sprite);
  if (!source) return null;
  const rows = sprite.length,
    cols = sprite[0].length;
  const width = Math.floor(cols * zoom),
    height = Math.floor(rows * zoom);
  if (!width || !height) return null;
  const pixels = new Uint32Array(width * height);
  for (let r = 0; r < rows; r++) {
    const y = Math.floor(r * zoom),
      bottom = Math.floor((r + 1) * zoom);
    if (bottom === y) continue;
    for (let c = 0; c < cols; c++) {
      const color = source[r * cols + c];
      if (!color) continue;
      const left = Math.floor(c * zoom),
        right = Math.floor((c + 1) * zoom);
      pixels.fill(color, y * width + left, y * width + right);
    }
    for (let yy = y + 1; yy < bottom; yy++)
      pixels.copyWithin(yy * width, y * width, (y + 1) * width);
  }
  return new Uint8ClampedArray(pixels.buffer);
}
