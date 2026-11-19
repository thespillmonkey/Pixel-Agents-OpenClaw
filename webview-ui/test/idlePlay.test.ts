/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import { afterEach, expect, it, vi } from 'vitest';

import { createCharacter } from '../src/office/engine/characters';
import {
  IDLE_PLAY_CHANCE,
  IdlePlay,
  layoutToys,
  toyAnimation,
  toyPose,
} from '../src/office/engine/idlePlay';
import { OfficeState } from '../src/office/engine/officeState';
import { buildDynamicCatalog } from '../src/office/layout/furnitureCatalog';
import {
  getBlockedTiles,
  layoutToSeats,
  layoutToTileMap,
} from '../src/office/layout/layoutSerializer';
import { CharacterState, Direction } from '../src/office/types';
import { playAssets, playLayout as layout } from './fixtures/playOffice.js';
buildDynamicCatalog(playAssets);
const seats = layoutToSeats(layout.furniture),
  tileMap = layoutToTileMap(layout),
  base = getBlockedTiles(layout.furniture);
function actor(id = 1) {
  const seat = seats.get('break28-seat-dining-north')!;
  const ch = createCharacter(id, 0, seat.uid, seat);
  ch.isActive = false;
  ch.state = CharacterState.IDLE;
  ch.matrixEffect = null;
  return ch;
}
function context(ch = actor()) {
  const blocked = new Set(base);
  if (ch.seatId) {
    const s = seats.get(ch.seatId)!;
    blocked.delete(`${s.seatCol},${s.seatRow}`);
  }
  return { tileMap, blocked, seats, occupied: () => false };
}
function arrive(play: IdlePlay, ch = actor(), ctx = context(ch)) {
  for (let i = 0; i < 3000 && play.getState(ch.id)?.phase !== 'playing'; i++)
    play.update(ch, 0.05, ctx);
  expect(play.getState(ch.id)?.phase).toBe('playing');
  return ch;
}
afterEach(() => vi.restoreAllMocks());
it('derives seven single-player and two two-slot multiplayer toys', () => {
  const targets = layoutToys(layout);
  expect(targets).toHaveLength(11);
  expect(targets.filter((t) => !t.multiplayer)).toHaveLength(7);
  expect(new Set(targets.filter((t) => t.multiplayer).map((t) => t.uid)).size).toBe(2);
});
it('checks only after sixty idle seconds; the exact probability cutoff is 30%, with no catch-up burst', () => {
  let value = IDLE_PLAY_CHANCE;
  const random = vi.fn(() => value),
    p = new IdlePlay(random),
    ch = actor(),
    ctx = context(ch);
  p.configure(layout, []);
  p.update(ch, 59.99, ctx);
  expect(random).not.toHaveBeenCalled();
  p.update(ch, 0.01, ctx);
  expect(p.sessions.size).toBe(0);
  expect(random).toHaveBeenCalledTimes(1);
  value = 0.29999;
  p.update(ch, 59.99, ctx);
  expect(random).toHaveBeenCalledTimes(1);
  p.update(ch, 0.02, ctx);
  expect(p.sessions.size).toBe(1);
  const q = new IdlePlay(random);
  q.configure(layout, []);
  random.mockClear();
  value = 0.8;
  q.update(actor(), 600, ctx);
  expect(random).toHaveBeenCalledTimes(1);
});
it('excludes active agents, helpers, team followers, permission waits, spawning and fixed Rebooto', () => {
  for (const patch of [
    { isActive: true },
    { isSubagent: true },
    { leadAgentId: 2 },
    { parentAgentId: 2 },
    { bubbleType: 'permission' },
    { matrixEffect: 'spawn' },
    { directoryName: 'rebooto' },
    { bubbleType: 'waiting', waitingAwaitingInput: true },
    { activityUnknown: true },
  ]) {
    const p = new IdlePlay(() => 0),
      ch = Object.assign(actor(), patch);
    p.configure(layout, []);
    p.update(ch, 60, context(ch));
    expect(p.sessions.size).toBe(0);
  }
});
it('rejects occupied/unreachable toys and keeps normal idle handling available', () => {
  const p = new IdlePlay(() => 0),
    ch = actor(),
    ctx = context(ch);
  p.configure(layout, []);
  expect(p.update(ch, 60, { ...ctx, occupied: () => true })).toBe(false);
  const blocked = new Set(ctx.blocked);
  for (const t of p.getTargets())
    for (let dc = -2; dc <= 2; dc++)
      for (let dr = -2; dr <= 2; dr++) blocked.add(`${t.anchor.col + dc},${t.anchor.row + dr}`);
  expect(p.update(ch, 60, { ...ctx, blocked })).toBe(false);
  expect(p.sessions.size).toBe(0);
});
it('reserves each toy exclusively, blocks its approach for other wanderers and never lights it in transit', () => {
  const p = new IdlePlay(() => 0);
  p.configure(layout, []);
  for (let id = 1; id <= 8; id++) {
    const ch = actor(id);
    p.update(ch, 60, context(ch));
  }
  expect(p.sessions.size).toBe(7);
  expect(new Set([...p.sessions.values()].map((s) => s.toy.uid)).size).toBe(7);
  expect(p.playingIds().size).toBe(0);
  expect(p.spriteOverrides(1).size).toBe(0);
  expect(p.navigationBlocked(new Set()).size).toBe(7);
});
it('starts the toy only on arrival, plays for 20–40 seconds, then releases it and resumes idle', () => {
  const p = new IdlePlay(() => 0),
    ch = actor(),
    ctx = context(ch);
  p.configure(layout, []);
  const home = ch.seatId;
  p.update(ch, 60, ctx);
  arrive(p, ch, ctx);
  expect(ch.state).toBe(CharacterState.PLAY);
  expect(ch.isActive).toBe(false);
  expect(ch.seatId).toBe(home);
  expect(p.playingIds().size).toBe(1);
  expect(p.spriteOverrides(1).size).toBe(1);
  for (let i = 0; i < 401; i++) p.update(ch, 0.05, ctx);
  expect(p.sessions.size).toBe(0);
  expect(ch.state).toBe(CharacterState.IDLE);
  expect(p.spriteOverrides(1).size).toBe(0);
});
it('immediately abandons either approach or play and targets the assigned workstation, preserving a partial step', () => {
  for (const playing of [false, true]) {
    const p = new IdlePlay(() => 0),
      ch = actor(),
      ctx = context(ch);
    p.configure(layout, []);
    p.update(ch, 60, ctx);
    if (playing) arrive(p, ch, ctx);
    else p.update(ch, 0.05, ctx);
    const oldXY = [ch.x, ch.y];
    ch.isActive = true;
    p.returnToWork(ch, ctx);
    expect([ch.x, ch.y]).toEqual(oldXY);
    expect(p.sessions.size).toBe(0);
    expect(p.spriteOverrides(1).size).toBe(0);
    const s = seats.get(ch.seatId!)!;
    expect(ch.path.at(-1) ?? { col: ch.tileCol, row: ch.tileRow }).toEqual({
      col: s.seatCol,
      row: s.seatRow,
    });
    expect([CharacterState.WALK, CharacterState.TYPE]).toContain(ch.state);
  }
});
it('releases reservations when a layout rebuild removes a toy or an agent disappears', () => {
  const p = new IdlePlay(() => 0),
    ch = actor();
  p.configure(layout, []);
  p.update(ch, 60, context(ch));
  p.configure({ ...layout, furniture: [] }, [ch]);
  expect(p.sessions.size).toBe(0);
  expect(ch.state).not.toBe(CharacterState.PLAY);
  p.configure(layout, []);
  p.update(ch, 60, context(ch));
  p.forget(ch.id);
  expect(p.sessions.size).toBe(0);
});
it('provides 600-slot table loops and unchanged single-player/source art', () => {
  for (const toy of layoutToys(layout)) {
    const frozen = JSON.stringify(toy.sprite),
      table = toy.multiplayer,
      phases = Array.from({ length: table ? 600 : 64 }, (_, n) =>
        toyAnimation(toy.type, toy.sprite, n * (table ? 0.04 : 0.1)),
      );
    expect(new Set(phases.map((p) => JSON.stringify(p))).size).toBeGreaterThan(5);
    expect(JSON.stringify(toy.sprite)).toBe(frozen);
    expect(toyAnimation(toy.type, toy.sprite, table ? 24 : 6.4)).toEqual(phases[0]);
  }
  const src = Array.from({ length: 32 }, () => Array(16).fill('#ffffff'));
  expect(toyPose(src, 1)).toEqual(src);
});
it('integrates real status events, immediate furniture off and return-to-work without changing the saved seat', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.001);
  const os = new OfficeState(layout);
  os.addAgent(98901, 0, 0, 'break28-seat-dining-north', true, 'idle-play-fixture');
  const ch = os.characters.get(98901)!;
  ch.matrixEffect = null;
  ch.isActive = false;
  ch.state = CharacterState.IDLE;
  const seatId = ch.seatId;
  for (let i = 0; i < 1201; i++) os.update(0.05);
  expect(os.idlePlay.sessions.size).toBe(1);
  for (let i = 0; i < 2400 && String(ch.state) !== CharacterState.PLAY; i++) os.update(0.05);
  expect(ch.state).toBe(CharacterState.PLAY);
  expect(os.idlePlay.playingIds().size).toBe(1);
  os.setAgentActive(ch.id, true);
  expect(os.idlePlay.sessions.size).toBe(0);
  expect(os.idlePlay.playingIds().size).toBe(0);
  expect(ch.seatId).toBe(seatId);
  for (let i = 0; i < 3000 && String(ch.state) !== CharacterState.TYPE; i++) os.update(0.05);
  expect(ch.state).toBe(CharacterState.TYPE);
  const seat = os.seats.get(seatId!)!;
  expect([ch.tileCol, ch.tileRow]).toEqual([seat.seatCol, seat.seatRow]);
  expect(os.getPersistableSeats()[ch.id].seatId).toBe(seatId);
});

