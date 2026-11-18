// Gary1571942280313577543: identity-owned NSI stations; Rebooto is a fixed screen, never a walker.
import data from './nsiData.json';
import { isReadingToolName } from './toolUtils.js';
import { type Character, CharacterState, Direction, type Seat, type SpriteData } from './types.js';
type Name = 'rooty' | 'digby' | 'rebooto';
type Identity = Pick<
  Partial<Character>,
  'directoryName' | 'agentName' | 'isSubagent' | 'leadAgentId' | 'parentAgentId'
>;
let seconds = 0;
const cache = new Map<number, SpriteData>();
function sprite(id: number): SpriteData {
  let v = cache.get(id);
  if (!v) {
    v = data.frames[id].map((row) => Array.from(row, (c) => data.palette[c.charCodeAt(0) - 256]));
    cache.set(id, v);
  }
  return v;
}
export function nsiIdentity(ch: Identity): Name | null {
  if (ch.isSubagent || ch.leadAgentId !== undefined || ch.parentAgentId != null) return null;
  for (const label of [ch.directoryName, ch.agentName]) {
    const n = label?.trim().toLowerCase();
    if (n === 'rooty' || n === 'rooty raccoon' || n === 'rooty-raccoon') return 'rooty';
    if (n === 'digby' || n === 'digby otter' || n === 'digby crawlerton') return 'digby';
    if (n === 'rebooto' || n === 'rebooto mcclickens') return 'rebooto';
  }
  return null;
}
export function nsiSeat(ch: Identity): string | null {
  const n = nsiIdentity(ch);
  return n ? data.spots[n].seat : null;
}
export function isNsiSeat(id?: string | null): boolean {
  return !!id && Object.values(data.spots).some((s) => s.seat === id);
}
export function setNsiClock(t: number): void {
  seconds = t;
}
function atWork(ch: Character, n: Name): boolean {
  const s = data.spots[n];
  return (
    ch.isActive &&
    ch.state === CharacterState.TYPE &&
    ch.seatId === s.seat &&
    ch.tileCol === s.col &&
    ch.tileRow === s.row &&
    !ch.matrixEffect
  );
}
export function nsiSprite(ch: Character): SpriteData | null {
  const n = nsiIdentity(ch);
  if (!n) return null;
  if (n === 'rebooto') {
    const state = ch.isActive
      ? isReadingToolName(ch.currentTool ?? '')
        ? 'read'
        : 'work'
      : ch.bubbleType === 'waiting'
        ? 'think'
        : 'idle';
    return sprite(data.characters.rebooto[state][Math.floor((seconds + 1e-8) / 0.25) % 16]);
  }
  if (n === 'digby' && atWork(ch, n) && !isReadingToolName(ch.currentTool ?? ''))
    return sprite(
      data.characters.digby.work[
        Math.floor((seconds * 1000 + 1e-6) / data.characters.digby.workFrameMs) %
          data.characters.digby.work.length
      ],
    );
  const c = data.characters[n],
    dir = (['down', 'left', 'right', 'up'] as const)[ch.dir];
  if (atWork(ch, n))
    return sprite(
      c[n === 'rooty' ? 'left' : 'right'][
        isReadingToolName(ch.currentTool ?? '') ? 'read' : 'type'
      ][Math.floor((seconds + 1e-8) / 0.3) % 2],
    );
  return sprite(c[dir].walk[ch.state === CharacterState.WALK ? [0, 1, 2, 1][ch.frame % 4] : 1]);
}
export function nsiOffset(ch: Character): { x: number; y: number } | null {
  const n = nsiIdentity(ch);
  if (!n) return null;
  if (n !== 'rebooto' && !atWork(ch, n)) return { x: 0, y: 0 };
  const f = data.spots[n].feet;
  if (n === 'digby' && atWork(ch, n) && !isReadingToolName(ch.currentTool ?? '')) {
    const im = nsiSprite(ch)!;
    const a = data.characters.digby.workAnchor;
    return {
      x: f[0] - ch.x + im[0].length / 2 - a[0] + data.spots.digby.workOffset[0],
      y: f[1] - ch.y + im.length - a[1],
    };
  }
  return { x: f[0] - ch.x, y: f[1] - ch.y };
}
export function nsiBounds(
  ch: Character,
): { left: number; top: number; right: number; bottom: number } | null {
  const n = nsiIdentity(ch);
  if (!n) return null;
  if (n === 'rebooto') {
    const [x, y] = data.spots.rebooto.feet;
    return { left: x - 8, top: y - 32, right: x + 8, bottom: y - 16 };
  }
  return null;
}
export function nsiDepth(ch: Character): number | null {
  return nsiIdentity(ch) === 'rebooto' ? 208.1 : null;
}
/** Freeze both inactive and active Rebooto at his owned socket, including across reconnect/rest. */
export function holdRebooto(ch: Character, seats: Map<string, Seat>): boolean {
  if (nsiIdentity(ch) !== 'rebooto') return false;
  const s = data.spots.rebooto;
  if (ch.seatId !== s.seat) {
    const old = ch.seatId ? seats.get(ch.seatId) : undefined;
    if (old) old.assigned = false;
  }
  const seat = seats.get(s.seat);
  if (seat) seat.assigned = true;
  ch.seatId = s.seat;
  ch.tileCol = s.col;
  ch.tileRow = s.row;
  ch.x = s.col * 16 + 8;
  ch.y = s.row * 16 + 8;
  ch.dir = Direction.DOWN;
  ch.path = [];
  ch.moveProgress = 0;
  ch.seatTimer = 0;
  ch.state = ch.isActive ? CharacterState.TYPE : CharacterState.IDLE;
  return true;
}
export function nsiPortrait(label?: string): SpriteData | null {
  const n = nsiIdentity({ directoryName: label });
  return !n
    ? null
    : n === 'rebooto'
      ? sprite(data.characters.rebooto.idle[0])
      : sprite(data.characters[n].down.walk[1]);
}
export function nsiLayer(type: string): 'floor' | 'background' | null {
  return (
    (data.layers[type as keyof typeof data.layers] as 'floor' | 'background' | undefined) ?? null
  );
}
export function nsiStationType(type: string, lit: ReadonlySet<string>): string {
  for (const n of ['rooty', 'digby'] as const)
    if (type === 'nsi26-laptop-' + n && lit.has(data.spots[n].seat)) return type + '-on';
  return type;
}

