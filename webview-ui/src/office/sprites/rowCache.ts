import type { SpriteData } from '../types.js';

// Sprite rasters are keyed by array identity. Keep immutable row transforms stable
// across scene rebuilds; weak keys allow replaced catalogs/animation frames to retire.
const slices = new WeakMap<SpriteData, Map<string, SpriteData>>();
const heights = new WeakMap<SpriteData, Map<number, SpriteData>>();
export function spriteRows(sprite: SpriteData, start: number, end = sprite.length): SpriteData {
  let variants = slices.get(sprite);
  if (!variants) {
    variants = new Map();
    slices.set(sprite, variants);
  }
  const key = `${start}:${end}`;
  let result = variants.get(key);
  if (!result) {
    result = sprite.slice(start, end);
    variants.set(key, result);
  }
  return result;
}
export function spriteHeight(sprite: SpriteData, height: number): SpriteData {
  let variants = heights.get(sprite);
  if (!variants) {
    variants = new Map();
    heights.set(sprite, variants);
  }
  let result = variants.get(height);
  if (!result) {
    result = Array.from(
      { length: height },
      (_, y) => sprite[Math.floor((y * sprite.length) / height)],
    );
    variants.set(height, result);
  }
  return result;
}
