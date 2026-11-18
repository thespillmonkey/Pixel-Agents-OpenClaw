import assert from 'node:assert/strict';

import { beforeAll, test } from 'vitest';

import { restoreAgent } from '../src/office/engine/existingAgents.js';
import { OfficeState } from '../src/office/engine/officeState.js';
import { buildDynamicCatalog } from '../src/office/layout/furnitureCatalog.js';
import { type OfficeLayout, TileType } from '../src/office/types.js';
beforeAll(() => {
  buildDynamicCatalog({
    catalog: [
      {
        id: 'CHAIR',
        label: 'chair',
        category: 'chairs',
        width: 16,
        height: 16,
        footprintW: 1,
        footprintH: 1,
        isDesk: false,
        orientation: 'front',
      },
    ],
    sprites: { CHAIR: [['c']] },
  });
});
function layout(): OfficeLayout {
  return {
    version: 1,
    cols: 8,
    rows: 6,
    tiles: Array(48).fill(TileType.FLOOR_1),
    furniture: [
      { uid: 'downstairs', type: 'CHAIR', col: 1, row: 4 },
      { uid: 'primary', type: 'CHAIR', col: 4, row: 1 },
    ],
  };
}
for (const id of [88, 1])
  test('buffered snapshot wins over provisional seat after layout load id ' + id, () => {
    const l = layout(),
      os = new OfficeState({ ...l, furniture: [] });
    os.addAgent(id, 0, 0, 'primary', true); // agentCreated before seats exist
    os.rebuildFromLayout(l);
    os.reassignSeat(id, 'downstairs');
    assert.equal(os.characters.get(id)?.seatId, 'downstairs');
    restoreAgent(os, { id, palette: 0, repeat: 0, seatId: 'primary' });
    assert.equal(os.characters.get(id)?.seatId, 'primary');
    os.rebuildFromLayout(l);
    os.syncAgent(id, 0, 0, 'primary');
    assert.equal(os.characters.get(id)?.seatId, 'primary');
    assert.equal(os.seats.get('downstairs')?.assigned, false);
  });
test('buffered restore does not steal an unrelated occupied primary', () => {
  const os = new OfficeState(layout());
  os.addAgent(2, 0, 0, 'primary', true);
  os.addAgent(88, 0, 0, 'downstairs', true);
  restoreAgent(os, { id: 88, seatId: 'primary' });
  assert.equal(os.characters.get(2)?.seatId, 'primary');
  assert.equal(os.characters.get(88)?.seatId, 'downstairs');
});
