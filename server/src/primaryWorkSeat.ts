import { appearanceName } from './agentAppearance.js';
import { readConfig } from './configPersistence.js';
import type { AgentState } from './types.js';

/** A named primary work location outlives numeric feed IDs and browser snapshots. */
export function primaryWorkSeat(agent: AgentState): string | undefined {
  if (agent.openClawSubagent || agent.leadAgentId !== undefined) return undefined;
  const seats = readConfig().primaryWorkSeats ?? {};
  const name = appearanceName(agent);
  return Object.hasOwn(seats, name) ? seats[name] : undefined;
}
