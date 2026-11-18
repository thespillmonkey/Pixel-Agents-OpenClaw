import assert from 'node:assert/strict';

import { test, vi } from 'vitest';

import type { Character, FurnitureInstance, SpriteData } from '../src/office/types.js';
import { CharacterState, Direction, TileType } from '../src/office/types.js';
import { getWallInstances, setWallSprites } from '../src/office/wallTiles.js';

vi.mock('../src/office/sprites/spriteCache.js', () => ({
  getCachedSprite: (sprite: SpriteData, zoom: number) => ({
    sprite,
    width: sprite[0].length * zoom,
    height: sprite.length * zoom,
  }),
}));
vi.mock('../src/office/sprites/spriteData.js', () => ({
  getCharacterSprites: () => ({}),
  BUBBLE_HEART_SPRITE: [],
}));
vi.mock('../src/office/engine/characters.js', () => ({
  getCharacterSprite: () => Array.from({ length: 16 }, () => Array(16).fill('agent')),
}));

import { renderScene } from '../src/office/engine/renderer.js';
import { buildDynamicCatalog } from '../src/office/layout/furnitureCatalog.js';
import { layoutToFurnitureInstances } from '../src/office/layout/layoutSerializer.js';

const solid = (color: string, width = 16, height = 16): SpriteData =>
  Array.from({ length: height }, () => Array(width).fill(color));
const f = (color: string, extra: Partial<FurnitureInstance> = {}): FurnitureInstance => ({
  sprite: solid(color),
  x: 0,
  y: 0,
  zY: 0,
  ...extra,
});

/** Tiny opaque-pixel canvas checks the actual renderer, not a duplicate scalar-sort model. */
function paint(items: FurnitureInstance[], agents: Character[] = []) {
  const calls: string[] = [];
  const pixels = new Map<string, string>();
  const ctx = {
    drawImage(image: { sprite: SpriteData }, x: number, y: number) {
      calls.push(image.sprite[0][0]);
      image.sprite.forEach((row, dy) =>
        row.forEach((color, dx) => {
          if (color) pixels.set(`${x + dx},${y + dy}`, color);
        }),
      );
    },
  } as unknown as CanvasRenderingContext2D;
  renderScene(ctx, items, agents, 0, 0, 1, null, null);
  return { calls, pixels };
}

const agent = {
  id: 1,
  x: 8,
  y: 8,
  state: CharacterState.IDLE,
  dir: Direction.DOWN,
  palette: 0,
  repeat: null,
  blinkShut: 0,
  matrixEffect: null,
} as unknown as Character;

function roomWalls(): FurnitureInstance[] {
  setWallSprites([Array.from({ length: 16 }, () => solid('wall', 16, 32))]);
  return getWallInstances([[TileType.WALL]]);
}

test('actual room-wall instances paint above floor, below owner fixtures and agents', () => {
  const walls = roomWalls();
  assert.equal(walls[0].sceneLayer, 'wall');
  const floor = f('wood-floor', { sceneLayer: 'floor', zY: -3 });
  const fixture = f('bookcase', { sceneLayer: 'background', zY: -2 });
  // Intentionally shuffled input; environment passes determine correct order.
  const alone = paint([fixture, ...walls, floor]);
  assert.deepEqual(alone.calls, ['wood-floor', 'wall', 'bookcase']);
  assert.equal(alone.pixels.get('0,0'), 'bookcase', 'opaque wall cannot hide shelf lower edge');
  const occupied = paint([fixture, ...walls, floor, f('lower-half', { zY: -1 })], [agent]);
  assert.deepEqual(occupied.calls, ['wood-floor', 'wall', 'bookcase', 'lower-half', 'agent']);
  assert.equal(occupied.pixels.get('0,0'), 'agent', 'owner fixture and wall cannot hide an agent');
});

