import { describe, expect, it } from 'vitest';

import data from '../src/office/nsiData.json';
import {
  holdRebooto,
  nsiBounds,
  nsiDepth,
  nsiIdentity,
  nsiOffset,
  nsiSeat,
  nsiSprite,
  nsiStationType,
  setNsiClock,
} from '../src/office/nsiRuntime.js';
import { type Character, CharacterState, Direction, type Seat } from '../src/office/types.js';
const character = (name: string) =>
  ({
    directoryName: name,
    state: CharacterState.WALK,
    isActive: false,
    x: 100,
    y: 100,
    tileCol: 6,
    tileRow: 6,
    dir: Direction.LEFT,
    path: [{ col: 8, row: 8 }],
    seatId: null,
    matrixEffect: null,
  }) as Character;
describe('NSI identity and fixed-screen contract', () => {
  it('recognizes names without claiming helpers or unrelated identities', () => {
    expect(nsiIdentity({ agentName: 'Rooty Raccoon' })).toBe('rooty');
    expect(nsiIdentity({ directoryName: 'rooty', isSubagent: true })).toBeNull();
    expect(nsiIdentity({ directoryName: 'Mitsuki' })).toBeNull();
  });
  it('keeps Rebooto fixed both working and inactive, clears locomotion and uses the screen depth', () => {
    const ch = character('rebooto');
    const seats = new Map<string, Seat>();
    for (const active of [false, true, false]) {
      ch.isActive = active;
      ch.x = 12;
      ch.y = 24;
      ch.path = [{ col: 1, row: 1 }];
      expect(holdRebooto(ch, seats)).toBe(true);
      expect([ch.x, ch.y]).toEqual([
        data.spots.rebooto.col * 16 + 8,
        data.spots.rebooto.row * 16 + 8,
      ]);
      expect(ch.path).toEqual([]);
      expect(nsiOffset(ch)).toEqual({ x: -8, y: 0 });
      expect(nsiBounds(ch)).toEqual({
        left: data.spots.rebooto.feet[0] - 8,
        top: data.spots.rebooto.feet[1] - 32,
        right: data.spots.rebooto.feet[0] + 8,
        bottom: data.spots.rebooto.feet[1] - 16,
      });
      expect(nsiDepth(ch)).toBeGreaterThan(208);
    }
    expect(holdRebooto(character('digby'), seats)).toBe(false);
  });
  it('varies Rebooto facial pixels without painting beyond the16x16 socket', () => {
    const ch = character('rebooto');
    ch.isActive = true;
    holdRebooto(ch, new Map());
    const seen = new Set();
    for (let i = 0; i < 16; i++) {
      setNsiClock(i * 0.25);
      const frame = nsiSprite(ch)!;
      expect(frame).toHaveLength(32);
      expect(frame[0]).toHaveLength(16);
      expect(
        frame
          .slice(16)
          .flat()
          .every((p) => p === ''),
      ).toBe(true);
      seen.add(JSON.stringify(frame));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
  it('only lights each laptop at its own occupied workstation', () => {
    const seat = nsiSeat({ directoryName: 'rooty' })!;
    expect(nsiStationType('nsi26-laptop-rooty', new Set([seat]))).toBe('nsi26-laptop-rooty-on');
    expect(nsiStationType('nsi26-laptop-digby', new Set([seat]))).toBe('nsi26-laptop-digby');
    expect(nsiStationType('nsi26-laptop-rooty', new Set())).toBe('nsi26-laptop-rooty');
  });
});
