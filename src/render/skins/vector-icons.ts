import type * as Phaser from 'phaser';
import { colorNumber, type IconName } from '../skin';

/** The colours a Skin draws its vector HUD icons in (`#rrggbb`). */
export interface IconStyle {
  heart: string;
  coin: string;
  /** The rim and inner ring of the coin. */
  coinEdge: string;
  flag: string;
  flagPole: string;
  /** Play and retry glyphs. */
  glyph: string;
  upgrade: string;
  fallback: string;
  /** A cartoon outline around every icon, in world units at size 16; none if omitted. */
  outline?: { color: string; width: number };
}

type IconColor = Exclude<keyof IconStyle, 'fallback' | 'outline'>;
type Draw = (
  g: Phaser.GameObjects.Graphics,
  s: number,
  color: (token: IconColor) => number,
) => void;

/** Fills a closed polygon of `[x, y]` pairs given as fractions of `s`. */
function polygon(g: Phaser.GameObjects.Graphics, s: number, points: [number, number][]) {
  g.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? g.moveTo(x * s, y * s) : g.lineTo(x * s, y * s)));
  g.closePath();
  g.fillPath();
}

/** Each icon drawn in a box `s` across, centred on (0, 0). */
const ICONS: Record<IconName, Draw> = {
  heart(g, s, color) {
    g.fillStyle(color('heart'));
    g.fillCircle(-0.22 * s, -0.12 * s, 0.25 * s);
    g.fillCircle(0.22 * s, -0.12 * s, 0.25 * s);
    polygon(g, s, [
      [-0.46, -0.04],
      [0.46, -0.04],
      [0, 0.44],
    ]);
  },
  coin(g, s, color) {
    g.fillStyle(color('coinEdge'));
    g.fillCircle(0, 0, 0.44 * s);
    g.fillStyle(color('coin'));
    g.fillCircle(0, 0, 0.36 * s);
    g.lineStyle(Math.max(1, 0.07 * s), color('coinEdge'));
    g.strokeCircle(0, 0, 0.2 * s);
  },
  flag(g, s, color) {
    g.fillStyle(color('flagPole'));
    g.fillRect(-0.36 * s, -0.44 * s, 0.1 * s, 0.88 * s);
    g.fillStyle(color('flag'));
    polygon(g, s, [
      [-0.26, -0.44],
      [0.42, -0.24],
      [-0.26, -0.04],
    ]);
  },
  play(g, s, color) {
    g.fillStyle(color('glyph'));
    polygon(g, s, [
      [-0.3, -0.4],
      [0.42, 0],
      [-0.3, 0.4],
    ]);
  },
  retry(g, s, color) {
    const r = 0.3 * s;
    const start = -Math.PI / 3;
    g.lineStyle(0.13 * s, color('glyph'));
    g.beginPath();
    g.arc(0, 0, r, start, start + Math.PI * 1.6);
    g.strokePath();
    // Arrowhead at the arc's start, pointing back along it (clockwise).
    const x = Math.cos(start) * r;
    const y = Math.sin(start) * r;
    g.fillStyle(color('glyph'));
    g.fillTriangle(
      x - 0.2 * s,
      y - 0.12 * s,
      x + 0.14 * s,
      y - 0.14 * s,
      x + 0.02 * s,
      y + 0.2 * s,
    );
  },
  upgrade(g, s, color) {
    g.fillStyle(color('upgrade'));
    polygon(g, s, [
      [0, -0.46],
      [0.42, 0],
      [0.16, 0],
      [0.16, 0.44],
      [-0.16, 0.44],
      [-0.16, 0],
      [-0.42, 0],
    ]);
  },
};

const OUTLINE_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-0.7, -0.7],
  [0.7, -0.7],
  [-0.7, 0.7],
  [0.7, 0.7],
] as const;

/** Vector HUD icons for Skins that draw their own: the shapes are shared, the style is the Skin's. */
export function createVectorIcon(
  scene: Phaser.Scene,
  name: IconName,
  size: number,
  style: IconStyle,
): Phaser.GameObjects.Container {
  const draw = ICONS[name] as Draw | undefined;
  const root = scene.add.container(0, 0).setSize(size, size);
  if (!draw) {
    console.error(`No icon "${name}"`);
    const g = scene.add.graphics();
    g.fillStyle(colorNumber(style.fallback));
    g.fillRect(-size / 2, -size / 2, size, size);
    return root.add(g);
  }

  const { outline } = style;
  if (outline) {
    // The same shape in the outline colour, nudged around it.
    const width = (outline.width * size) / 16;
    for (const [dx, dy] of OUTLINE_OFFSETS) {
      const g = scene.add.graphics().setPosition(dx * width, dy * width);
      draw(g, size, () => colorNumber(outline.color));
      root.add(g);
    }
  }
  const g = scene.add.graphics();
  draw(g, size, (token) => colorNumber(style[token]));
  return root.add(g);
}
