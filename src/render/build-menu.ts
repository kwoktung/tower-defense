import * as Phaser from 'phaser';
import { towerStats, type LevelDef } from '../content/schemas';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import { buildPath, slotCenter, type Point } from '../sim/path';
import type { Simulation } from '../sim/simulation';
import { BAR_HEIGHT, createLabel, type UiSkin } from './hud';
import { colorNumber, type Skin, type SkinTheme } from './skin';

/** The open Build menu, as UI state: where it is and which option is previewed or hovered. */
export interface BuildMenuState {
  slotId: string;
  /** Kind whose option was pressed once: its range shows, and a second press builds it. */
  previewKind: string | null;
  /** Kind whose option the pointer is over: its range shows, but a press only previews it. */
  hoverKind: string | null;
}

export interface BuildMenuOption {
  kind: string;
  cost: number;
  affordable: boolean;
  previewing: boolean;
}

/** Everything the Build menu and its range preview show, from one snapshot. */
export interface BuildMenuModel {
  slotId: string;
  /** One per tower kind, in catalog order. */
  options: BuildMenuOption[];
  /** Range of the hovered, else the previewed, kind; null when neither. */
  range: number | null;
}

export function buildMenuModelOf(
  sim: Simulation,
  menu: BuildMenuState | null,
): BuildMenuModel | null {
  if (!menu) return null;
  const shown = menu.hoverKind ?? menu.previewKind;
  return {
    slotId: menu.slotId,
    options: Object.keys(sim.units.towers).map((kind) => ({
      kind,
      cost: towerStats(sim.units, kind, 1)!.cost,
      affordable: sim.canAfford(kind),
      previewing: kind === menu.previewKind,
    })),
    range: shown ? (towerStats(sim.units, shown, 1)?.range ?? null) : null,
  };
}

/** Distance from the Slot's centre to each option's centre. */
const RING_RADIUS = 62;
const OPTION_RADIUS = 25;
/** The cost badge hangs over the bottom of its option. */
const BADGE_Y = OPTION_RADIUS - 2;
const BADGE_HEIGHT = 18;
/** A tower thumbnail shows its tile at this size. */
const THUMB_TILE = 44;
/** Space kept between the menu and the screen edges (and the top bar). */
const MARGIN = 6;

/**
 * Option centres for a menu around `slot`: evenly spaced on a ring, the first at the top, then
 * the whole ring pushed inward so every option and its cost badge stays on screen.
 */
export function buildMenuLayout(slot: Point, count: number): Point[] {
  const points = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (i / count) * Math.PI * 2;
    return { x: slot.x + Math.cos(a) * RING_RADIUS, y: slot.y + Math.sin(a) * RING_RADIUS };
  });
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const shift = (low: number, high: number, min: number, max: number) =>
    low < min ? min - low : high > max ? max - high : 0;
  const dx = shift(
    Math.min(...xs) - OPTION_RADIUS,
    Math.max(...xs) + OPTION_RADIUS,
    MARGIN,
    GAME_WIDTH - MARGIN,
  );
  const dy = shift(
    Math.min(...ys) - OPTION_RADIUS,
    Math.max(...ys) + BADGE_Y + BADGE_HEIGHT / 2,
    BAR_HEIGHT + MARGIN,
    GAME_HEIGHT - MARGIN,
  );
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/** Draws the Build menu's Slot outline and previewed range, in world space below towers. */
export interface BuildPreviewView {
  update(model: BuildMenuModel | null): void;
}

export function createBuildPreview(
  scene: Phaser.Scene,
  theme: SkinTheme,
  level: LevelDef,
): BuildPreviewView {
  // Same depth as the selected tower's range: above the map, below towers (depth 5).
  const g = scene.add.graphics().setDepth(4);
  const { tileSize } = level.grid;
  let drawn: string | null = null;

  return {
    update(model) {
      const key = model && `${model.slotId}:${model.range}`;
      if (key === drawn) return;
      drawn = key;
      g.clear();
      const c = model && slotCenter(level, model.slotId);
      if (!model || !c) return;

      if (model.range !== null) {
        const range = colorNumber(theme.colors.range);
        g.fillStyle(range, 0.12);
        g.fillCircle(c.x, c.y, model.range);
        g.lineStyle(1.5, range, 0.8);
        g.strokeCircle(c.x, c.y, model.range);
      }
      g.lineStyle(2, colorNumber(theme.colors.selection));
      g.strokeRect(c.x - tileSize / 2 + 4, c.y - tileSize / 2 + 4, tileSize - 8, tileSize - 8);
    },
  };
}

const THUMB_SLOT = '__thumbnail__';

/**
 * A level-1 tower of `kind` exactly as the Skin draws it on the field, its tile shrunk to
 * THUMB_TILE and centred on the returned container's origin. The view draws straight into the
 * scene, so the objects it creates are collected and moved into the container.
 */
