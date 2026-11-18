import { beforeEach, describe, expect, it } from 'vitest';

import data from '../src/office/serviceData.json';
import {
  serviceCharacterDepth,
  serviceFurnitureRule,
  serviceFurnitureType,
  serviceIdentity,
  serviceOffset,
  serviceSeat,
  serviceSprite,
  setServiceClock,
} from '../src/office/serviceRuntime.js';
import { setProviderCapabilities } from '../src/office/toolUtils.js';
import { type Character, CharacterState } from '../src/office/types.js';
function actor(name: keyof typeof data.spots): Character {
  const s = data.spots[name];
  return {
    directoryName: name,
    isActive: true,
    state: CharacterState.TYPE,
    matrixEffect: null,
    seatId: s.seat,
    tileCol: s.col,
    tileRow: s.row,
    x: s.col * 16 + 8,
    y: s.row * 16 + 8,
    dir: s.facing,
    currentTool: null,
    frame: 0,
  } as Character;
}
describe('Mail Farm Security scoped runtime', () => {
  beforeEach(() => setProviderCapabilities({ readingTools: ['Read'], subagentToolNames: [] }));
  it('owns only named main agents, never helpers or existing room owners', () => {
    for (const n of ['pepe', 'Pepe Silvia', 'patches', 'Foggy Wilkins'])
      expect(serviceSeat({ directoryName: n })).toMatch(/^trio26-seat-/);
    for (const n of ['mitsuki', 'mektharion', 'codelia', 'gitbert'])
      expect(serviceIdentity({ directoryName: n })).toBeNull();
    expect(serviceSeat({ directoryName: 'patches', isSubagent: true })).toBeNull();
  });
  it('anchors padded actions to the same native feet across every phase', () => {
    for (const n of ['pepe', 'patches', 'foggy'] as const) {
      const ch = actor(n);
      for (let t = 0; t < 120000; t += 50) {
        setServiceClock(t / 1000);
        const im = serviceSprite(ch)!,
          o = serviceOffset(ch)!,
          s = data.spots[n];
        expect(ch.x + o.x - im[0].length / 2 + s.anchor[0]).toBe(
          s.feet[0] + (n === 'patches' ? -5 : 0),
        );
        expect(ch.y + o.y - im.length + s.anchor[1]).toBe(
          s.feet[1] + (n === 'patches' ? -3 : n === 'foggy' ? -6 : 0),
        );
      }
    }
  });
  it('Pepe reading uses exact same work sequence; Patches retains his separate reading', () => {
    const p = actor('pepe'),
      f = actor('patches');
    for (let t = 0; t < 4000; t += 50) {
      setServiceClock(t / 1000);
      p.currentTool = null;
      const a = serviceSprite(p);
      p.currentTool = 'Read';
      expect(serviceSprite(p)).toBe(a);
    }
    f.currentTool = 'Read';
    expect(serviceSprite(f)![0].length).toBe(16);
  });
  it('does not work at a stale chair or while walking', () => {
    const p = actor('pepe');
    p.seatId = 'old-blue-chair';
    expect(serviceOffset(p)).toBeNull();
    expect(serviceSprite(p)![0].length).toBe(16);
  });
  it('camera boundaries and hoe gate preserve independent cadences', () => {
    const lit = new Set([data.spots.patches.seat]);
    expect(serviceFurnitureType('trio26-monitors', 9.999, lit)).toBe('trio26-monitors-scene-0');
    expect(serviceFurnitureType('trio26-monitors', 10, lit)).toBe('trio26-monitors-scene-1');
    expect(serviceFurnitureType('trio26-monitors', 40, lit)).toBe('trio26-monitors-scene-0');
    expect(serviceFurnitureType('trio26-hoe', 0, lit)).toBe('trio26-hoe-00');
    expect(serviceFurnitureType('trio26-hoe', 0, new Set())).toBe('trio26-hoe');
    expect(serviceFurnitureType('trio26-hoe', 0, new Set([...lit, 'trio26-patches-reading']))).toBe(
      'trio26-hoe',
    );
  });
});

it('Foggy reading and working share the raised seated anchor; walking is unshifted', () => {
  const ch = actor('foggy');
  for (const tool of [null, 'Read']) {
    ch.currentTool = tool;
    setServiceClock(0);
    const off = serviceOffset(ch)!;
    expect(ch.x + off.x).toBe(data.spots.foggy.feet[0]);
    expect(ch.y + off.y).toBe(data.spots.foggy.feet[1] - 6);
    expect(serviceCharacterDepth(ch)).toBe(425.5);
  }
  ch.state = CharacterState.WALK;
  expect(serviceOffset(ch)).toBeNull();
  expect(serviceCharacterDepth(ch)).toBeNull();
  expect(serviceFurnitureRule('trio26-chair-art')!.depth).toBe(138);
});

it('Foggy sleep is a4second16phase loop; reading and walking retain original small sprites', () => {
  const ch = actor('foggy'),
    seen = new Set();
  for (let i = 0; i < 16; i++) {
    setServiceClock(i * 0.25);
    const im = serviceSprite(ch)!;
    expect(im.length).toBe(64);
    expect(im[0].length).toBe(48);
    seen.add(JSON.stringify(im));
  }
  expect(seen.size).toBe(16);
  setServiceClock(0);
  const first = serviceSprite(ch);
  setServiceClock(4);
  expect(serviceSprite(ch)).toBe(first);
  ch.currentTool = 'Read';
  expect(serviceSprite(ch)![0].length).toBe(16);
  ch.state = CharacterState.WALK;
  expect(serviceSprite(ch)![0].length).toBe(16);
});
