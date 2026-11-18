/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import type { SpriteData } from '../types.js';
const cache = new WeakMap<SpriteData, Map<string, SpriteData[]>>();
export const TOY_FRAME_MS = 100,
  TOY_FRAME_COUNT = 64;
/** 6.4-second native loops. Fixed cabinets and supports are always copied from approved art. */
export function toyAnimation(type: string, source: SpriteData, seconds: number): SpriteData {
  let byType = cache.get(source);
  if (!byType) {
    byType = new Map();
    cache.set(source, byType);
  }
  let frames = byType.get(type);
  if (!frames) {
    frames = Array.from({ length: TOY_FRAME_COUNT }, (_, i) => {
      const out = source.map((r) => r.slice()),
        w = source[0].length,
        h = source.length,
        t = i / TOY_FRAME_COUNT,
        a = t * Math.PI * 2;
      const dot = (x: number, y: number, c: string) => {
        x = Math.round(x);
        y = Math.round(y);
        if (y >= 0 && y < out.length && x >= 0 && x < w) out[y][x] = c;
      };
      const opaque = (x: number, y: number, c: string) => {
        x = Math.round(x);
        y = Math.round(y);
        if (source[y]?.[x]) dot(x, y, c);
      };
      const line = (x: number, y: number, xx: number, yy: number, c: string) => {
        const n = Math.max(Math.abs(xx - x), Math.abs(yy - y), 1);
        for (let p = 0; p <= n; p++) dot(x + ((xx - x) * p) / n, y + ((yy - y) * p) / n, c);
      };
      if (type.includes('pinball')) {
        const path = [
          [8, 18],
          [12, 22],
          [5, 27],
          [11, 31],
          [7, 25],
          [12, 20],
          [5, 23],
          [8, 18],
        ];
        const q = t * (path.length - 1),
          k = Math.floor(q),
          f = q - k,
          from = path[k],
          to = path[Math.min(k + 1, path.length - 1)];
        const x = from[0] + (to[0] - from[0]) * f,
          y = from[1] + (to[1] - from[1]) * f;
        opaque(x, y, '#ffffff');
        opaque(x, y - 1, '#8ad9ee');
        for (let j = 0; j < 3; j++)
          opaque(5 + j * 3, 10, (i + j * 7) % 24 < 12 ? '#ffe97a' : '#82d3ee');
        for (let j = 0; j < 3; j++) opaque(5 + j, 32 - (i % 16 < 8 ? j : 0), '#f5eac9');
      } else if (type === 'break28-arcade') {
        for (let y = 9; y <= 18; y++) for (let x = 4; x <= 13; x++) opaque(x, y, '#06162b');
        for (let j = 0; j < 3; j++) {
          const x = 5 + j * 3 + Math.round(Math.sin(a) * 1);
          opaque(x, 10 + (j % 2), '#35dce9');
          opaque(x + 1, 11 + (j % 2), '#be56e8');
        }
        const ship = 8 + Math.round(Math.sin(a) * 3);
        opaque(ship, 17, '#fff9b1');
        opaque(ship - 1, 18, '#55d8ff');
        opaque(ship + 1, 18, '#55d8ff');
        opaque(ship, 16 - (i % 12) / 2, '#fef1a8');
      } else if (type === 'break28-dartboard') {
        // Extend transparent projectile headroom south, retaining the original wall-board top-left.
        while (out.length < h + 25) out.push(Array(w).fill(''));
        const p = (i % 32) / 32;
        if (p < 0.55) {
          const y = h + 21 - (p / 0.55) * (h + 11);
          line(7, y, 7, y + 3, '#e5e9ed');
          dot(6, y + 3, '#d84b49');
          dot(8, y + 3, '#d84b49');
        } else {
          dot(7, 10, '#d9e2e8');
          dot(8, 11, '#d84b49');
          if (i % 6 < 3) {
            dot(5, 10, '#f8e68a');
            dot(9, 10, '#f8e68a');
          }
        }
      } else if (type === 'break28-claw') {
        // A gantry traverse, lower, close and lift cycle, entirely inside the existing glass chamber.
        const stage = t * 4;
        const x = stage < 1 ? 10 + stage * 10 : stage < 3 ? 20 : 20 - (stage - 3) * 10;
        const y =
          stage < 1
            ? 11
            : stage < 2
              ? 11 + (stage - 1) * 13
              : stage < 3
                ? 24 - (stage - 2) * 13
                : 11;
        for (let yy = 9; yy < 23; yy++)
          for (let xx = 7; xx < 24; xx++)
            if (source[yy]?.[xx]) out[yy][xx] = source[yy][25] || '#477293';
        line(x, 8, x, y, '#b9d3df');
        dot(x - 1, y, '#e7f0f3');
        dot(x + 1, y, '#e7f0f3');
        dot(x - 2, y + 1, '#a4bccd');
        dot(x + 2, y + 1, '#a4bccd');
        if (stage > 2 && stage < 3) {
          dot(x, y + 3, '#ffc15c');
          dot(x + 1, y + 3, '#ffe3a1');
        }
      } else if (type === 'break28-counter') {
        // Faucet outlet and basin only. Countertop, cupboard fronts and coffee equipment unchanged.
        for (let y = 8; y <= 13; y++)
          for (let x = 19; x <= 20; x++) opaque(x, y, (y + i) % 4 < 2 ? '#bceaff' : '#51b6d6');
        for (let j = 0; j < 3; j++) opaque(7 + j * 4 + Math.sin(a + j), 14, '#94c9d2');
      } else if (type === 'break28-coffee-maker') {
        opaque(4, 8 + (i % 24) / 6, '#7d4d25');
        opaque(5, 9 + (i % 24) / 8, '#d4a05c');
        opaque(8, 8, i % 24 < 12 ? '#8bdf88' : '#375632');
        if (i % 16 < 10) {
          opaque(4 + Math.sin(a), 1, '#d6d6cc');
          opaque(5 + Math.cos(a), 2, '#b7c2bb');
        }
      } else if (type === 'break28-hockey') {
        // Restore the two resting mallet masks before drawing the moving equipment.
        for (const [l, top, r, bottom] of [
          [8, 5, 17, 12],
          [37, 14, 47, 22],
        ])
          for (let yy = top; yy <= bottom; yy++)
            for (let xx = l; xx <= r; xx++) opaque(xx, yy, '#e9e9f4');
        const x = 12 + 31 * (0.5 + 0.5 * Math.sin(a * 2)),
          y = 12 + 10 * (0.5 + 0.5 * Math.sin(a * 3));
        opaque(x, y, '#18212a');
        opaque(x + 1, y, '#edf2f2');
        for (const [px, py] of [
          [11, 12 + Math.sin(a) * 4],
          [42, 21 + Math.sin(a + 1) * 4],
        ]) {
          for (let dx = -2; dx <= 2; dx++)
            for (let dy = -2; dy <= 2; dy++)
              if (dx * dx + dy * dy <= 5) opaque(px + dx, py + dy, dy < 0 ? '#f3a181' : '#bb3b2c');
          opaque(px, py - 1, '#ffe0ad');
        }
      } else if (type === 'break28-foosball') {
        for (let yy = 9; yy <= 48; yy++)
          for (let xx = 9; xx <= 33; xx++) opaque(xx, yy, yy % 3 ? '#1d7831' : '#247e37');
        for (let xx = 10; xx <= 32; xx++) {
          opaque(xx, 10, '#aacbaa');
          opaque(xx, 28, '#aacbaa');
          opaque(xx, 47, '#aacbaa');
        }
        for (let yy = 10; yy <= 47; yy++) {
          opaque(10, yy, '#aacbaa');
          opaque(32, yy, '#aacbaa');
        }
        for (let rod = 0; rod < 5; rod++) {
          const y = 13 + rod * 7,
            shift = Math.round(Math.sin(a + rod) * 2);
          for (let xx = 8; xx <= 34; xx++) opaque(xx, y, '#a6a7a2');
          for (let man = 0; man < 3; man++) {
            const x = 13 + man * 7 + shift,
              c = rod % 2 ? '#246fc5' : '#d75831';
            opaque(x, y, c);
            opaque(x + 1, y, c);
            if ((i + rod * 5) % 16 < 8) {
              opaque(x, y - 1, rod % 2 ? '#8accf1' : '#ffb369');
              opaque(x, y + 1, c);
            } else {
              opaque(x - 1, y, c);
              opaque(x + 2, y, rod % 2 ? '#8accf1' : '#ffb369');
            }
          }
        }
        const ballX = 15 + 7 * Math.sin(a * 2),
          ballY = 14 + 30 * (0.5 + 0.5 * Math.sin(a));
        opaque(ballX, ballY, '#fff4ce');
      }
      return out;
    });
    byType.set(type, frames);
  }
  return frames[Math.floor(((seconds + 1e-8) * 1000) / TOY_FRAME_MS) % frames.length];
}
