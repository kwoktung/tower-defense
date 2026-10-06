import * as Phaser from 'phaser';
import { towerStats, type LevelDef } from '../content/schemas';
import { GAME_WIDTH } from '../game-config';
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

const OPTION_RADIUS = 25;
/** Gap between neighbouring options in the row. */
const OPTION_GAP = 8;
/** The cost badge hangs over the bottom of its option. */
const BADGE_Y = OPTION_RADIUS - 2;
const BADGE_HEIGHT = 18;
/** Gap between the Slot's edge and the row (its options or their cost badges). */
const ROW_GAP = 6;
/** A tower thumbnail shows its tile at this size. */
const THUMB_TILE = 44;
/** Space kept between the menu and the screen edges (and the top bar). */
const MARGIN = 6;

/** Most options in one row; more wrap onto further rows. */
const ROW_SIZE = 3;
/** Distance between the centres of neighbouring rows: an option, its badge and a gap. */
const ROW_STEP = OPTION_RADIUS + BADGE_Y + BADGE_HEIGHT / 2 + OPTION_GAP;

/**
 * Option centres for a menu on `slot`: rows of up to ROW_SIZE options in reading order, each
 * centred on the Slot, the block above the Slot, or below it when there is no room above (under
 * the top bar). The block is pushed sideways, as a whole, to stay on screen.
 */
export function buildMenuLayout(slot: Point, count: number, tileSize: number): Point[] {
  const step = OPTION_RADIUS * 2 + OPTION_GAP;
  const rows = Math.ceil(count / ROW_SIZE);
  const half = tileSize / 2;
  // Centre of the row nearest the Slot, above or below it.
  const nearestAbove = slot.y - half - ROW_GAP - (BADGE_Y + BADGE_HEIGHT / 2);
  const topAbove = nearestAbove - (rows - 1) * ROW_STEP;
  const top =
    topAbove - OPTION_RADIUS >= BAR_HEIGHT + MARGIN
      ? topAbove
      : slot.y + half + ROW_GAP + OPTION_RADIUS;
  const widest = Math.min(count, ROW_SIZE) * step - OPTION_GAP;
  const left = slot.x - widest / 2;
  const dx =
    Math.min(Math.max(left, MARGIN), Math.max(GAME_WIDTH - MARGIN - widest, MARGIN)) - left;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / ROW_SIZE);
    const inRow = Math.min(ROW_SIZE, count - row * ROW_SIZE);
    const rowLeft = slot.x - (inRow * step - OPTION_GAP) / 2;
    return {
      x: rowLeft + OPTION_RADIUS + (i % ROW_SIZE) * step + dx,
      y: top + row * ROW_STEP,
    };
  });
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
 * The row of tower options beside the Slot the Build menu is open on: each a thumbnail of the
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
      const layout = buildMenuLayout(c, model.options.length, level.grid.tileSize);
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
