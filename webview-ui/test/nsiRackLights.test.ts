/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import { expect, it } from 'vitest';

import { NSI_RACK_LEDS, nsiRackLights, setNsiClock } from '../src/office/nsiRuntime';
const base = {
  sprites: Object.fromEntries(
    [...Object.keys(NSI_RACK_LEDS), 'nsi26-rebooto-shell-table'].map((id) => [
      id,
      Array.from({ length: 64 }, () => Array(80).fill('#80C060')),
    ]),
  ),
};
it('changes only declared existing opaque indicator pixels on all six racks', () => {
  for (const [id, lamps] of Object.entries(NSI_RACK_LEDS)) {
    const source = base.sprites[id],
      before = JSON.stringify(source),
      mask = new Set(lamps.flat().map(([x, y]) => `${x},${y}`)),
      seen = new Set();
    for (let phase = 0; phase < 8; phase++) {
      setNsiClock(phase * 1.5);
      const actual = nsiRackLights(id, source, phase * 1.5);
      seen.add(JSON.stringify(actual));
      for (let y = 0; y < source.length; y++)
        for (let x = 0; x < source[y].length; x++) {
          if (!mask.has(`${x},${y}`)) expect(actual[y][x]).toBe(source[y][x]);
          else expect(source[y][x]).toBeTruthy();
        }
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(JSON.stringify(source)).toBe(before);
  }
});
it('holds phases for1.5seconds, loops at12seconds and reuses cached sprites', () => {
  for (const id of Object.keys(NSI_RACK_LEDS)) {
    const source = base.sprites[id];
    setNsiClock(0);
    const a = nsiRackLights(id, source, 0);
    setNsiClock(1.499);
    expect(nsiRackLights(id, source, 1.499)).toBe(a);
    setNsiClock(1.5);
    expect(nsiRackLights(id, source, 1.5)).not.toBe(a);
    setNsiClock(12);
    expect(nsiRackLights(id, source, 12)).toBe(a);
  }
});
it('leaves every unrelated furniture sprite untouched', () => {
  setNsiClock(3);
  const source = base.sprites['nsi26-rebooto-shell-table'];
  expect(nsiRackLights('nsi26-rebooto-shell-table', source)).toBe(source);
});
