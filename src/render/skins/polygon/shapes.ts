import type * as Phaser from 'phaser';

/** Fills a closed polygon given as `[x, y]` pairs around the graphics' origin. */
export function fillPolygon(
  g: Phaser.GameObjects.Graphics,
  points: readonly (readonly [number, number])[],
  color: number,
  alpha = 1,
): void {
  const [first, ...rest] = points;
  if (!first) return;
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(first[0], first[1]);
  for (const [x, y] of rest) g.lineTo(x, y);
  g.closePath();
  g.fillPath();
}
