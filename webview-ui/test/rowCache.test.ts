/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import { describe, expect, it } from 'vitest';

import { spriteHeight,spriteRows } from '../src/office/sprites/rowCache.js';
import type { SpriteData } from '../src/office/types.js';

describe('immutable row transforms preserve raster-cache identity', () => {
  const sprite: SpriteData = [
    ['#112233', ''],
    ['#445566', '#778899'],
    ['', '#abcdef'],
  ];
  it('reuses upper/lower slices over repeated scene rebuilds without changing pixels', () => {
    const before = JSON.stringify(sprite);
    for (const split of [1, 2]) {
      const upper = spriteRows(sprite, 0, split),
        lower = spriteRows(sprite, split);
      for (let i = 0; i < 160; i++) {
        expect(spriteRows(sprite, 0, split)).toBe(upper);
        expect(spriteRows(sprite, split)).toBe(lower);
      }
      expect([...upper, ...lower]).toEqual(sprite);
    }
    expect(JSON.stringify(sprite)).toBe(before);
  });
  it('keeps replaced sources and different row ranges independent', () => {
    const replacement = sprite.map((row) => [...row]);
    expect(spriteRows(replacement, 1)).not.toBe(spriteRows(sprite, 1));
    expect(spriteRows(sprite, 0, 1)).not.toBe(spriteRows(sprite, 0, 2));
    expect(spriteRows(sprite, 2)).toEqual(sprite.slice(2));
  });
  it('reuses native wall transforms with exact original nearest-row selection', () => {
    for (const height of [1, 2, 16]) {
      const result = spriteHeight(sprite, height);
      expect(result).toEqual(
        Array.from({ length: height }, (_, y) => sprite[Math.floor((y * sprite.length) / height)]),
      );
      expect(spriteHeight(sprite, height)).toBe(result);
    }
    expect(
      spriteHeight(
        sprite.map((row) => [...row]),
        16,
      ),
    ).not.toBe(spriteHeight(sprite, 16));
  });
});
