/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import type { LoadedAssetData } from '../../src/office/layout/furnitureCatalog.js';
import type { OfficeLayout } from '../../src/office/types.js';

// Synthetic geometric stand-ins: no production snapshot, configuration or furniture art.
// Dimensions/placements deliberately exercise each interaction orientation and visual offset.
const devices = [
  ['break28-counter', 39, 20, 75, 28, 7, 12],
  ['break28-coffee-maker', 43, 20, 10, 14, 0, 10],
  ['break28-pinball-space', 49, 20, 18, 44, 12, 10],
  ['break28-pinball-dragon', 51, 20, 18, 44, 14, 10],
  ['break28-arcade', 53, 20, 18, 42, 15, 11],
  ['break28-dartboard', 48, 19, 14, 24, 3, 14],
  ['break28-claw', 53, 27, 31, 46, 8, 2],
  ['break28-hockey', 49, 32, 55, 38, 14, 12],
  ['break28-foosball', 49, 26, 44, 60, 4, 11],
] as const;
const catalog: LoadedAssetData['catalog'] = devices.map(
  ([id, , , width, height, drawOffsetX, drawOffsetY]) => ({
    id,
    label: id,
    category: 'misc',
    width,
    height,
    drawOffsetX,
    drawOffsetY,
    footprintW: 1,
    footprintH: 1,
    isDesk: false,
    backgroundTiles: 1,
  }),
);
catalog.push({
  id: 'test-seat',
  label: 'Test seat',
  category: 'chairs',
  width: 16,
  height: 16,
  footprintW: 1,
  footprintH: 1,
  isDesk: false,
  orientation: 'front',
  backgroundTiles: 0,
});
export const playAssets: LoadedAssetData = {
  catalog,
  sprites: Object.fromEntries(
    catalog.map((e) => [
      e.id,
      Array.from({ length: e.height }, () => Array(e.width).fill('#445566')),
    ]),
  ),
};
export const playLayout: OfficeLayout = {
  version: 1,
  cols: 60,
  rows: 40,
  tiles: Array.from({ length: 2400 }, (_, i) =>
    i % 60 === 0 || i % 60 === 59 || i < 60 || i >= 2340 ? 0 : 1,
  ),
  tileColors: Array(2400).fill(null),
  furniture: [
    ...devices.map(([type, col, row]) => ({ uid: type, type, col, row })),
    { uid: 'break28-seat-dining-north', type: 'test-seat', col: 41, row: 26 },
  ],
};
