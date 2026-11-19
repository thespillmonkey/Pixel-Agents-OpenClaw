/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import type { LoadedAssetData } from '../../src/office/layout/furnitureCatalog.js';
import type { OfficeLayout } from '../../src/office/types.js';
import { playAssets, playLayout } from './playOffice.js';
// Synthetic flat pixels and floor geometry; no private artwork or saved configuration.
const catalog: LoadedAssetData['catalog'] = [
  {
    id: 'break28-tv',
    label: 'TV',
    category: 'misc',
    width: 70,
    height: 35,
    footprintW: 1,
    footprintH: 1,
    isDesk: false,
    backgroundTiles: 1,
  },
  {
    id: 'break28-sofa',
    label: 'Couch',
    category: 'misc',
    width: 64,
    height: 48,
    footprintW: 4,
    footprintH: 3,
    isDesk: false,
    backgroundTiles: 3,
  },
  {
    id: 'break28-seat-south',
    label: 'Viewer seat',
    category: 'chairs',
    width: 16,
    height: 16,
    footprintW: 1,
    footprintH: 1,
    isDesk: false,
    orientation: 'front',
    backgroundTiles: 0,
  },
];
export const tvAssets: LoadedAssetData = {
  catalog: [...playAssets.catalog, ...catalog],
  sprites: {
    ...playAssets.sprites,
    ...Object.fromEntries(
      catalog.map((e) => [
        e.id,
        Array.from({ length: e.height }, () => Array(e.width).fill('#445566')),
      ]),
    ),
  },
};
export const tvLayout: OfficeLayout = {
  ...playLayout,
  furniture: [
    ...playLayout.furniture,
    { uid: 'break28-tv', type: 'break28-tv', col: 39, row: 35 },
    { uid: 'test-couch', type: 'break28-sofa', col: 39, row: 31 },
    { uid: 'break28-seat-sofa-1', type: 'break28-seat-south', col: 40, row: 32 },
    { uid: 'break28-seat-sofa-2', type: 'break28-seat-south', col: 41, row: 32 },
  ],
};
