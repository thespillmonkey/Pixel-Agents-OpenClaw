// Gary1572347819988353135: authored corridor finish. Collision stays in the layout grid.
export function hallwayRule(type: string): { layer: 'floor'; depth: number; split: false } | null {
  return type === 'hall29-office-corridor' ? { layer: 'floor', depth: -3, split: false } : null;
}
