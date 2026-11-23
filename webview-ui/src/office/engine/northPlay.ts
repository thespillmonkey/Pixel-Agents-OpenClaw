/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette, not UI styling. */
import hands from '../northPlayData.json';
import type { SpriteData } from '../types.js';

// Approved 24x32 native motion. Only sleeves/wrists move; no upper-body translation.
const cache = new WeakMap<SpriteData, Map<string, SpriteData[]>>();
const editable = (x: number, y: number) =>
  y >= 17 && y <= 24 && ((x >= 6 && x <= 9) || (x >= 15 && x <= 18));
function common(colors: string[], fallback: string): string {
  const counts = new Map<string, number>();
  for (const c of colors) if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}
function rgb(c: string): number[] {
  return /^#[\da-f]{6}$/i.test(c)
    ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
    : [0, 0, 0];
}
export function northPlayPose(source: SpriteData, frame: number, identity = ''): SpriteData {
  let variants = cache.get(source);
  if (!variants) {
    variants = new Map();
    cache.set(source, variants);
  }
  let poses = variants.get(identity);
  if (!poses) {
    // Current native walkers are 16x32; existing standing-play art is padded to 24x32.
    // Unusual future canvases remain static rather than acquiring the old head bob.
    if (source.length !== 32 || ![16, 24].includes(source[0]?.length)) return source;
    const pad = (24 - source[0].length) / 2,
      base = source.map((row) => Array.from({ length: 24 }, (_, x) => row[x - pad] ?? ''));
    const torso = base.slice(17, 21).flatMap((row) => row.slice(10, 15)),
      edges = base.slice(19, 25).flatMap((row) => [...row.slice(6, 10), ...row.slice(15, 19)]);
    const cloth = common(torso, '#29252c'),
      warm = (c: string) => {
        const [r, g, b] = rgb(c);
        return r > g * 1.02 && g > b * 1.1 && r > 120 && g > 65;
      };
    const skin =
      base
        .flat()
        .filter(warm)
        .sort((a, b) => rgb(b).reduce((n, v) => n + v, 0) - rgb(a).reduce((n, v) => n + v, 0))[0] ??
      common(edges, cloth);
    const mitsuki = identity === 'mitsuki',
      colors: Record<string, string> = {
        '#29252c': cloth,
        '#17151f': common(
          edges.filter((c) => {
            const [r, g, b] = rgb(c);
            return r + g + b < 150;
          }),
          cloth,
        ),
        '#3c353c': cloth,
        '#eee9e6': mitsuki ? '#eee9e6' : cloth,
        '#f5c9aa': skin,
        '#ffe0c1': skin,
      };
    poses = hands.map((template) =>
      base.map((row, y) =>
        row.map((c, x) => {
          if (
            y === 25 &&
            ['pepe', 'foggy'].includes(identity) &&
            [6, 7, 17, 18].includes(x) &&
            warm(c)
          )
            return '';
          if (!editable(x, y)) return c;
          // Fixed tail/coat pixels are not arms and must not be erased with lowered wrists.
          if (
            (identity === 'rooty' && x >= 17 && y >= 21) ||
            (identity === 'digby' && x <= 8 && y >= 24) ||
            (identity === 'takemi' && y >= 22 && x >= 8 && x <= 16)
          )
            return c;
          const v = template[y][x];
          return mitsuki ? v : (colors[v] ?? v);
        }),
      ),
    );
    variants.set(identity, poses);
  }
  return poses[((frame % 8) + 8) % 8];
}
