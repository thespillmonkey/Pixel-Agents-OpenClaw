import data from './breakRoomData.json';
type Rule = {
  layer: 'floor' | 'background' | 'furniture';
  depth: number;
  split: boolean;
  splitRow?: number;
};
export function breakRoomRule(type: string): Rule | null {
  return (data.rules as Record<string, Rule>)[type] ?? null;
}