/** Surface accessories sort after the console but before its operator. */
export function nsiSurfaceDepth(type: string): number | null {
  return /^nsi26-laptop-(?:rooty|digby)(?:-on)?$/.test(type) ? 136.5 : null;
}

// Gary1572169008742928455: tiny existing indicator pixels only; no rack art/collision changes.
export const NSI_RACK_LEDS: Record<string, number[][][]> = {
  'nsi26-rooty-racks': [
    [
      [5, 17],
      [6, 17],
    ],
    [
      [5, 21],
      [5, 22],
    ],
    [
      [5, 43],
      [6, 43],
    ],
    [
      [29, 17],
      [29, 18],
    ],
    [[39, 15]],
    [[31, 22]],
    [
      [52, 17],
      [52, 18],
    ],
    [[52, 21]],
    [
      [66, 43],
      [66, 44],
    ],
  ],
  'nsi26-digby-racks': [
    [[10, 44]],
    [[10, 47]],
    [
      [33, 31],
      [33, 32],
    ],
    [[33, 35]],
    [
      [33, 44],
      [33, 45],
    ],
    [[52, 34]],
    [[54, 44]],
    [[54, 47]],
  ],
};
const rackLightCache = new WeakMap<SpriteData, Map<string, SpriteData[]>>();
export function nsiRackLights(
  type: string,
  source: SpriteData,
  elapsedSeconds = performance.now() / 1000,
): SpriteData {
  const lamps = NSI_RACK_LEDS[type];
  if (!lamps) return source;
  let byType = rackLightCache.get(source);
  if (!byType) {
    byType = new Map();
    rackLightCache.set(source, byType);
  }
  let phases = byType.get(type);
  if (!phases) {
    phases = Array.from({ length: 8 }, (_, phase) => {
      const out = source.map((row) => row.slice());
      lamps.forEach((points, i) => {
        const rack = type === 'nsi26-rooty-racks' ? Math.floor(i / 3) : i < 2 ? 0 : i < 5 ? 1 : 2;
        const offset = (i * 2 + rack + (type === 'nsi26-digby-racks' ? 3 : 0)) % 8;
        if ((phase + offset) % 8 < 4) return;
        for (const [x, y] of points) {
          const c = source[y]?.[x];
          if (!c) continue;
          const rgb = [1, 3, 5]
            .map((a) =>
              Math.round(parseInt(c.slice(a, a + 2), 16) * 0.18)
                .toString(16)
                .padStart(2, '0'),
            )
            .join('');
          out[y][x] = '#' + rgb + c.slice(7);
        }
      });
      return out;
    });
    byType.set(type, phases);
  }
  return phases[Math.floor((elapsedSeconds + 1e-8) / 1.5) % 8];
}
