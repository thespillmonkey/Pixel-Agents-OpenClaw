/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import { expect, it } from 'vitest';

import { opaqueRaster } from '../src/office/sprites/opaqueRaster.js';
it('matches integer-boundary pixel coverage at every supported quarter-step zoom', () => {
  const source = [
    ['#123456', '', '#AbCdEf'],
    ['', '#000000', '#ffffff'],
  ];
  for (let zoom = 0.25; zoom <= 8; zoom += 0.25) {
    const width = Math.floor(3 * zoom),
      height = Math.floor(2 * zoom);
    if (!width || !height) continue;
    const expected = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 3; x++) {
        const color = source[y][x];
        if (!color) continue;
        const rgb = parseInt(color.slice(1), 16);
        for (let yy = Math.floor(y * zoom); yy < Math.floor((y + 1) * zoom); yy++)
          for (let xx = Math.floor(x * zoom); xx < Math.floor((x + 1) * zoom); xx++)
            expected.set([rgb >>> 16, (rgb >>> 8) & 255, rgb & 255, 255], (yy * width + xx) * 4);
      }
    expect(opaqueRaster(source, zoom)).toEqual(expected);
  }
});
it('keeps CSS parsing and alpha sprites on the existing Canvas path', () => {
  for (const color of ['rgba(0,0,0,.5)', '#12345680', '#abc', 'red']) {
    const source = [[color]];
    expect(opaqueRaster(source, 2)).toBeNull();
    expect(opaqueRaster(source, 1.25)).toBeNull();
  }
});
