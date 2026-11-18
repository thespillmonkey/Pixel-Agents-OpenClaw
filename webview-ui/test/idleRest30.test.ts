import { describe, expect, it } from 'vitest';

import { createCharacter, restInChair, updateCharacter } from '../src/office/engine/characters';
import { CharacterState, Direction, type Seat } from '../src/office/types';
const seat = {
  uid: 'test-seat',
  seatCol: 1,
  seatRow: 1,
  facingDir: Direction.DOWN,
  assigned: true,
} as Seat;
const seats = new Map([['test-seat', seat]]),
  tiles = Array.from({ length: 5 }, () => Array(5).fill(1)),
  walkable = [{ col: 2, row: 1 }];
describe('Thirty-second seated rest', () => {
  it('holds an idle occupant for30seconds, then releases them into wandering', () => {
    const ch = createCharacter(1, 0, 'test-seat', seat);
    ch.isActive = false;
    restInChair(ch);
    expect(ch.seatTimer).toBe(30);
    for (let i = 0; i < 299; i++) updateCharacter(ch, 0.1, walkable, seats, tiles, new Set());
    expect(ch.state).toBe(CharacterState.TYPE);
    for (let i = 0; i < 3; i++) updateCharacter(ch, 0.1, walkable, seats, tiles, new Set());
    expect(ch.state).toBe(CharacterState.IDLE);
    for (let i = 0; i < 202; i++) updateCharacter(ch, 0.1, walkable, seats, tiles, new Set());
    expect(ch.x !== 24 || ch.y !== 24 || ch.path.length > 0).toBe(true);
  });
  it('never forces an active worker out of their seat', () => {
    const ch = createCharacter(2, 0, 'test-seat', seat);
    restInChair(ch);
    for (let i = 0; i < 700; i++) updateCharacter(ch, 0.1, walkable, seats, tiles, new Set());
    expect(ch.state).toBe(CharacterState.TYPE);
    expect(ch.isActive).toBe(true);
  });
  it('always selects exactly30seconds rather than a random multi-minute hold', () => {
    const ch = createCharacter(3, 0, 'test-seat', seat);
    for (let i = 0; i < 50; i++) {
      restInChair(ch);
      expect(ch.seatTimer).toBe(30);
    }
  });
});
