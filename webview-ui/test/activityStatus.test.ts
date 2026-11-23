import { expect, it } from 'vitest';

import { effectiveAgentStatus } from '../src/office/activityStatus';
import { playEligible } from '../src/office/engine/idlePlay';
import type { Character } from '../src/office/types';

it('lets all six named Code Monkeys default idle without changing live active or user waits', () => {
  for (const name of ['Codelia', 'Javathan', 'Gitbert', 'Bashley', 'Bugatha', 'Vectoria']) {
    for (const identity of [{ directoryName: name.toLowerCase() }, { agentName: name }]) {
      expect(effectiveAgentStatus('unknown', identity)).toBe('idle');
      for (const status of ['active', 'idle', 'waiting'])
        expect(effectiveAgentStatus(status, identity)).toBe(status);
      const ch = {
        ...identity,
        isActive: false,
        activityUnknown: effectiveAgentStatus('unknown', identity) === 'unknown',
      } as Character;
      expect(playEligible(ch)).toBe(true);
      ch.isActive = true;
      expect(playEligible(ch)).toBe(false);
    }
  }
});

it('preserves unknown activity for other identities, helpers and team followers', () => {
  for (const identity of [
    { agentName: 'Patches' },
    { directoryName: 'rebooto' },
    {},
    { directoryName: 'codelia', isSubagent: true },
    { directoryName: 'codelia', leadAgentId: 1 },
    { directoryName: 'codelia', parentAgentId: 1 },
  ]) {
    expect(effectiveAgentStatus('unknown', identity)).toBe('unknown');
  }
});
