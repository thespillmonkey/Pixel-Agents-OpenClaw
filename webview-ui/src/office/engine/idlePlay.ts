import { WALK_FRAME_DURATION_SEC } from '../../constants.js';
import { getCatalogEntry } from '../layout/furnitureCatalog.js';
import { findPath, isWalkable } from '../layout/tileMap.js';
import { nsiIdentity } from '../nsiRuntime.js';
import {
  type Character,
  CharacterState,
  Direction,
  type OfficeLayout,
  type Seat,
  type SpriteData,
  TILE_SIZE,
  type TileType,
} from '../types.js';
import { stepAlongPath } from './characters.js';
export { toyAnimation } from './toyAnimations.js';
import { toyAnimation } from './toyAnimations.js';

export const IDLE_PLAY_INTERVAL = 60,
  IDLE_PLAY_CHANCE = 0.3;
export const MULTIPLAYER_CHANCE = 0.5;
export const TOY_TYPES = new Set([
  'break28-arcade',
  'break28-pinball-space',
  'break28-pinball-dragon',
  'break28-dartboard',
  'break28-claw',
  'break28-counter',
  'break28-coffee-maker',
  'break28-hockey',
  'break28-foosball',
]);
type Tile = { col: number; row: number };
type Point = { x: number; y: number };
export type Toy = {
  uid: string;
  type: string;
  anchor: Tile;
  feet: Point;
  facing: Direction;
  sprite: SpriteData;
  slot: number;
  multiplayer: boolean;
};
type Session = {
  toy: Toy;
  phase: 'approaching' | 'waiting' | 'playing';
  remaining: number;
  travelSeconds: number;
  partner?: number;
};
type Context = {
  tileMap: TileType[][];
  blocked: Set<string>;
  seats: Map<string, Seat>;
  occupied: (tile: Tile, id: number, ignore?: ReadonlySet<number>) => boolean;
};
/** Exact interaction points derive from the placed art; navigation remains on walkable grid cells. */
export function layoutToys(layout: OfficeLayout): Toy[] {
  return layout.furniture.flatMap((item) => {
    if (!TOY_TYPES.has(item.type)) return [];
    const e = getCatalogEntry(item.type);
    if (!e) return [];
    const x = item.col * TILE_SIZE + (e.drawOffsetX ?? 0),
      y = item.row * TILE_SIZE + (e.drawOffsetY ?? 0),
      w = e.sprite[0].length,
      h = e.sprite.length;
    const multi = item.type === 'break28-hockey' || item.type === 'break28-foosball';
    let specs: { feet: Point; facing: Direction }[];
    if (multi) {
      const cy = y + (item.type === 'break28-hockey' ? 19 : 30);
      specs = [
        { feet: { x: x - 8, y: cy }, facing: Direction.RIGHT },
        { feet: { x: x + w + 8, y: cy }, facing: Direction.LEFT },
      ];
    } else {
      let fx = x + w / 2,
        fy = y + h + 10;
      if (item.type === 'break28-dartboard') fy = y + h + 25;
      if (item.type === 'break28-counter') {
        fx = x + 20;
        fy = y + h + 10;
      }
      if (item.type === 'break28-coffee-maker') {
        fx = x + 5;
        fy = y + h + 20;
      }
      if (item.type === 'break28-claw') {
        fx = x - 8;
        fy = y + h - 5;
      }
      specs = [
        {
          feet: { x: Math.round(fx), y: Math.round(fy) },
          facing: item.type === 'break28-claw' ? Direction.RIGHT : Direction.UP,
        },
      ];
    }
    return specs.map((s, slot) => ({
      uid: item.uid,
      type: item.type,
      feet: s.feet,
      anchor: { col: Math.floor(s.feet.x / 16), row: Math.floor(s.feet.y / 16) },
      facing: s.facing,
      sprite: e.sprite,
      slot,
      multiplayer: multi,
    }));
  });
}
export function playEligible(ch: Character): boolean {
  return (
    !ch.isActive &&
    !ch.isSubagent &&
    ch.leadAgentId === undefined &&
    ch.parentAgentId == null &&
    !ch.matrixEffect &&
    nsiIdentity(ch) !== 'rebooto' &&
    ch.bubbleType !== 'permission' &&
    !ch.activityUnknown &&
    !(ch.bubbleType === 'waiting' && ch.waitingAwaitingInput)
  );
}
const key = (t: Tile) => `${t.col},${t.row}`;
export class IdlePlay {
  readonly sessions = new Map<number, Session>();
  private elapsed = new Map<number, number>();
  private toys: Toy[] = [];
  private actors = new Map<number, Character>();
  private lastCohort = '';
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  configure(layout: OfficeLayout, characters: Iterable<Character>): void {
    for (const ch of characters) this.cancel(ch);
    this.sessions.clear();
    this.elapsed.clear();
    this.actors.clear();
    this.lastCohort = '';
    this.toys = layoutToys(layout);
  }
  getTargets(): Toy[] {
    return this.toys;
  }
  getState(id: number) {
    const s = this.sessions.get(id);
    return s
      ? {
          toyId: s.toy.uid,
          type: s.toy.type,
          slot: s.toy.slot,
          phase: s.phase,
          remaining: s.remaining,
          anchor: { ...s.toy.anchor },
          feet: { ...s.toy.feet },
          partner: s.partner,
        }
      : null;
  }
  playingIds(): Set<string> {
    return new Set(
      [...this.sessions.values()].filter((s) => s.phase === 'playing').map((s) => s.toy.uid),
    );
  }
  navigationBlocked(base: Set<string>, except?: number): Set<string> {
    if (!this.sessions.size) return base;
    const b = new Set(base);
    for (const [id, s] of this.sessions) if (id !== except) b.add(key(s.toy.anchor));
    return b;
  }
  private stop(ch: Character): void {
    const edge = ch.state === CharacterState.WALK && ch.moveProgress > 0 ? ch.path.slice(0, 1) : [];
    ch.path = edge;
    if (!edge.length) ch.moveProgress = 0;
    ch.state = edge.length ? CharacterState.WALK : CharacterState.IDLE;
    ch.frame = 0;
    ch.frameTimer = 0;
    ch.wanderTimer = 2;
    delete ch.playVisualOffset;
  }
  cancel(ch: Character): boolean {
    this.elapsed.delete(ch.id);
    const s = this.sessions.get(ch.id);
    if (!s) return false;
    this.sessions.delete(ch.id);
    this.stop(ch);
    if (s.partner !== undefined) {
      const p = this.actors.get(s.partner);
      this.sessions.delete(s.partner);
      this.elapsed.delete(s.partner);
      if (p) this.stop(p);
    }
    return true;
  }
  forget(id: number): void {
    const ch = this.actors.get(id);
    if (ch) this.cancel(ch);
    else this.sessions.delete(id);
    this.elapsed.delete(id);
    this.actors.delete(id);
  }
  returnToWork(ch: Character, ctx: Context): void {
    if (!this.cancel(ch)) return;
    const seat = ch.seatId ? ctx.seats.get(ch.seatId) : undefined;
    if (!seat) {
      ch.state = CharacterState.TYPE;
      return;
    }
    const edge = ch.path[0],
      from = edge ?? { col: ch.tileCol, row: ch.tileRow },
      path = findPath(
        from.col,
        from.row,
        seat.seatCol,
        seat.seatRow,
        ctx.tileMap,
        this.navigationBlocked(ctx.blocked, ch.id),
      );
    if (path.length || (from.col === seat.seatCol && from.row === seat.seatRow)) {
      ch.path = [...(edge ? [edge] : []), ...path];
      ch.state = ch.path.length ? CharacterState.WALK : CharacterState.TYPE;
      if (!ch.path.length) ch.dir = seat.facingDir;
    }
  }
  /** Find a free approach nearest to the authored hand anchor, never rank toys by agent distance. */
  private approach(
    toy: Toy,
    ch: Character,
    ctx: Context,
    ignore = new Set<number>([ch.id]),
  ): { toy: Toy; path: Tile[] } | null {
    const blocked = new Set(ctx.blocked);
    for (const [id, s] of this.sessions) if (!ignore.has(id)) blocked.add(key(s.toy.anchor));
    const from =
      ch.moveProgress > 0 && ch.path[0] ? ch.path[0] : { col: ch.tileCol, row: ch.tileRow };
    const tiles: Tile[] = [];
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++)
        tiles.push({ col: toy.anchor.col + dc, row: toy.anchor.row + dr });
    const dist = (p: Tile) =>
      (p.col * 16 + 8 - toy.feet.x) ** 2 + (p.row * 16 + 8 - toy.feet.y) ** 2;
    tiles.sort((a, b) => dist(a) - dist(b));
    for (const t of tiles) {
      if (
        dist(t) > 32 ** 2 ||
        !isWalkable(t.col, t.row, ctx.tileMap, blocked) ||
        ctx.occupied(t, ch.id, ignore)
      )
        continue;
      // Do not select an approach on the opposite side of the furniture.
      if (
        (toy.facing === Direction.UP && t.row * 16 + 8 < toy.feet.y - 8) ||
        (toy.facing === Direction.RIGHT && t.col * 16 + 8 > toy.feet.x + 8) ||
        (toy.facing === Direction.LEFT && t.col * 16 + 8 < toy.feet.x - 8)
      )
        continue;
      const path = findPath(from.col, from.row, t.col, t.row, ctx.tileMap, blocked);
      if (path.length || (from.col === t.col && from.row === t.row))
        return { toy: { ...toy, anchor: t }, path };
    }
    return null;
  }
  private begin(
    ch: Character,
    pick: { toy: Toy; path: Tile[] },
    duration: number,
    partner?: number,
  ): void {
    const edge = ch.state === CharacterState.WALK && ch.moveProgress > 0 ? ch.path.slice(0, 1) : [];
    delete ch.playVisualOffset;
    this.sessions.set(ch.id, {
      toy: pick.toy,
      phase: 'approaching',
      remaining: duration,
      travelSeconds: 0,
      partner,
    });
    ch.path = [...edge, ...pick.path];
    if (!edge.length) ch.moveProgress = 0;
    ch.state = CharacterState.WALK;
    ch.frame = 0;
    ch.frameTimer = 0;
    ch.seatTimer = 0;
  }
  private place(ch: Character, s: Session): void {
    ch.state = CharacterState.PLAY;
    ch.dir = s.toy.facing;
    ch.frame = 0;
    ch.frameTimer = 0;
    ch.playVisualOffset = { x: s.toy.feet.x - ch.x, y: s.toy.feet.y - ch.y };
  }
  /** One 50% trial per newly formed >=4-player cohort, not a fresh roll every frame. */
  considerMultiplayer(ctx: Context): void {
    const all = [...this.sessions.entries()].filter(([, s]) => s.phase === 'playing');
    if (all.length < 4) {
      this.lastCohort = '';
      return;
    }
    const singles = all.filter(([, s]) => s.partner === undefined);
    if (singles.length < 2) return;
    const cohort = singles
      .map(([id]) => id)
      .sort((a, b) => a - b)
      .join(',');
    if (cohort === this.lastCohort) return;
    this.lastCohort = cohort;
    if (this.random() >= MULTIPLAYER_CHANCE) return;
    const pool = singles.slice();
    const take = () =>
      pool.splice(Math.min(pool.length - 1, Math.floor(this.random() * pool.length)), 1)[0];
    const [aid] = take(),
      [bid] = take(),
      a = this.actors.get(aid)!,
      b = this.actors.get(bid)!;
    if (!a || !b || !playEligible(a) || !playEligible(b)) return;
    const reserved = new Set([...this.sessions.values()].map((s) => s.toy.uid)),
      ignore = new Set([aid, bid]);
    // Free multiplayer furniture units receive equal weight; distance never enters the draw.
    const units = [
      ...new Set(this.toys.filter((t) => t.multiplayer && !reserved.has(t.uid)).map((t) => t.uid)),
    ];
    const choices = units.flatMap((uid) => {
      const slots = this.toys.filter((t) => t.uid === uid),
        pa = this.approach(slots[0], a, ctx, ignore),
        pb = this.approach(slots[1], b, ctx, ignore);
      if (!pa || !pb || key(pa.toy.anchor) === key(pb.toy.anchor)) return [];
      for (const [ch, pick, other] of [
        [a, pa, pb],
        [b, pb, pa],
      ] as const) {
        const blocked = new Set(ctx.blocked);
        for (const [id, s] of this.sessions) if (!ignore.has(id)) blocked.add(key(s.toy.anchor));
        blocked.add(key(other.toy.anchor));
        const from =
          ch.moveProgress > 0 && ch.path[0] ? ch.path[0] : { col: ch.tileCol, row: ch.tileRow };
        pick.path = findPath(
          from.col,
          from.row,
          pick.toy.anchor.col,
          pick.toy.anchor.row,
          ctx.tileMap,
          blocked,
        );
        if (
          !pick.path.length &&
          (from.col !== pick.toy.anchor.col || from.row !== pick.toy.anchor.row)
        )
          return [];
      }
      return [{ pa, pb }];
    });
    if (!choices.length) return;
    const { pa, pb } =
      choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))];
    this.cancel(a);
    this.cancel(b);
    const duration = 24 + this.random() * 16;
    this.begin(a, pa, duration, bid);
    this.begin(b, pb, duration, aid);
  }
  update(ch: Character, dt: number, ctx: Context): boolean {
    this.actors.set(ch.id, ch);
    if (!playEligible(ch)) {
      if (ch.isActive) this.returnToWork(ch, ctx);
      else this.cancel(ch);
      this.elapsed.delete(ch.id);
      return false;
    }
    let s = this.sessions.get(ch.id);
    if (!s) {
      const elapsed = (this.elapsed.get(ch.id) ?? 0) + dt;
      if (elapsed < IDLE_PLAY_INTERVAL) {
        this.elapsed.set(ch.id, elapsed);
        return false;
      }
      this.elapsed.set(ch.id, 0);
      if (this.random() >= IDLE_PLAY_CHANCE) return false;
      const reserved = new Set([...this.sessions.values()].map((s) => s.toy.uid));
      const choices = this.toys
        .filter((t) => !t.multiplayer && !reserved.has(t.uid))
        .flatMap((t) => {
          const p = this.approach(t, ch, ctx);
          return p ? [p] : [];
        });
      if (!choices.length) return false;
      const pick =
        choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))];
      this.begin(ch, pick, 20 + this.random() * 20);
      s = this.sessions.get(ch.id)!;
    }
    const t = s.toy.anchor,
      nav = this.navigationBlocked(ctx.blocked, ch.id);
    if (!isWalkable(t.col, t.row, ctx.tileMap, nav)) {
      this.cancel(ch);
      return false;
    }
    if (s.phase === 'approaching') {
      s.travelSeconds += dt;
      if (
        s.travelSeconds > 120 ||
        ch.path.some((p) => !isWalkable(p.col, p.row, ctx.tileMap, nav))
      ) {
        this.cancel(ch);
        return false;
      }
      if (ch.path.length) {
        ch.frameTimer += dt;
        if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) {
          ch.frameTimer %= WALK_FRAME_DURATION_SEC;
          ch.frame = (ch.frame + 1) % 4;
        }
        stepAlongPath(ch, dt);
      }
      if (!ch.path.length) {
        if (
          ch.tileCol !== t.col ||
          ch.tileRow !== t.row ||
          ctx.occupied(t, ch.id, new Set([ch.id, ...(s.partner !== undefined ? [s.partner] : [])]))
        ) {
          this.cancel(ch);
          return false;
        }
        if (s.partner !== undefined) {
          const p = this.sessions.get(s.partner);
          if (!p || p.partner !== ch.id) {
            this.cancel(ch);
            return false;
          }
          s.phase = 'waiting';
          this.place(ch, s);
          if (p.phase === 'waiting') {
            s.phase = p.phase = 'playing';
            const pc = this.actors.get(s.partner)!;
            this.place(pc, p);
          }
        } else {
          s.phase = 'playing';
          this.place(ch, s);
        }
      }
      return true;
    }
    if (s.phase === 'waiting') {
      s.travelSeconds += dt;
      if (s.travelSeconds > 120) this.cancel(ch);
      return true;
    }
    if (ch.tileCol !== t.col || ch.tileRow !== t.row) {
      this.cancel(ch);
      return false;
    }
    s.remaining -= dt;
    ch.frameTimer += dt;
    ch.frame = Math.floor(ch.frameTimer / 0.15) % 8;
    if (s.remaining <= 0) {
      this.cancel(ch);
      return false;
    }
    return true;
  }
  spriteOverrides(seconds: number): Map<string, SpriteData> {
    const out = new Map<string, SpriteData>();
    for (const s of this.sessions.values())
      if (s.phase === 'playing')
        out.set(s.toy.uid, toyAnimation(s.toy.type, s.toy.sprite, seconds));
    return out;
  }
}
const poseCache = new WeakMap<SpriteData, SpriteData[]>();
/** Fallback for agents outside the approved sprite scope. */
export function toyPose(source: SpriteData, frame: number): SpriteData {
  let poses = poseCache.get(source);
  if (!poses) {
    const upper = source.slice(0, Math.floor(source.length / 2)),
      width = source[0].length,
      dx = upper.every((r) => !r[width - 1]) ? 1 : upper.every((r) => !r[0]) ? -1 : 0,
      lean = source.map((r) => r.slice());
    for (let y = 0; y < upper.length; y++)
      for (let x = 0; x < width; x++) lean[y][x] = source[y][x - dx] ?? '';
    poses = [source, lean, source, source];
    poseCache.set(source, poses);
  }
  return poses[frame % 4];
}