it('rejects disconnected but unblocked anchors and expires abandoned travel reservations', () => {
  const ch = actor(),
    ctx = context(ch),
    p = new IdlePlay(() => 0);
  p.configure(layout, []);
  const b = new Set(ctx.blocked);
  for (const [dc, dr] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ])
    b.add(`${ch.tileCol + dc},${ch.tileRow + dr}`);
  expect(p.update(ch, 60, { ...ctx, blocked: b })).toBe(false);
  p.update(ch, 60, ctx);
  expect(p.sessions.size).toBe(1);
  p.update(ch, 121, ctx);
  expect(p.sessions.size).toBe(0);
});

it('randomizes across every free single-player toy, without distance ranking', () => {
  const seen = new Set<string>();
  for (let bin = 0; bin < 7; bin++) {
    const draws = [0, (bin + 0.1) / 7, 0];
    const p = new IdlePlay(() => draws.shift() ?? 0.9),
      ch = actor();
    p.configure(layout, []);
    p.update(ch, 60, context(ch));
    expect(p.sessions.size).toBe(1);
    seen.add(p.getState(ch.id)!.type);
  }
  expect(seen.size).toBe(7);
});
it('places darts exactly 45 native pixels south of the board bottom and centers the pinballs', () => {
  const toys = layoutToys(layout),
    dart = toys.find((t) => t.type === 'break28-dartboard')!;
  expect(dart.feet).toEqual({ x: 778, y: 387 });
  const claw = toys.find((t) => t.type === 'break28-claw')!;
  expect(claw.facing).toBe(Direction.RIGHT);
  expect(claw.feet).toEqual({ x: 848, y: 475 });
  expect(toys.find((t) => t.type === 'break28-pinball-space')!.feet).toEqual({ x: 805, y: 384 });
});
function fourPlayers(pairRandom = 0.001) {
  let value = 0.001;
  const random = vi.fn(() => value),
    p = new IdlePlay(random),
    chs = [1, 2, 3, 4].map((id) => actor(id));
  p.configure(layout, []);
  for (const ch of chs) {
    p.update(ch, 60, context(ch));
    arrive(p, ch, context(ch));
  }
  expect([...p.sessions.values()].filter((s) => s.phase === 'playing')).toHaveLength(4);
  value = pairRandom;
  return { p, chs, random, setValue: (n: number) => (value = n) };
}
it('rolls multiplayer at 50% once per cohort, not every animation update', () => {
  const { p, chs, random } = fourPlayers(0.5);
  const n = random.mock.calls.length;
  p.considerMultiplayer(context(chs[0]));
  expect(random.mock.calls.length).toBe(n + 1);
  expect([...p.sessions.values()].every((s) => s.partner === undefined)).toBe(true);
  p.considerMultiplayer(context(chs[0]));
  expect(random.mock.calls.length).toBe(n + 1);
});
it('selects either free multiplayer table with equal draw ranges, reserves opposite sides, and waits for both players', () => {
  const names = new Set<string>();
  for (const draw of [0.1, 0.9]) {
    const f = fourPlayers();
    const seq = [0, 0, 0, draw, 0];
    f.setValue(0.001);
    f.random.mockImplementation(() => seq.shift() ?? 0.001);
    f.p.considerMultiplayer(context(f.chs[0]));
    const paired = f.chs.filter((c) => f.p.getState(c.id)?.partner !== undefined);
    expect(paired).toHaveLength(2);
    const a = paired[0],
      b = paired[1],
      sa = f.p.getState(a.id)!,
      sb = f.p.getState(b.id)!;
    names.add(sa.type);
    expect(sa.toyId).toBe(sb.toyId);
    expect(sa.slot).not.toBe(sb.slot);
    expect(sa.anchor).not.toEqual(sb.anchor);
    for (let i = 0; i < 2500 && f.p.getState(a.id)?.phase !== 'waiting'; i++)
      f.p.update(a, 0.05, context(a));
    expect(f.p.getState(a.id)?.phase).toBe('waiting');
    expect(f.p.playingIds().has(sa.toyId)).toBe(false);
    for (let i = 0; i < 2500 && f.p.getState(b.id)?.phase !== 'playing'; i++)
      f.p.update(b, 0.05, context(b));
    expect(f.p.getState(a.id)?.phase).toBe('playing');
    expect(f.p.getState(b.id)?.phase).toBe('playing');
    expect(f.p.playingIds().has(sa.toyId)).toBe(true);
    a.isActive = true;
    f.p.returnToWork(a, context(a));
    expect(f.p.getState(a.id)).toBeNull();
    expect(f.p.getState(b.id)).toBeNull();
    expect(f.p.playingIds().has(sa.toyId)).toBe(false);
    expect(b.playVisualOffset).toBeUndefined();
    expect(b.state).toBe(CharacterState.IDLE);
  }
  expect(names).toEqual(new Set(['break28-foosball', 'break28-hockey']));
});
it('clears paired travel immediately on work or disappearance, and retains saved workstations', () => {
  for (const work of [true, false]) {
    const f = fourPlayers();
    f.p.considerMultiplayer(context(f.chs[0]));
    const paired = f.chs.filter((c) => f.p.getState(c.id)?.partner !== undefined);
    expect(paired).toHaveLength(2);
    const [a, b] = paired,
      seat = a.seatId;
    if (work) {
      a.isActive = true;
      f.p.returnToWork(a, context(a));
      expect(a.seatId).toBe(seat);
      expect(a.path.at(-1)).toEqual({
        col: seats.get(seat!)!.seatCol,
        row: seats.get(seat!)!.seatRow,
      });
    } else f.p.forget(a.id);
    expect(f.p.getState(a.id)).toBeNull();
    expect(f.p.getState(b.id)).toBeNull();
    expect(f.p.spriteOverrides(0).size).toBe(2);
  }
});
