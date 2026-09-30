// Shared camera-depth window: hold the distant silhouette until 78 units,
// finish by 36, just before desktop stations start moving aside at 34.
// Scroll position, rather than a timer, keeps the animation reversible.
export const REVEAL_START = 78;
export const REVEAL_END = 36;
export function stationReveal(depth: number): number {
  const t = Math.max(0, Math.min(1, (REVEAL_START - depth) / (REVEAL_START - REVEAL_END)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
