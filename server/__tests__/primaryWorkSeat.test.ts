import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { agentCreatedMessage } from '../src/agentMessages.js';
import { createAgentState } from '../src/agentState.js';
import { AgentStateStore } from '../src/agentStateStore.js';
import { handleClientMessage } from '../src/clientMessageHandler.js';
import { parsePrimaryWorkSeats, readConfig, writeConfig } from '../src/configPersistence.js';
import { FileStateAdapter } from '../src/fileStateAdapter.js';
const target = 'f-1784917100003-z4q4';
let oldHome: string | undefined, home: string, store: AgentStateStore;
beforeEach(() => {
  oldHome = process.env.HOME;
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'primary-seat-'));
  process.env.HOME = home;
  store = new AgentStateStore();
  store.setAdapter(new FileStateAdapter({ namespace: 'standalone' }));
  const config = readConfig();
  config.primaryWorkSeats = { 'Mitsuki Takasawa': target };
  writeConfig(config);
});
afterEach(() => {
  store.dispose();
  if (oldHome === undefined) delete process.env.HOME;
  else process.env.HOME = oldHome;
  fs.rmSync(home, { recursive: true, force: true });
});
function agent(id: number, name = 'Mitsuki Takasawa') {
  return Object.assign(
    createAgentState({
      id,
      sessionId: 'new-session-' + id,
      projectDir: '/test',
      jsonlFile: '/test/test.jsonl',
      isExternal: true,
    }),
    { agentName: name, palette: 7, repeat: 0 },
  );
}
it('binds creation and fresh reconnects to name across numeric feed changes, preserving appearance and other agents', () => {
  for (const id of [1, 88]) {
    store.set(id, agent(id));
    expect(agentCreatedMessage(id, store.get(id)!).seatId).toBe(target);
    const sent: Record<string, unknown>[] = [];
    handleClientMessage({ type: 'webviewReady' }, (m) => sent.push(m), {
      store,
      cache: null,
      privileged: true,
    });
    expect(
      (sent.find((m) => m.type === 'existingAgents')!.agentMeta as Record<number, unknown>)[id],
    ).toMatchObject({ seatId: target, palette: 7, repeat: 0 });
    store.delete(id);
  }
  const other = agent(9, 'Other');
  other.seatId = 'other-seat';
  expect(agentCreatedMessage(9, other).seatId).toBe('other-seat');
});
it('stale browser saves cannot overwrite the durable primary seat; unrelated seats and appearance remain unchanged after disk reload', () => {
  store.set(88, agent(88));
  store.set(9, agent(9, 'Other'));
  handleClientMessage(
    {
      type: 'saveAgentSeats',
      seats: {
        88: { seatId: 'old-downstairs', palette: 1 },
        9: { seatId: 'other-seat', palette: 2 },
      },
    },
    () => {},
    { store, cache: null, privileged: true },
  );
  const adapter = new FileStateAdapter({ namespace: 'standalone' });
  expect(adapter.loadSeats()['88'].seatId).toBe(target);
  expect(adapter.loadSeats()['9']).toEqual({ seatId: 'other-seat', palette: 2 });
  expect(store.get(88)?.palette).toBe(7);
  expect(readConfig().primaryWorkSeats).toEqual({ 'Mitsuki Takasawa': target });
});
it('does not assign subagents and rejects malformed persistent input', () => {
  const a = agent(5);
  a.openClawSubagent = true;
  expect(agentCreatedMessage(5, a).seatId).toBeUndefined();
  expect(parsePrimaryWorkSeats({ ok: target, bad: '../../secret', '': 'seat' })).toEqual({
    ok: target,
  });
});
