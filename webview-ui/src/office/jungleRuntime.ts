import {
  clinicOffset,
  clinicPortrait,
  clinicSeat,
  clinicSprite,
  isClinicSeat,
  setClinicClock,
} from './clinicRuntime.js';
// Gary1571227944867860628: approved native jungle studio, identity-bound workstations.
import data from './jungleData.json';
import {
  isNsiSeat,
  nsiBounds,
  nsiLayer,
  nsiOffset,
  nsiPortrait,
  nsiSeat,
  nsiSprite,
  setNsiClock,
} from './nsiRuntime.js';
import {
  isServiceSeat,
  serviceBounds,
  serviceOffset,
  servicePortrait,
  serviceSeat,
  setServiceClock,
} from './serviceRuntime.js';
import { type Character, CharacterState, type SpriteData } from './types.js';
type Name = keyof typeof data.characters;
type Identity = Pick<
  Partial<Character>,
  'directoryName' | 'agentName' | 'isSubagent' | 'leadAgentId' | 'parentAgentId'
>;
let elapsed = 0;
const decoded = new Map<number, SpriteData>();
function sprite(id: number): SpriteData {
  let s = decoded.get(id);
  if (!s) {
    s = data.frames[id].map((row) => Array.from(row, (c) => data.palette[c.charCodeAt(0) - 256]));
    decoded.set(id, s);
  }
  return s;
}
export function jungleIdentity(ch: Identity): Name | null {
  if (ch.isSubagent || ch.leadAgentId !== undefined || ch.parentAgentId != null) return null;
  for (const label of [ch.directoryName, ch.agentName]) {
    const n = label?.trim().toLowerCase();
    if (n && Object.hasOwn(data.characters, n)) return n as Name;
  }
  return null;
}
export function jungleSeat(ch: Identity): string | null {
  return (
    clinicSeat(ch) ??
    nsiSeat(ch) ??
    serviceSeat(ch) ??
    (jungleIdentity(ch) ? data.spots[jungleIdentity(ch)!].seat : null)
  );
}
export function isJungleSeat(seat?: string | null): boolean {
  return (
    isClinicSeat(seat) ||
    isNsiSeat(seat) ||
    isServiceSeat(seat) ||
    (!!seat && Object.values(data.spots).some((s) => s.seat === seat))
  );
}
export function setJungleClock(seconds: number): void {
  elapsed = seconds;
  setClinicClock(seconds);
  setNsiClock(seconds);
  setServiceClock(seconds);
}
export function junglePhase(): number {
  return Math.floor((elapsed + 1e-8) / 0.15) % 24;
}
export function atJungleWork(ch: Character): Name | null {
  const n = jungleIdentity(ch);
  if (!n || !ch.isActive || ch.state !== CharacterState.TYPE || ch.matrixEffect) return null;
  const s = data.spots[n];
  return ch.seatId === s.seat && ch.tileCol === s.col && ch.tileRow === s.row ? n : null;
}
export function jungleOffset(ch: Character): { x: number; y: number } | null {
  const clinic = clinicOffset(ch);
  if (clinic) return clinic;
  const nsi = nsiOffset(ch);
  if (nsi) return nsi;
  const v = serviceOffset(ch);
  if (v) return v;
  const n = atJungleWork(ch);
  if (!n) return null;
  const o = data.spots[n].origin;
  return { x: o[0] + 40 - ch.x, y: o[1] + 80 - ch.y };
}
export function jungleSprite(ch: Character): SpriteData | null {
  const clinic = clinicSprite(ch);
  if (clinic) return clinic;
  const nsi = nsiSprite(ch);
  if (nsi) return nsi;
  const n = jungleIdentity(ch);
  if (!n) return null;
  const c = data.characters[n];
  if (atJungleWork(ch)) return sprite(c.work[junglePhase()]);
  const dir = (['down', 'left', 'right', 'up'] as const)[ch.dir];
  const seq = ch.state === CharacterState.WALK ? c.walk[dir] : c.idle[dir];
  let ms = (elapsed * 1000) % seq.durations.reduce((a, b) => a + b, 0),
    i = 0;
  while (i < seq.durations.length - 1 && ms >= seq.durations[i]) ms -= seq.durations[i++];
  return sprite(seq.frames[i]);
}
export function jungleStationType(type: string, seconds: number, lit: ReadonlySet<string>): string {
  const n = Object.keys(data.spots).find((n) => type === 'jun26-station-' + n) as Name | undefined;
  return n && lit.has(data.spots[n].seat)
    ? type + '-on-' + String(Math.floor((seconds + 1e-8) / 0.15) % 24).padStart(2, '0')
    : type;
}
export function jungleRenderLayer(type: string): 'floor' | 'background' | null {
  const nsi = nsiLayer(type);
  if (nsi) return nsi;
  if (!type.startsWith('jun26-')) return null;
  return type === 'jun26-room-floor' ? 'floor' : 'background';
}
/** Same approved identity for the live roster portrait, without changing saved palettes. */
export function junglePortrait(name?: string): SpriteData | null {
  const clinic = clinicPortrait(name);
  if (clinic) return clinic;
  const nsi = nsiPortrait(name);
  if (nsi) return nsi;
  const v = servicePortrait(name);
  if (v) return v;
  const n = jungleIdentity({ directoryName: name });
  return n ? sprite(data.characters[n].standing.down.frames[0]) : null;
}
const workBounds = new Map<Name, { left: number; top: number; right: number; bottom: number }>();
/** Transparent80px work canvases must not leave pointer targets/labels below the agent. */
export function jungleBounds(
  ch: Character,
): { left: number; top: number; right: number; bottom: number } | null {
  const nsi = nsiBounds(ch);
  if (nsi) return nsi;
  const v = serviceBounds(ch);
  if (v) return v;
  const n = atJungleWork(ch);
  if (!n) return null;
  let b = workBounds.get(n);
  if (!b) {
    b = { left: 80, top: 80, right: 0, bottom: 0 };
    for (const id of data.characters[n].work) {
      const s = sprite(id);
      for (let y = 0; y < s.length; y++)
        for (let x = 0; x < s[y].length; x++)
          if (s[y][x]) {
            b.left = Math.min(b.left, x);
            b.top = Math.min(b.top, y);
            b.right = Math.max(b.right, x + 1);
            b.bottom = Math.max(b.bottom, y + 1);
          }
    }
    workBounds.set(n, b);
  }
  const [x, y] = data.spots[n].origin;
  return { left: x + b.left, top: y + b.top, right: x + b.right, bottom: y + b.bottom };
}
