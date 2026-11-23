/* eslint-disable pixel-agents/no-inline-colors -- Authored scene light palette/fixture values, not UI theme colors. */
import { expect, it, vi } from 'vitest';

import { createCharacter, getCharacterSprite } from '../src/office/engine/characters';
import { IdlePlay, layoutToys, toyAnimation } from '../src/office/engine/idlePlay';
import { drawTvLight, tvLightPolygon } from '../src/office/engine/tvLight';
import { buildDynamicCatalog } from '../src/office/layout/furnitureCatalog';
import {
  getBlockedTiles,
  layoutToSeats,
  layoutToTileMap,
} from '../src/office/layout/layoutSerializer';
import { getCharacterSprites } from '../src/office/sprites/spriteData';
import { CharacterState, Direction } from '../src/office/types';
import { tvAssets, tvLayout as layout } from './fixtures/tvOffice.js';
buildDynamicCatalog(tvAssets);
const seats = layoutToSeats(layout.furniture),
  tileMap = layoutToTileMap(layout),
  blocked = getBlockedTiles(layout.furniture);
function setup() {
  const p = new IdlePlay(() => 0),
    home = seats.get('break28-seat-dining-north')!,
    ch = createCharacter(1, 0, home.uid, home);
  ch.isActive = false;
  ch.state = CharacterState.IDLE;
  ch.matrixEffect = null;
  p.configure(layout, []);
  // Select a TV-only candidate without changing layout/couch geometry or production state.
  const targets = p.getTargets();
  targets.splice(0, targets.length, ...targets.filter((t) => t.tv));
  const b = new Set(blocked);
  b.delete(`${home.seatCol},${home.seatRow}`);
  const ctx = {
    tileMap,
    blocked: b,
    seats: new Map([...seats].map(([k, v]) => [k, { ...v }])),
    occupied: vi.fn<(tile: { col: number; row: number }) => boolean>(() => false) as (tile: {
      col: number;
      row: number;
    }) => boolean,
  };
  return { p, ch, ctx, home };
}
function arrive(f: ReturnType<typeof setup>) {
  for (let i = 0; i < 2400 && f.p.getState(1)?.phase !== 'playing'; i++)
    f.p.update(f.ch, 0.05, f.ctx);
  expect(f.p.getState(1)?.phase).toBe('playing');
}
it('offers TV once, resolves two black-couch seats, and faces its viewer toward the screen', () => {
  const tv = layoutToys(layout).filter((t) => t.tv);
  expect(tv).toHaveLength(1);
  expect(tv[0].tv!.seats.map((s) => s.uid)).toEqual(['break28-seat-sofa-1', 'break28-seat-sofa-2']);
  expect(tv[0].facing).toBe(Direction.DOWN);
  expect(
    layoutToys({
      ...layout,
      furniture: layout.furniture.filter((f: { type: string }) => f.type !== 'break28-sofa'),
    }),
  ).not.toContainEqual(expect.objectContaining({ type: 'break28-tv' }));
});
it('keeps the TV dark during approach, sits motionlessly on arrival, stops on work and preserves home', () => {
  const f = setup(),
    { p, ch, ctx, home } = f;
  p.update(ch, 60, ctx);
  expect(p.getState(1)?.phase).toBe('approaching');
  expect(ch.playTv).toBeUndefined();
  expect(p.playingIds().size).toBe(0);
  arrive(f);
  expect(ch.dir).toBe(Direction.DOWN);
  expect(ch.playTv).toBeDefined();
  expect(ch.seatId).toBe(home.uid);
  expect(p.playingIds().has('break28-tv')).toBe(true);
  expect({ x: ch.x + ch.playVisualOffset!.x, y: ch.y + ch.playVisualOffset!.y }).toEqual({
    x: 648,
    y: 531,
  });
  const sprite = getCharacterSprite(ch, getCharacterSprites(0, 0));
  expect(sprite).toEqual(getCharacterSprites(0, 0).seated[Direction.DOWN]);
  for (let i = 0; i < 50; i++) {
    p.update(ch, 0.05, ctx);
    expect(ch.frame).toBe(0);
    expect(getCharacterSprite(ch, getCharacterSprites(0, 0))).toEqual(sprite);
  }
  ch.isActive = true;
  p.returnToWork(ch, ctx);
  expect(p.sessions.size).toBe(0);
  expect(ch.playTv).toBeUndefined();
  expect(ch.playVisualOffset).toBeUndefined();
  expect(p.spriteOverrides(1).size).toBe(0);
  expect(ch.seatId).toBe(home.uid);
  expect(ch.path.at(-1)).toEqual({ col: home.seatCol, row: home.seatRow });
});
it('uses the other couch seat when occupied and refuses both reserved/assigned seats', () => {
  const f = setup();
  f.ctx.occupied = (t) => t.col === 40 && t.row === 32;
  f.p.update(f.ch, 60, f.ctx);
  expect(f.p.getState(1)?.anchor).toEqual({ col: 41, row: 32 });
  const g = setup();
  for (const s of g.ctx.seats.values())
    if (s.uid.startsWith('break28-seat-sofa')) s.assigned = true;
  expect(g.p.update(g.ch, 60, g.ctx)).toBe(false);
  expect(g.p.sessions.size).toBe(0);
});
it('releases TV and pose on timeout, layout replacement and disappearance', () => {
  for (const end of ['timeout', 'layout', 'disappear']) {
    const f = setup();
    f.p.update(f.ch, 60, f.ctx);
    arrive(f);
    if (end === 'timeout') f.p.update(f.ch, 301, f.ctx);
    else if (end === 'layout') f.p.configure({ ...layout, furniture: [] }, [f.ch]);
    else f.p.forget(1);
    expect(f.p.sessions.size).toBe(0);
    expect(f.ch.playTv).toBeUndefined();
    expect(f.ch.state).not.toBe(CharacterState.PLAY);
  }
});
it('preserves TV rear-panel art and limits light to a translucent fading quadrilateral', () => {
  const tv = layoutToys(layout).find((t) => t.tv)!,
    original = JSON.stringify(tv.sprite),
    on = toyAnimation(tv.type, tv.sprite, 0);
  expect(on).toEqual(tv.sprite);
  expect(JSON.stringify(tv.sprite)).toBe(original);
  const poly = tvLightPolygon(tv.tv!);
  expect(poly).toHaveLength(4);
  expect(poly[0].y - poly[3].y).toBe(48);
  const stops: unknown[] = [];
  const gradient = { addColorStop: (...a: unknown[]) => stops.push(a) };
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
  };
  drawTvLight(ctx as unknown as CanvasRenderingContext2D, tv.tv!, 10, 20, 3);
  expect(stops).toEqual([
    [0, 'rgba(110,170,255,0.13)'],
    [0.35, 'rgba(110,170,255,0.085)'],
    [0.75, 'rgba(110,170,255,0.025)'],
    [1, 'rgba(110,170,255,0)'],
  ]);
  const coords = ctx.createLinearGradient.mock.calls[0] as unknown as number[];
  expect(coords[0]).toBe(coords[2]);
  expect(ctx.lineTo).toHaveBeenCalledTimes(3);
  expect(ctx.restore).toHaveBeenCalledOnce();
});

it('holds each hue for a randomized 3–6 seconds and changes only the translucent light without moving the viewer', () => {
  const f = setup();
  f.p.update(f.ch, 60, f.ctx);
  arrive(f);
  const tv = f.ch.playTv!;
  const offset = { ...f.ch.playVisualOffset },
    first = f.p.spriteOverrides(0).get('break28-tv');
  expect(tv.hueRemaining).toBe(3);
  f.p.update(f.ch, 2.99, f.ctx);
  expect(tv.tint).toBe(0);
  f.p.update(f.ch, 0.02, f.ctx);
  expect(tv.tint).toBe(1);
  expect(tv.hueRemaining).toBeCloseTo(2.99);
  expect(f.p.spriteOverrides(0).get('break28-tv')).toEqual(first);
  expect(f.ch.playVisualOffset).toEqual(offset);
  // Change only the injected timer RNG after arrival to exercise the upper interval bound.
  (f.p as unknown as { random: () => number }).random = () => 0.999999;
  f.p.update(f.ch, 3, f.ctx);
  expect(tv.tint).not.toBe(1);
  expect(tv.hueRemaining).toBeGreaterThan(5.98);
  expect(tv.hueRemaining).toBeLessThan(6);
});
