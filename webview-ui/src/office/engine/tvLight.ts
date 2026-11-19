/* eslint-disable pixel-agents/no-inline-colors -- Authored scene light palette/fixture values, not UI theme colors. */
export const TV_TINTS = [
  [110, 170, 255],
  [255, 140, 140],
  [140, 255, 140],
] as const;
/** Soft screen spill, facing north from the back-facing TV toward its couch.
 * An oblique rhombus/parallelogram, not an opaque spotlight triangle.
 * At most 13% opacity; fades completely before its far edge. */
export function tvLightPolygon(tv: { x: number; y: number; width: number }) {
  const reach = 48,
    skew = -18;
  return [
    { x: tv.x, y: tv.y },
    { x: tv.x + tv.width, y: tv.y },
    { x: tv.x + tv.width + skew, y: tv.y - reach },
    { x: tv.x + skew, y: tv.y - reach },
  ];
}
export function drawTvLight(
  ctx: CanvasRenderingContext2D,
  tv: { x: number; y: number; width: number; tint?: number },
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  const p = tvLightPolygon(tv),
    rgb = TV_TINTS[tv.tint ?? 0].join(',');
  ctx.save();
  const gradient = ctx.createLinearGradient(
    offsetX + tv.x * zoom,
    offsetY + tv.y * zoom,
    offsetX + tv.x * zoom,
    offsetY + (tv.y - 48) * zoom,
  );
  gradient.addColorStop(0, `rgba(${rgb},0.13)`);
  gradient.addColorStop(0.35, `rgba(${rgb},0.085)`);
  gradient.addColorStop(0.75, `rgba(${rgb},0.025)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(offsetX + p[0].x * zoom, offsetY + p[0].y * zoom);
  for (const v of p.slice(1)) ctx.lineTo(offsetX + v.x * zoom, offsetY + v.y * zoom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
