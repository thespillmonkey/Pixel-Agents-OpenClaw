import { PNG } from 'pngjs';
import { expect, test } from 'vitest';

import { decodeCharacterPng } from '../../core/src/assets/pngDecoder.js';
import { CHARACTER_SITTING_OFFSET_PX } from '../src/constants.js';
import {
  characterSittingOffset,
  characterSittingOffsetX,
} from '../src/office/characterAlignment.js';
import {
  createCharacter,
  getCharacterSprite,
  updateCharacter,
  updateHelper,
} from '../src/office/engine/characters.js';
import { OfficeState } from '../src/office/engine/officeState.js';
import { spriteBottomHalfTiles } from '../src/office/layout/layoutSerializer.js';
import { getCharacterSprites, setCharacterTemplates } from '../src/office/sprites/spriteData.js';
import { setProviderCapabilities } from '../src/office/toolUtils.js';
import { type Character, CharacterState, Direction } from '../src/office/types.js';

function sheet(width: number, height = 96) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      png.data.set([Math.floor(x / 16), y, x % 16, 255], i);
    }
  return PNG.sync.write(png);
}
for (const width of [880, 896]) {
  test(`exact ${width}: all phases and legacy pixels, mirror and full playback`, () => {
    const ext = decodeCharacterPng(sheet(width));
    const legacy = decodeCharacterPng(sheet(112));
    for (const dir of ['down', 'up', 'right'] as const) {
      expect(ext[dir]).toHaveLength(width / 16);
      expect(ext[dir].slice(0, 7)).toEqual(legacy[dir].slice(0, 7));
      for (let f = 0; f < 48; f++)
        for (let y = 0; y < 32; y++)
          for (let x = 0; x < 16; x++) {
            const row = dir === 'down' ? 0 : dir === 'up' ? 32 : 64;
            expect(ext[dir][f + 7][y][x]).toBe(
              '#' +
                [f + 7, y + row, x]
                  .map((v) => v.toString(16).padStart(2, '0').toUpperCase())
                  .join(''),
            );
          }
    }
    setCharacterTemplates([legacy, ext]);
    setProviderCapabilities({ readingTools: ['Read'], subagentToolNames: [] });
    const sprites = getCharacterSprites(1);
    expect(sprites.standingCasting).toBe(width === 880);
    expect(sprites.walk).toEqual(getCharacterSprites(0).walk);
    expect(sprites.typing[Direction.DOWN]).toHaveLength(width === 880 ? 48 : 2);
    for (let f = 0; f < 48; f++)
      expect(sprites.reading[Direction.LEFT][f]).toEqual(
        sprites.reading[Direction.RIGHT][f].map((row) => [...row].reverse()),
      );
    const ch: Character = {
      ...createCharacter(91, 0, null, null),
      state: CharacterState.TYPE,
      dir: Direction.DOWN,
      palette: 1,
      repeat: 0,
      frame: 0,
      frameTimer: 0,
      isActive: true,
      currentTool: 'Read',

      blinkShut: 0,
    };
    for (let f = 1; f <= 48; f++) {
      updateCharacter(ch, 0.1, [], new Map(), [], new Set());
      expect(ch.frame).toBe(f % 48);
      expect(getCharacterSprite(ch, sprites)).toEqual(ext.down[7 + (f % 48)]);
    }
    ch.frame = 47;
    ch.frameTimer = 0;
    ch.currentTool = 'Bash';
    updateCharacter(ch, 0.1, [], new Map(), [], new Set());
    expect(ch.frame).toBe(width === 880 ? 0 : 1);
    ch.isActive = false;
    ch.seatTimer = 10;
    expect(getCharacterSprite(ch, sprites)).toEqual(ext.down[3]);
  });
}
test('legacy and upstream preserve 2x300ms and seated; malformed extended heights rejected', () => {
  for (const width of [112, 128]) {
    const decoded = decodeCharacterPng(sheet(width));
    expect(decoded.down).toHaveLength(8);
    setCharacterTemplates([decoded]);
    const sprites = getCharacterSprites(0);
    expect(sprites.typing[Direction.DOWN]).toHaveLength(2);
    const ch: Character = {
      ...createCharacter(91, 0, null, null),
      state: CharacterState.TYPE,
      dir: Direction.DOWN,
      palette: 0,
      repeat: 0,
      frame: 0,
      frameTimer: 0,
      isActive: true,
      currentTool: null,

      blinkShut: 0,
    };
    updateCharacter(ch, 0.1, [], new Map(), [], new Set());
    expect(ch.frame).toBe(0);
    updateCharacter(ch, 0.2, [], new Map(), [], new Set());
    expect(ch.frame).toBe(1);
    ch.isActive = false;
    expect(getCharacterSprite(ch, sprites)).toEqual(decoded.down[7]);
  }
  for (const width of [880, 896]) expect(() => decodeCharacterPng(sheet(width, 95))).toThrow();
});

