import type * as Phaser from 'phaser';
import { towerStats, type LevelDef, type TowerLevelDef } from '../content/schemas';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import { slotCenter, type Point } from '../sim/path';
import type { Simulation } from '../sim/simulation';
import { BAR_HEIGHT, createButton, type UiSkin } from './hud';
import { colorNumber, type SkinTheme } from './skin';
import { strings, towerName } from './strings';

/** One stat line of the panel: its value now and at the next level (null at the top level). */
export interface TowerStatLine {
  label: string;
  current: string;
  next: string | null;
}

/** Everything the selected tower's panel and range circles show, from one snapshot. */
export interface TowerPanelModel {
  towerId: number;
  slotId: string;
  name: string;
  level: number;
  range: number;
  /** Null at the top level. */
  nextRange: number | null;
  stats: TowerStatLine[];
  /** Null at the top level. */
  upgrade: { cost: number; affordable: boolean; allowed: boolean } | null;
  sellValue: number;
  confirmingSell: boolean;
}

export interface TowerPanelActions {
  onUpgrade(towerId: number): void;
  onSell(towerId: number): void;
}

const fireRate = (def: TowerLevelDef) => strings.perSecond((1 / def.cooldownSec).toFixed(1));

function statLines(current: TowerLevelDef, next: TowerLevelDef | undefined): TowerStatLine[] {
  // A stat shows when this level or the next has it, e.g. a Splash the next level gains.
  const line = (label: string, of: (def: TowerLevelDef) => string | null) => {
    const now = of(current);
    const then = next ? of(next) : null;
    return now === null && then === null ? [] : [{ label, current: now ?? '—', next: then }];
  };
  const { stats } = strings;
  return [
    ...line(stats.damage, (d) => String(d.damage)),
    ...line(stats.rate, fireRate),
    ...line(stats.range, (d) => String(d.range)),
    ...line(stats.splash, (d) => (d.attack.mode === 'splash' ? String(d.attack.radius) : null)),
    ...line(stats.slow, (d) =>
      d.slow
        ? `${Math.round(d.slow.factor * 100)}% · ${strings.seconds(d.slow.durationSec)}`
        : null,
    ),
  ];
}

/** The panel model for `towerId`, or null if there is no such tower. */
export function towerPanelModelOf(
  sim: Simulation,
  towerId: number | null,
  confirmingSell: boolean,
): TowerPanelModel | null {
  const tower = sim.state.towers.find((t) => t.id === towerId);
  if (!tower) return null;
  const current = towerStats(sim.units, tower.kind, tower.level)!;
  const next = towerStats(sim.units, tower.kind, tower.level + 1);
  const check = sim.canUpgradeTower(tower.id);
  return {
    towerId: tower.id,
    slotId: tower.slotId,
    name: towerName(tower.kind),
    level: tower.level,
    range: current.range,
    nextRange: next?.range ?? null,
    stats: statLines(current, next),
    upgrade: next
      ? {
          cost: next.cost,
          affordable: check.ok || check.reason !== 'notEnoughGold',
          allowed: check.ok,
        }
      : null,
    sellValue: sim.sellValue(tower.id) ?? 0,
    confirmingSell,
  };
}

/** Draws the selected tower's outline, its range and the next level's range, in world space. */
export interface TowerSelectionView {
  update(model: TowerPanelModel | null): void;
}

export function createTowerSelection(
  scene: Phaser.Scene,
  theme: SkinTheme,
  level: LevelDef,
): TowerSelectionView {
  // Above the map and its hover preview, below towers (depth 5).
  const g = scene.add.graphics().setDepth(4);
  const { tileSize } = level.grid;
  let drawn: string | null = null;

  return {
    update(model) {
      const key = model && `${model.slotId}:${model.range}:${model.nextRange}`;
      if (key === drawn) return;
      drawn = key;
      g.clear();
      const c = model && slotCenter(level, model.slotId);
      if (!model || !c) return;

      const range = colorNumber(theme.colors.range);
      g.fillStyle(range, 0.12);
      g.fillCircle(c.x, c.y, model.range);
      g.lineStyle(1.5, range, 0.8);
      g.strokeCircle(c.x, c.y, model.range);
      if (model.nextRange !== null && model.nextRange !== model.range) {
        g.lineStyle(1, colorNumber(theme.colors.selection), 0.7);
        g.strokeCircle(c.x, c.y, model.nextRange);
      }
      g.lineStyle(2, colorNumber(theme.colors.selection));
      g.strokeRect(c.x - tileSize / 2 + 4, c.y - tileSize / 2 + 4, tileSize - 8, tileSize - 8);
    },
  };
}