function createThumbnail(
  scene: Phaser.Scene,
  skin: Pick<Skin, 'createTowerView'>,
  level: LevelDef,
  kind: string,
): Phaser.GameObjects.Container {
  const before = new Set(scene.children.list);
  const view = skin.createTowerView(scene, kind);
  // A one-Slot level whose Slot is the top-left cell, so the tower stands near the origin.
  const at: LevelDef = { ...level, slots: [{ id: THUMB_SLOT, col: 0, row: 0 }] };
  view.sync(
    { id: -1, kind, slotId: THUMB_SLOT, level: 1, cooldownTicks: 0, targetId: null },
    { level: at, path: buildPath(level), enemyPosition: () => undefined },
  );
  const drawn = scene.children.list.filter((o) => !before.has(o));
  const scale = THUMB_TILE / level.grid.tileSize;
  return scene.add
    .container(0, 0, drawn)
    .setScale(scale)
    .setPosition(-THUMB_TILE / 2, -THUMB_TILE / 2);
}

export interface BuildMenuActions {
  onOption(kind: string): void;
  onHover(kind: string | null): void;
}

export interface BuildMenu {
  update(model: BuildMenuModel | null): void;
}

interface OptionView {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  thumb: Phaser.GameObjects.Container;
  cost: ReturnType<typeof createLabel>;
  drawn: string | null;
}

/**
 * The ring of tower options around the Slot the Build menu is open on: each a thumbnail of the
 * tower with its cost. Unaffordable options are greyed with their cost in the danger colour; the
 * previewed one is outlined.
 */
export function createBuildMenu(
  scene: Phaser.Scene,
  skin: UiSkin & Pick<Skin, 'createTowerView'>,
  level: LevelDef,
  actions: BuildMenuActions,
): BuildMenu {
  const { theme } = skin;
  const root = scene.add.container(0, 0).setDepth(1500).setVisible(false);
  const views = new Map<string, OptionView>();

  const createOption = (option: BuildMenuOption): OptionView => {
    const bg = scene.add.graphics();
    const thumb = scene.add.container(0, -3, [createThumbnail(scene, skin, level, option.kind)]);
    const cost = createLabel(scene, skin, [{ icon: 'coin' }, String(option.cost)], {
      fontFamily: theme.fonts.ui,
      fontSize: '13px',
      color: theme.colors.text,
    });
    cost.root.setY(BADGE_Y);
    const view = scene.add.container(0, 0, [bg, thumb, cost.root]);
    // Container hit areas are measured from its top-left corner, i.e. (-r, -r).
    view.setSize(OPTION_RADIUS * 2, OPTION_RADIUS * 2);
    view.setInteractive({
      hitArea: new Phaser.Geom.Circle(OPTION_RADIUS, OPTION_RADIUS, OPTION_RADIUS + 4),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    view.on('pointerdown', () => actions.onOption(option.kind));
    view.on('pointerover', () => actions.onHover(option.kind));
    view.on('pointerout', () => actions.onHover(null));
    root.add(view);
    return { root: view, bg, thumb, cost, drawn: null };
  };

  const drawOption = (view: OptionView, option: BuildMenuOption) => {
    const key = `${option.affordable}:${option.previewing}`;
    if (key === view.drawn) return;
    view.drawn = key;
    const { bg } = view;
    bg.clear();
    bg.fillStyle(
      colorNumber(option.affordable ? theme.colors.button : theme.colors.buttonDisabled),
      0.95,
    );
    bg.fillCircle(0, 0, OPTION_RADIUS);
    bg.lineStyle(
      option.previewing ? 3 : 1.5,
      colorNumber(option.previewing ? theme.colors.selection : theme.colors.hudPanel),
    );
    bg.strokeCircle(0, 0, OPTION_RADIUS);
    const badgeWidth = view.cost.width + 10;
    bg.fillStyle(colorNumber(theme.colors.hudPanel), 0.92);
    bg.fillRoundedRect(-badgeWidth / 2, BADGE_Y - BADGE_HEIGHT / 2, badgeWidth, BADGE_HEIGHT, 6);
    view.thumb.setAlpha(option.affordable ? 1 : 0.45);
    const color = option.affordable ? theme.colors.text : theme.colors.danger;
    for (const text of view.cost.texts) text.setColor(color);
  };

  return {
    update(model) {
      const c = model && slotCenter(level, model.slotId);
      root.setVisible(Boolean(model && c));
      if (!model || !c) return;
      const layout = buildMenuLayout(c, model.options.length);
      model.options.forEach((option, i) => {
        let view = views.get(option.kind);
        if (!view) {
          view = createOption(option);
          views.set(option.kind, view);
        }
        view.root.setPosition(layout[i]!.x, layout[i]!.y);
        drawOption(view, option);
      });
    },
  };
}