test('unrelated walls retain native foreground occlusion and are never double-painted', () => {
  const wall = roomWalls()[0];
  const fixtureElsewhere = f('clock', { x: 64, sceneLayer: 'background', zY: -2 });
  const result = paint([wall, fixtureElsewhere], [{ ...agent, y: 0 }]);
  assert.deepEqual(result.calls, ['clock', 'agent', 'wall']);
  assert.equal(result.calls.filter((c) => c === 'wall').length, 1);
  assert.equal(result.pixels.get('0,-8'), 'wall');
});

test('touching but nonoverlapping fixture bounds do not suppress native wall depth', () => {
  const wall = roomWalls()[0];
  const result = paint(
    [wall, f('window', { x: 16, sceneLayer: 'background' })],
    [{ ...agent, y: 0 }],
  );
  assert.deepEqual(result.calls, ['window', 'agent', 'wall']);
});

test('external-pack cream wall trim paints before fixtures without reclassifying desktop decor', () => {
  const catalog = [
    {
      id: 'new26-cream-wall-trim',
      label: 'cream-wall-trim',
      category: 'decor',
      width: 64,
      height: 32,
      footprintW: 4,
      footprintH: 1,
      isDesk: false,
      canPlaceOnWalls: true,
      canPlaceOnSurfaces: true,
      backgroundTiles: 1,
      drawOffsetY: -16,
    },
    {
      id: 'new26-bookcase-south',
      label: 'bookcase',
      category: 'storage',
      width: 16,
      height: 16,
      footprintW: 1,
      footprintH: 1,
      isDesk: false,
      drawOffsetY: -16,
    },
    {
      id: 'printer',
      label: 'printer',
      category: 'decor',
      width: 16,
      height: 16,
      footprintW: 1,
      footprintH: 1,
      isDesk: false,
      canPlaceOnSurfaces: true,
      backgroundTiles: 1,
      drawOffsetY: -16,
    },
  ];
  buildDynamicCatalog({
    catalog,
    sprites: {
      'new26-cream-wall-trim': solid('trim', 64, 32),
      'new26-bookcase-south': solid('shelf'),
      printer: solid('printer'),
    },
  });
  const items = layoutToFurnitureInstances([
    { uid: 'trim', type: 'new26-cream-wall-trim', col: 0, row: 1 },
    { uid: 'shelf', type: 'new26-bookcase-south', col: 1, row: 1 },
    { uid: 'printer', type: 'printer', col: 4, row: 1 },
  ]);
  assert.equal(items[0].sceneLayer, 'wall-finish');
  assert.equal(items[2].sceneLayer, undefined, 'ordinary desktop decor keeps surface depth');
  const alone = paint([...roomWalls(), ...items]);
  assert.equal(alone.pixels.get('16,0'), 'shelf');
  const occupied = paint([...roomWalls(), ...items], [{ ...agent, x: 24 }]);
  assert.equal(occupied.pixels.get('16,0'), 'agent');
});

test('native wall in the gap beside a fixture stays below the continuous wall finish', () => {
  const wallInGap = { ...roomWalls()[0], x: 16, zY: 64 };
  const finish = f('cream', {
    sprite: solid('cream', 64, 32),
    y: -16,
    zY: 48,
    sceneLayer: 'wall-finish',
  });
  const fixture = f('shelf', { sprite: solid('shelf', 16, 32), y: -16, sceneLayer: 'background' });
  // Wall and fixture touch at x=16: fixture-only overlap detection misses this gap.
  const result = paint([fixture, wallInGap, finish]);
  assert.deepEqual(result.calls, ['wall', 'cream', 'shelf']);
  assert.equal(result.pixels.get('16,0'), 'cream');
  assert.equal(result.pixels.get('0,0'), 'shelf');
  const occupied = paint([fixture, wallInGap, finish], [{ ...agent, x: 24 }]);
  assert.equal(occupied.pixels.get('16,0'), 'agent');
  assert.equal(occupied.calls.filter((c) => c === 'wall').length, 1);
});
