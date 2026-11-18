// Gary1571054889038118923: scoped library behavior. Other rooms retain existing rules.
export const LIBRARY_WORK_SEAT = 'lib26-casting-spot';
const timing: Record<string, { phase: number; frameMs: number; count: number }> = {
  'lib26-alembic': { phase: 3, frameMs: 250, count: 16 },
  'lib26-candle-west-north': { phase: 0, frameMs: 250, count: 16 },
  'lib26-amber-vial': { phase: 7, frameMs: 250, count: 16 },
  'lib26-candle-west-south': { phase: 4, frameMs: 250, count: 16 },
  'lib26-candle-east-north': { phase: 8, frameMs: 250, count: 16 },
  'lib26-candle-east-south': { phase: 12, frameMs: 250, count: 16 },
  'lib26-torch-north-west': { phase: 2, frameMs: 250, count: 16 },
  'lib26-torch-north-east': { phase: 6, frameMs: 250, count: 16 },
  'lib26-torch-west': { phase: 10, frameMs: 250, count: 16 },
  'lib26-torch-east': { phase: 14, frameMs: 250, count: 16 },
};
export function libraryAnimationType(type: string, elapsedSec: number, ledgerLit: boolean): string {
  if (type === 'lib26-ledger')
    return ledgerLit ? 'lib26-ledger-on-' + (Math.floor((elapsedSec + 1e-9) / 0.2) % 20) : type;
  if (type === 'lib26-sigil') {
    const slot = Math.floor((elapsedSec + 1e-9) / 0.25) % 160;
    return [56, 57, 58, 132, 133, 134].includes(slot) ? 'lib26-sigil-' + slot : type;
  }
  const base = type.replace(/-00$/, '');
  const t = timing[base];
  return t
    ? base +
        '-' +
        String((Math.floor((elapsedSec * 1000 + 1e-6) / t.frameMs) + t.phase) % t.count).padStart(
          2,
          '0',
        )
    : type;
}
export function libraryRenderLayer(
  type: string,
): 'floor' | 'background' | 'foreground' | 'ledger' | null {
  if (!type.startsWith('lib26-')) return null;
  if (type.startsWith('lib26-floor-') || type.startsWith('lib26-sigil')) return 'floor';
  if (type.startsWith('lib26-ledger')) return 'ledger';
  if (/^lib26-(north-wall|south-wall|wall-|banner-|bookcase-)/.test(type)) return 'background';
  return 'foreground';
}

/** Stable owner identity, not a transient feed id or appearance palette. Helpers are not the owner. */
export function usesLedgerWorkspot(ch: {
  directoryName?: string;
  agentName?: string;
  isSubagent?: boolean;
  leadAgentId?: number;
  parentAgentId?: number | null;
}): boolean {
  if (ch.isSubagent || ch.leadAgentId !== undefined || ch.parentAgentId != null) return false;
  return [ch.directoryName, ch.agentName].some(
    (n) =>
      n !== undefined &&
      ['mektharion', 'high archivist mektharion'].includes(n.trim().toLowerCase()),
  );
}

export const MITSUKI_WORK_SEAT = 'f-1784917100003-z4q4';
export function usesMitsukiWorkspot(ch: {
  directoryName?: string;
  agentName?: string;
  isSubagent?: boolean;
  leadAgentId?: number;
  parentAgentId?: number | null;
}): boolean {
  if (ch.isSubagent || ch.leadAgentId !== undefined || ch.parentAgentId != null) return false;
  return [ch.directoryName, ch.agentName].some(
    (n) => n !== undefined && ['mitsuki', 'mitsuki takasawa'].includes(n.trim().toLowerCase()),
  );
}

const wallCourseCache = new WeakMap<string[][], { north: string[][]; sprite: string[][] }>();
/** Continuous courses sampled from the approved north masonry, not repeated capped panels. */
export function libraryWallCourses(
  type: string,
  original: string[][],
  north?: string[][],
): string[][] {
  if (!/^lib26-wall-(west|east)$/.test(type) || !north || north.length < 48) return original;
  const cached = wallCourseCache.get(original);
  if (cached?.north === north) return cached.sprite;
  const offset = type.endsWith('east') ? 16 : 0;
  const sprite = original.map((row, y) =>
    row.map((_, x) => north[16 + (y % 32)][(x + offset) % 32]),
  );
  wallCourseCache.set(original, { north, sprite });
  return sprite;
}
