// Gary1572154166066024549: approved Takemi clinic; identity-owned chair and exact native timelines.
import data from './clinicData.json';
import { isReadingToolName } from './toolUtils.js';
import { type Character, CharacterState, type SpriteData } from './types.js';
type Identity = Pick<
  Partial<Character>,
  'directoryName' | 'agentName' | 'isSubagent' | 'leadAgentId' | 'parentAgentId'
>;
let seconds = 0;
const cache = new Map<number, SpriteData>();
function sprite(id: number): SpriteData {
  let s = cache.get(id);
  if (!s) {
    s = data.frames[id].map((row) => Array.from(row, (c) => data.palette[c.charCodeAt(0) - 256]));
    cache.set(id, s);
  }
  return s;
}
export function clinicIdentity(ch: Identity): boolean {
  return (
    !ch.isSubagent &&
    ch.leadAgentId === undefined &&
    ch.parentAgentId == null &&
    [ch.directoryName, ch.agentName].some(
      (n) =>
        !!n &&
        [
          'takemi',
          'tae',
          'tae takemi',
          'tae-takemi',
          'tae_takemi',
          'dr. tae takemi',
          'dr tae takemi',
          'doctor tae takemi',
        ].includes(n.trim().toLowerCase()),
    )
  );
}
export function clinicSeat(ch: Identity): string | null {
  return clinicIdentity(ch) ? data.seat : null;
}
export function isClinicSeat(id?: string | null): boolean {
  return id === data.seat;
}
export function setClinicClock(t: number): void {
  seconds = t;
}
export function clinicSeated(ch: Character): boolean {
  return (
    clinicIdentity(ch) &&
    ch.state === CharacterState.TYPE &&
    !ch.matrixEffect &&
    ch.seatId === data.seat &&
    ch.tileCol === data.col &&
    ch.tileRow === data.row
  );
}
export function clinicSprite(ch: Character): SpriteData | null {
  if (!clinicIdentity(ch)) return null;
  const direction = (['down', 'left', 'right', 'up'] as const)[ch.dir];
  if (clinicSeated(ch)) {
    const seq = ch.isActive
        ? isReadingToolName(ch.currentTool ?? '')
          ? data.characters.down.reading
          : data.characters.down.work
        : data.characters.down.seated,
      frameMs = 150;
    return sprite(seq[Math.floor((seconds * 1000 + 1e-5) / frameMs) % seq.length]);
  }
  const seq = data.characters[direction][ch.state === CharacterState.WALK ? 'walking' : 'idle'];
  return sprite(
    seq[
      Math.floor((seconds + 1e-8) / (ch.state === CharacterState.WALK ? 0.12 : 0.15)) % seq.length
    ],
  );
}
export function clinicOffset(ch: Character): { x: number; y: number } | null {
  if (!clinicIdentity(ch)) return null;
  if (!clinicSeated(ch)) return { x: 0, y: 0 };
  const im = clinicSprite(ch)!;
  return {
    x: data.feet[0] - ch.x + im[0].length / 2 - data.seatedAnchor[0],
    y: data.feet[1] - ch.y + im.length - data.seatedAnchor[1],
  };
}
export function clinicDepth(ch: Character): number | null {
  return clinicSeated(ch) ? 158.1 : null;
}
export function clinicPortrait(name?: string): SpriteData | null {
  return clinicIdentity({ directoryName: name }) ? sprite(data.characters.down.standing[0]) : null;
}
export function clinicRule(type: string) {
  return data.rules[type as keyof typeof data.rules] ?? null;
}
export function clinicStationType(
  type: string,
  lit: ReadonlySet<string>,
  occupied = false,
): string {
  if (type === 'clinic27-monitor') return lit.has(data.seat) ? type : 'clinic27-monitor-off';
  if (type === 'clinic27-takemi-chair-front')
    return lit.has(data.seat) || occupied ? type : 'clinic27-chair-front-off';
  return type;
}

/** Include the raised syringe in pointer picking without changing navigation feet. */
export function clinicBounds(
  ch: Character,
): { left: number; top: number; right: number; bottom: number } | null {
  if (!clinicSeated(ch)) return null;
  const im = clinicSprite(ch)!,
    off = clinicOffset(ch)!,
    x = ch.x + off.x - im[0].length / 2,
    y = ch.y + off.y - im.length;
  let l = im[0].length,
    t = im.length,
    r = 0,
    b = 0;
  for (let yy = 0; yy < im.length; yy++)
    for (let xx = 0; xx < im[yy].length; xx++)
      if (im[yy][xx]) {
        l = Math.min(l, xx);
        t = Math.min(t, yy);
        r = Math.max(r, xx + 1);
        b = Math.max(b, yy + 1);
      }
  return { left: x + l, top: y + t, right: x + r, bottom: y + b };
}
