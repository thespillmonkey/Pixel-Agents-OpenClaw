import { jungleIdentity } from './jungleRuntime.js';

/** Code Monkeys are cosmetically idle without a live work signal; bridge data stays untouched. */
export function effectiveAgentStatus(
  status: string,
  character: Parameters<typeof jungleIdentity>[0],
): string {
  return status === 'unknown' && jungleIdentity(character) ? 'idle' : status;
}
