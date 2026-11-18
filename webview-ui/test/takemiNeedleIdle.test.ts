/* eslint-disable pixel-agents/no-inline-colors -- Native sprite palette/fixture pixels, not UI theme colors. */
import { expect, it } from 'vitest';

import data from '../src/office/clinicData.json';
import {
  clinicBounds,
  clinicDepth,
  clinicIdentity,
  clinicOffset,
  clinicSeat,
  clinicSprite,
  clinicStationType,
  setClinicClock,
} from '../src/office/clinicRuntime';
import { setProviderCapabilities } from '../src/office/toolUtils';
import type { Character } from '../src/office/types';
setProviderCapabilities({ readingTools: ['Read'], subagentToolNames: [] });
const decode = (d: typeof data, id: number) =>
  d.frames[id].map((row) => Array.from(row, (c) => d.palette[c.charCodeAt(0) - 256]));
const agent = (extra = {}) =>
  ({
    directoryName: 'takemi',
    isActive: true,
    state: 'type',
    seatId: data.seat,
    tileCol: data.col,
    tileRow: data.row,
    x: 824,
    y: 152,
    dir: 0,
    frame: 0,
    currentTool: 'Bash',
    ...extra,
  }) as Character;
it('assigns the raised syringe sequence to working, not idle, with stable upper body origin', () => {
  expect(data.characters.down.work).toHaveLength(24);
  const seen = new Set();
  for (let i = 0; i < 24; i++) {
    setClinicClock(i * 0.15);
    const ch = agent(),
      im = clinicSprite(ch)!,
      off = clinicOffset(ch)!;
    expect([im[0].length, im.length]).toEqual([24, 44]);
    expect(ch.x + off.x - im[0].length / 2 + 4).toBe(817);
    expect(ch.y + off.y - im.length + 8).toBe(122);
    seen.add(JSON.stringify(im));
    expect(clinicDepth(ch)).toBe(158.1);
  }
  expect(seen.size).toBe(3);
});
it('preserves clipboard reading and needle-free normal rest, standing idle and walking', () => {
  setClinicClock(0.3);
  expect(clinicSprite(agent({ currentTool: 'Read' }))).toEqual(
    decode(data, data.characters.down.reading[2]),
  );
  expect(clinicSprite(agent({ isActive: false }))).toEqual(
    decode(data, data.characters.down.seated[2]),
  );
  expect(clinicSprite(agent({ isActive: false, state: 'walk' }))).toEqual(
    decode(data, data.characters.down.walking[2]),
  );
  expect(clinicSprite(agent({ isActive: false, state: 'idle' }))).toEqual(
    decode(data, data.characters.down.idle[2]),
  );
  expect(clinicOffset(agent({ isActive: false, state: 'idle' }))).toEqual({ x: 0, y: 0 });
  expect(clinicBounds(agent({ state: 'walk' }))).toBe(null);
});
it('preserves the one-row extended seated skirt hem in work, reading and rest', () => {
  const selected = new Set(
    (['work', 'reading', 'seated'] as const).flatMap((n) => data.characters.down[n]),
  );
  for (const id of selected) {
    const im = decode(data, id as number);
    for (let x = 9; x <= 13; x++) expect(im[34][x]).toBe(x === 13 ? '#172925' : '#203633');
  }
});
it('keeps separate calves and clickable syringe, normal chair and monitor states', () => {
  const im = clinicSprite(agent())!;
  expect(im[41][13]).toBe('');
  expect(im[41][14]).not.toBe('');
  expect(clinicBounds(agent())!.left).toBeLessThan(817);
  expect(clinicStationType('clinic27-monitor', new Set(), true)).toBe('clinic27-monitor-off');
  expect(clinicStationType('clinic27-takemi-chair-front', new Set(), true)).toBe(
    'clinic27-takemi-chair-front',
  );
});

it('recognizes the exact live Doctor Tae Takemi identity without claiming arbitrary doctors', () => {
  expect(clinicIdentity({ directoryName: 'doctor', agentName: 'Doctor Tae Takemi' })).toBe(true);
  expect(clinicSeat({ directoryName: 'doctor', agentName: 'Doctor Tae Takemi' })).toBe(data.seat);
  expect(clinicIdentity({ directoryName: 'doctor', agentName: 'Other Doctor' })).toBe(false);
  expect(clinicIdentity({ agentName: 'Doctor Tae Takemi', isSubagent: true })).toBe(false);
});
