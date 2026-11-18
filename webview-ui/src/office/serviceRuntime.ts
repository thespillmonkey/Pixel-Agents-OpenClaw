// Gary1571414819221934122: Mail/Farm/Security room, identity-owned workspots and native actions.
import data from './serviceData.json';
import { isReadingToolName } from './toolUtils.js';
import { type Character, CharacterState, type SpriteData } from './types.js';
type Name = keyof typeof data.characters;
type Identity = Pick<
  Partial<Character>,
  'directoryName' | 'agentName' | 'isSubagent' | 'leadAgentId' | 'parentAgentId'
>;
let elapsed = 0;
const cache = new Map<number, SpriteData>();
function sprite(id: number): SpriteData {
  let s = cache.get(id);
  if (!s) {
    s = data.frames[id].map((row) => Array.from(row, (c) => data.palette[c.charCodeAt(0) - 256]));
    cache.set(id, s);
  }
  return s;
}
export function serviceIdentity(ch: Identity): Name | null {
  if (ch.isSubagent || ch.leadAgentId !== undefined || ch.parentAgentId != null) return null;
  for (const label of [ch.directoryName, ch.agentName]) {
    const n = label?.trim().toLowerCase();
    if (n && ['pepe', 'pepe silvia', 'pepe-silvia'].includes(n)) return 'pepe';
    if (n === 'patches') return 'patches';
    if (n && ['foggy', 'foggy wilkins', 'foggy-wilkins'].includes(n)) return 'foggy';
  }
  return null;
}
export function serviceSeat(ch: Identity): string | null {
  const n = serviceIdentity(ch);
  return n ? data.spots[n].seat : null;
}
export function isServiceSeat(id?: string | null): boolean {
  return !!id && Object.values(data.spots).some((s) => s.seat === id);
}
export function setServiceClock(seconds: number): void {
  elapsed = seconds;
}
function atWork(ch: Character): Name | null {
  const n = serviceIdentity(ch);
  if (!n || !ch.isActive || ch.state !== CharacterState.TYPE || ch.matrixEffect) return null;
  const s = data.spots[n];
  return ch.seatId === s.seat && ch.tileCol === s.col && ch.tileRow === s.row ? n : null;
}
function phase(n: Name): number {
  return (
    Math.floor((elapsed * 1000 + 1e-6) / data.characters[n].frameMs) %
    data.characters[n].work.length
  );
}
export function serviceSprite(ch: Character): SpriteData | null {
  const n = serviceIdentity(ch);
  if (!n) return null;
  const c = data.characters[n],
    dir = (['down', 'left', 'right', 'up'] as const)[ch.dir];
  if (atWork(ch)) {
    if (n !== 'pepe' && isReadingToolName(ch.currentTool ?? '')) {
      const orig = c.original[dir];
      return sprite(
        orig.length >= 55
          ? orig[7 + (Math.floor(elapsed * 10) % 48)]
          : orig[5 + (Math.floor(elapsed / 0.3) % 2)],
      );
    }
    return sprite(c.work[phase(n)]);
  }
  const original = c.original[dir];
  return sprite(original[ch.state === CharacterState.WALK ? [0, 1, 2, 1][ch.frame % 4] : 1]);
}
export function serviceOffset(ch: Character): { x: number; y: number } | null {
  const n = atWork(ch);
  if (!n) return null;
  const s = data.spots[n];
  if (n !== 'pepe' && isReadingToolName(ch.currentTool ?? ''))
    return { x: s.feet[0] - ch.x, y: s.feet[1] - ch.y + (n === 'foggy' ? -6 : 0) };
  const im = sprite(data.characters[n].work[phase(n)]);
  return {
    x: s.feet[0] - s.anchor[0] + im[0].length / 2 - ch.x + (n === 'patches' ? -5 : 0),
    y: s.feet[1] - s.anchor[1] + im.length - ch.y + (n === 'patches' ? -3 : n === 'foggy' ? -6 : 0),
  };
}
export function serviceBounds(
  ch: Character,
): { left: number; top: number; right: number; bottom: number } | null {
  const n = atWork(ch);
  if (!n) return null;
  const im = serviceSprite(ch)!,
    off = serviceOffset(ch)!,
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
export function servicePortrait(name?: string): SpriteData | null {
  const n = serviceIdentity({ directoryName: name });
  return n ? sprite(data.characters[n].original.down[1]) : null;
}
export function serviceFurnitureType(
  type: string,
  seconds: number,
  lit: ReadonlySet<string>,
): string {
  if (type === 'trio26-monitors')
    return 'trio26-monitors-scene-' + (Math.floor((seconds + 1e-8) / 10) % 4);
  if (
    type === 'trio26-hoe' &&
    lit.has(data.spots.patches.seat) &&
    !lit.has('trio26-patches-reading')
  )
    return 'trio26-hoe-' + String(Math.floor((seconds + 1e-8) / 0.05) % 40).padStart(2, '0');
  return type;
}
export function serviceFurnitureRule(type: string): { depth: number; background: boolean } | null {
  return data.rules[type as keyof typeof data.rules] ?? null;
}

// Gary1571691844109213766: seated Foggy is behind the chair back, not a standing walker.
export function serviceCharacterDepth(ch: Character): number | null {
  return atWork(ch) === 'foggy' ? 288 + data.rules['trio26-chair-art'].depth - 0.5 : null;
}