/** The floating panel beside the selected tower: stats, upgrade and two-step sell. */
export interface TowerPanel {
  update(model: TowerPanelModel | null): void;
}

const PANEL_WIDTH = 240;
const PAD = 10;
const LINE_HEIGHT = 20;
const BUTTON_HEIGHT = 28;
/** Gap between the tower's centre and the panel's near edge. */
const OFFSET = 44;

/** Top-left corner for a panel beside `tower`: to its right, or its left near the right edge. */
export function panelPosition(tower: Point, height: number): Point {
  const right = tower.x + OFFSET;
  const x = right + PANEL_WIDTH <= GAME_WIDTH ? right : tower.x - OFFSET - PANEL_WIDTH;
  const y = Math.min(Math.max(tower.y - height / 2, BAR_HEIGHT + 4), GAME_HEIGHT - height - 4);
  return { x, y };
}

export function createTowerPanel(
  scene: Phaser.Scene,
  skin: UiSkin,
  level: LevelDef,
  actions: TowerPanelActions,
): TowerPanel {
  const { theme } = skin;
  const root = scene.add.container(0, 0).setDepth(1500).setVisible(false);
  const bg = scene.add.graphics();
  const textStyle = { fontFamily: theme.fonts.ui, fontSize: '14px', color: theme.colors.text };
  const title = scene.add.text(PAD, PAD, '', { ...textStyle, fontSize: '16px' });
  const stats = scene.add.text(PAD, PAD + 26, '', { ...textStyle, lineSpacing: 4 });
  let towerId: number | null = null;
  const buttonWidth = (PANEL_WIDTH - PAD * 3) / 2;
  const upgrade = createButton(
    scene,
    skin,
    '',
    { x: PAD + buttonWidth / 2, y: 0, width: buttonWidth, height: BUTTON_HEIGHT },
    () => towerId !== null && actions.onUpgrade(towerId),
  );
  const sell = createButton(
    scene,
    skin,
    '',
    { x: PAD * 2 + buttonWidth * 1.5, y: 0, width: buttonWidth, height: BUTTON_HEIGHT },
    () => towerId !== null && actions.onSell(towerId),
  );
  // Catches clicks on the panel's background so they don't reach the map and close the panel.
  const blocker = scene.add.zone(0, 0, PANEL_WIDTH, 1).setOrigin(0).setInteractive();
  root.add([blocker, bg, title, stats, upgrade.root, sell.root]);
  let drawnHeight = 0;

  return {
    update(model) {
      towerId = model?.towerId ?? null;
      const c = model && slotCenter(level, model.slotId);
      root.setVisible(Boolean(model && c));
      if (!model || !c) return;

      title.setText(`${model.name}  ${strings.level(model.level)}`);
      stats.setText(
        model.stats.map((s) => `${s.label}  ${s.current}${s.next ? `  →  ${s.next}` : ''}`),
      );
      const buttonsY = stats.y + model.stats.length * LINE_HEIGHT + PAD + BUTTON_HEIGHT / 2;
      const height = buttonsY + BUTTON_HEIGHT / 2 + PAD;
      upgrade.root.y = buttonsY;
      sell.root.y = buttonsY;

      if (model.upgrade) {
        const { cost, affordable, allowed } = model.upgrade;
        upgrade.setLabel(
          [{ icon: 'upgrade' }, String(cost)],
          affordable ? undefined : theme.colors.danger,
        );
        upgrade.setEnabled(allowed);
      } else {
        upgrade.setLabel(strings.maxLevel);
        upgrade.setEnabled(false);
      }
      sell.setLabel(
        model.confirmingSell ? strings.confirmSell(model.sellValue) : strings.sell(model.sellValue),
      );
      sell.setSelected(model.confirmingSell);

      if (height !== drawnHeight) {
        drawnHeight = height;
        blocker.setSize(PANEL_WIDTH, height);
        blocker.input?.hitArea.setSize(PANEL_WIDTH, height);
        bg.clear();
        bg.fillStyle(colorNumber(theme.colors.hudPanel), 0.92);
        bg.fillRoundedRect(0, 0, PANEL_WIDTH, height, 8);
        bg.lineStyle(1, colorNumber(theme.colors.button));
        bg.strokeRoundedRect(0, 0, PANEL_WIDTH, height, 8);
      }
      const at = panelPosition(c, height);
      root.setPosition(at.x, at.y);
    },
  };
}
