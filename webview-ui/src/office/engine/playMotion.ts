import data from '../playData.json';
import { type Character, Direction, type SpriteData } from '../types.js';
const cache = new Map<number, SpriteData>();
function decode(id: number): SpriteData {
  let s = cache.get(id);
  if (!s) {
    s = data.frames[id].map((r) => Array.from(r, (c) => data.palette[c.charCodeAt(0) - 256]));
    cache.set(id, s);
  }
  return s;
}
export function standingPlay(ch: Character, frame = ch.frame): SpriteData | null {
  const names = data.characters;
  let name: string | undefined;
  for (const label of [ch.directoryName, ch.agentName]) {
    const n = label?.trim().toLowerCase();
    if (n && Object.hasOwn(names, n)) {
      name = n;
      break;
    }
    if (n === 'mitsuki takasawa') {
      name = 'mitsuki';
      break;
    }
  }
  if (!name) return null;
  const di = (
    {
      [Direction.DOWN]: 'down',
      [Direction.UP]: 'up',
      [Direction.LEFT]: 'left',
      [Direction.RIGHT]: 'right',
    } as const
  )[ch.dir];
  const seq = names[name as keyof typeof names][di];
  return decode(seq[frame % seq.length]);
}
