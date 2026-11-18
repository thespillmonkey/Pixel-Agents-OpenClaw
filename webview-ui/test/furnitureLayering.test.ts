import assert from 'node:assert/strict';

import { beforeEach, test } from 'vitest';

import type { LoadedAssetData } from '../src/office/layout/furnitureCatalog.js';
import { buildDynamicCatalog } from '../src/office/layout/furnitureCatalog.js';
import {
  getBlockedTiles,
  layoutToFurnitureInstances,
} from '../src/office/layout/layoutSerializer.js';
import type { PlacedFurniture, SpriteData } from '../src/office/types.js';

const art: SpriteData = Array.from({ length: 32 }, (_, y) => Array(24).fill(`row${y}`));
const entry = (
  id: string,
  extra: Partial<LoadedAssetData['catalog'][number]> = {},
): LoadedAssetData['catalog'][number] => ({
  id,
  label: id,
  category: 'storage',
  width: 24,
  height: 32,
  footprintW: 1,
  footprintH: 1,
  isDesk: false,
  drawOffsetX: -4,
  drawOffsetY: -16,
  ...extra,
});
const placed = (type: string): PlacedFurniture => ({ uid: type, type, col: 4, row: 5 });

beforeEach(() => {
  const catalog = [
    entry('cabinet'),
    entry('desk', { isDesk: true }),
    entry('printer', { canPlaceOnSurfaces: true, backgroundTiles: 1 }),
    entry('new26-executive-chair-south', { category: 'chairs', orientation: 'front' }),
    entry('blue-chair', { category: 'chairs', orientation: 'back' }),
    entry('wall', { canPlaceOnWalls: true }),
    entry('rug', { renderLayer: 'floor', backgroundTiles: 1 }),
    entry('new26-wall-clock'),
    entry('new26-curtained-window'),
    entry('new26-bookcase-south'),
    ...['BOOKSHELF', 'CLOCK', 'DOUBLE_BOOKSHELF', 'bookshelf-1', 'bookshelf-9', 'clock'].map((id) =>
      entry(id),
    ),
  ];
  assert.ok(
    buildDynamicCatalog({ catalog, sprites: Object.fromEntries(catalog.map((e) => [e.id, art])) }),
  );
});

test('offset furniture lower half stays behind agents, upper half sorts at actual art bottom', () => {
  const [lower, upper] = layoutToFurnitureInstances([placed('cabinet')]);
  assert.equal(lower.x, 60);
  assert.equal(lower.y, 80);
  assert.deepEqual(lower.sprite, art.slice(16));
  assert.equal(lower.zY, -1);
  assert.equal(upper.y, 64);
  assert.deepEqual(upper.sprite, art.slice(0, 16));
  assert.equal(upper.zY, 96, 'depth includes the -16 artwork offset, not the anchor bottom 112');
  // Equivalent to renderer depth ordering for a character behind / in front of the art.
  const order = (agentZY: number) =>
    [
      { id: 'base', z: lower.zY },
      { id: 'top', z: upper.zY },
      { id: 'agent', z: agentZY },
    ]
      .sort((a, b) => a.z - b.z)
      .map((o) => o.id);
  assert.deepEqual(order(80), ['base', 'agent', 'top']);
  assert.deepEqual(order(104), ['base', 'top', 'agent']);
});

test('clock, window and bookcase stay wholly behind agents, even without wall metadata', () => {
  for (const id of [
    'new26-wall-clock',
    'new26-curtained-window',
    'new26-bookcase-south',
    'BOOKSHELF',
    'CLOCK',
    'DOUBLE_BOOKSHELF',
    'bookshelf-1',
    'bookshelf-9',
    'clock',
  ]) {
    const result = layoutToFurnitureInstances([placed(id)]);
    assert.equal(result.length, 1);
    assert.equal(result[0].zY, -2);
    assert.equal(result[0].sceneLayer, 'background');
    assert.equal(result[0].sprite, art);
  }
});

test('executive and blue chair depth and whole sprites retain the established seating behavior', () => {
  const [front, back] = layoutToFurnitureInstances([
    placed('new26-executive-chair-south'),
    placed('blue-chair'),
  ]);
  assert.equal(front.sprite, art);
  assert.equal(front.zY, 96);
  assert.equal(back.sprite, art);
  assert.equal(back.zY, 97);
});

test('surface printer stays whole above the offset desk top (not hidden by a base-only pass)', () => {
  const [base, top, printer] = layoutToFurnitureInstances([placed('desk'), placed('printer')]);
  assert.equal(base.zY, -1);
  assert.equal(top.zY, 96);
  assert.equal(printer.sprite, art);
  assert.equal(printer.zY, 96.5);
});

test('wall items are not sliced and floor items remain background', () => {
  const [wall, rug] = layoutToFurnitureInstances([placed('wall'), placed('rug')]);
  assert.equal(wall.sprite, art);
  assert.equal(wall.zY, 96);
  assert.equal(rug.sprite, art);
  assert.equal(rug.zY, -3);
  assert.equal(rug.sceneLayer, 'floor');
  const [base] = layoutToFurnitureInstances([placed('cabinet')]);
  const [bookcase] = layoutToFurnitureInstances([placed('BOOKSHELF')]);
  // At overlapping pixel coordinates the opaque floor must not hide a shelf's lower edge.
  assert.deepEqual(
    [
      { id: 'base', z: base.zY },
      { id: 'agent', z: 104 },
      { id: 'bookcase', z: bookcase.zY },
      { id: 'floor', z: rug.zY },
    ]
      .sort((a, b) => a.z - b.z)
      .map((o) => o.id),
    ['floor', 'bookcase', 'base', 'agent'],
  );
});

test('render splitting does not change lower-half solid collision or exclusions', () => {
  const furniture = [placed('cabinet')];
  assert.deepEqual([...getBlockedTiles(furniture)].sort(), ['3,5', '4,5', '5,5']);
  layoutToFurnitureInstances(furniture);
  assert.deepEqual([...getBlockedTiles(furniture)].sort(), ['3,5', '4,5', '5,5']);
  assert.deepEqual([...getBlockedTiles(furniture, new Set(['4,5']))].sort(), ['3,5', '5,5']);
});