for (const width of [112, 128, 880, 896]) {
  test(`alignment and hit-test boundaries for ${width}`, () => {
    setCharacterTemplates([decodeCharacterPng(sheet(width))]);
    const ch: Character = {
      ...createCharacter(91, 0, null, null),
      id: 91,
      x: 100,
      y: 100,
      state: CharacterState.TYPE,
      palette: 0,
      repeat: 0,
      matrixEffect: null,
    };
    const offset = width === 880 ? 0 : CHARACTER_SITTING_OFFSET_PX;
    expect(characterSittingOffset(ch)).toBe(offset);
    const office = new OfficeState();
    office.characters.clear();
    office.characters.set(ch.id, ch);
    expect(office.getCharacterAt(100, 100 + offset)).toBe(ch.id);
    expect(office.getCharacterAt(100, 100 + offset + 1)).toBeNull();
    ch.state = CharacterState.IDLE;
    expect(characterSittingOffset(ch)).toBe(0);
    expect(office.getCharacterAt(100, 101)).toBeNull();
  });
}

for (const width of [880, 896]) {
  test(`all-direction timing, catch-up, tool switches and helper playback ${width}`, () => {
    setCharacterTemplates([decodeCharacterPng(sheet(width))]);
    setProviderCapabilities({ readingTools: ['Read'], subagentToolNames: [] });
    const sprites = getCharacterSprites(0);
    for (const dir of [Direction.DOWN, Direction.UP, Direction.RIGHT, Direction.LEFT]) {
      const ch: Character = {
        ...createCharacter(91, 0, null, null),
        state: CharacterState.TYPE,
        dir,
        palette: 0,
        repeat: 0,
        frame: 0,
        frameTimer: 0,
        isActive: true,
        currentTool: 'Read',
        blinkShut: 0,
        helperIdleSec: 0,
        isSubagent: true,
        tileCol: 0,
        tileRow: 0,
        path: [],
      };
      updateCharacter(ch, 0.099, [], new Map(), [], new Set());
      expect(ch.frame).toBe(0);
      updateCharacter(ch, 0.001, [], new Map(), [], new Set());
      expect(ch.frame).toBe(1);
      for (let f = 2; f <= 48; f++) {
        updateCharacter(ch, 0.1, [], new Map(), [], new Set());
        expect(ch.frame).toBe(f % 48);
        expect(getCharacterSprite(ch, sprites)).toEqual(sprites.reading[dir][f % 48]);
      }
      ch.frame = 47;
      ch.frameTimer = 0;
      ch.currentTool = 'Bash';
      expect(getCharacterSprite(ch, sprites)).toEqual(
        sprites.typing[dir][47 % sprites.typing[dir].length],
      );
      updateCharacter(ch, width === 880 ? 0.1 : 0.3, [], new Map(), [], new Set());
      expect(ch.frame).toBe(0);
      ch.currentTool = 'Read';
      ch.frame = 0;
      ch.frameTimer = 0;
      updateCharacter(ch, 0.45, [], new Map(), [], new Set());
      expect(ch.frame).toBe(4);
      expect(ch.frameTimer).toBeCloseTo(0.05);
      ch.frame = 0;
      ch.frameTimer = 0;
      for (let f = 1; f <= 48; f++) {
        updateHelper(ch, 0.1, null, dir, () => null, [], new Set());
        expect(ch.frame).toBe(f % 48);
        expect(getCharacterSprite(ch, sprites)).toEqual(sprites.reading[dir][f % 48]);
      }
    }
  });
}

for (const width of [112, 128, 880, 896]) {
  test(`compact seated anchor preserves navigation and other seats ${width}`, () => {
    setCharacterTemplates([decodeCharacterPng(sheet(width))]);
    const ch: Character = {
      ...createCharacter(91, 0, null, null),
      x: 136,
      y: 88,
      seatId: 'f-1784917100003-z4q4',
      state: CharacterState.TYPE,
      matrixEffect: null,
    };
    expect(characterSittingOffsetX(ch)).toBe(width === 880 ? 0 : -8);
    const office = new OfficeState();
    office.characters.clear();
    office.characters.set(ch.id, ch);
    const anchorX = ch.x + characterSittingOffsetX(ch);
    expect(office.getCharacterAt(anchorX, ch.y + characterSittingOffset(ch))).toBe(ch.id);
    expect(ch.x).toBe(136);
    ch.state = CharacterState.WALK;
    expect(characterSittingOffsetX(ch)).toBe(0);
    ch.state = CharacterState.IDLE;
    expect(characterSittingOffsetX(ch)).toBe(0);
    ch.state = CharacterState.TYPE;
    ch.seatId = 'unrelated';
    expect(characterSittingOffsetX(ch)).toBe(0);
  });
}

test('bottom-half solidity math (owner request 1570523531429810269)', () => {
  expect(
    spriteBottomHalfTiles(5, 6, 96, 48, 0, -12).every(
      (t) => t.row >= 6 && t.row <= 8 && t.col >= 5 && t.col <= 10,
    ),
  ).toBe(true);
  const book = spriteBottomHalfTiles(2, 3, 48, 40, 0, -33);
  expect(book.some((t) => t.col === 2 && t.row === 2)).toBe(true);
  expect(book.every((t) => t.row >= 2 && t.row <= 3)).toBe(true);
  expect(spriteBottomHalfTiles(4, 4, 0, 16, 0, 0)).toEqual([]);
  expect(spriteBottomHalfTiles(0, 0, 8, 8, 0, 0).length).toBeGreaterThanOrEqual(1);
});
