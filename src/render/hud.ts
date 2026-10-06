import type * as Phaser from 'phaser';
import { towerStats } from '../content/schemas';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import type { Simulation } from '../sim/simulation';
import { TICK_RATE } from '../sim/time';
import type { Outcome, SimEvent } from '../sim/types';
import { colorNumber, type IconName, type Skin } from './skin';
import { strings, towerName } from './strings';

/** What the HUD needs from the Skin: its Theme tokens and its icons. */
export type UiSkin = Pick<Skin, 'theme' | 'createIcon'>;

/** A run of text and icons laid out left to right, e.g. `[play] +12 [coin]`. */
export type Label = string | readonly (string | { icon: IconName })[];

/** Everything the HUD shows, derived from one SimState snapshot. */
export interface HudModel {
  lives: number;
  gold: number;
  /** One build button per tower kind, in catalog order. */
  towers: { kind: string; cost: number; affordable: boolean; selected: boolean }[];
  /** 1-based number of the current Wave; 0 before the first Wave. */
  waveNumber: number;
  waveCount: number;
  /**
   * The next-wave button: what it says, whether it can be pressed, and whether it offers gold;
   * null hides it (no Wave left to start).
   */
  nextWave: { label: Label; enabled: boolean; bonus?: boolean } | null;
  outcome: Outcome;
}

export interface HudActions {
  onChooseBuildKind(kind: string): void;
  onStartNextWave(): void;
  onRestart(): void;
}

export interface Hud {
  update(model: HudModel): void;
  /** One-off HUD feedback for SimEvents, e.g. an Early call bonus floating up from the gold. */
  playEvents(events: readonly SimEvent[]): void;
}

/** Height of the top bar; world UI such as the tower panel stays below it. */
export const BAR_HEIGHT = 40;
const PAD = 12;
/** Centre x of the first build button. */
const TOWERS_X = 380;
const TOWER_BUTTON_WIDTH = 110;
/** Size of the lives, wave and gold icons. */
const STAT_ICON = 18;
/** How long the Early call bonus floats beside the gold. */
const BONUS_FLOAT_MS = 600;

export interface Button {
  root: Phaser.GameObjects.Container;
  setEnabled(enabled: boolean): void;
  setSelected(selected: boolean): void;
  /** Changes the label; `color` (a Theme token value) overrides the enabled/disabled text colour. */
  setLabel(label: Label, color?: string): void;
}

const ICON_GAP = 4;

/** Lays `label` out centred on the returned container's origin; icons are `fontSize` across. */
export function createLabel(
  scene: Phaser.Scene,
  skin: UiSkin,
  label: Label,
  style: Phaser.Types.GameObjects.Text.TextStyle & { fontSize: string },
): {
  root: Phaser.GameObjects.Container;
  texts: Phaser.GameObjects.Text[];
  icons: Phaser.GameObjects.Container[];
  width: number;
} {
  const iconSize = Number.parseFloat(style.fontSize) * 1.15;
  const root = scene.add.container(0, 0);
  const texts: Phaser.GameObjects.Text[] = [];
  const icons: Phaser.GameObjects.Container[] = [];
  const parts = typeof label === 'string' ? [label] : label;
  let x = 0;
  for (const part of parts) {
    if (x > 0) x += ICON_GAP;
    if (typeof part === 'string') {
      const text = scene.add.text(x, 0, part, style).setOrigin(0, 0.5);
      texts.push(text);
      root.add(text);
      x += text.width;
    } else {
      const icon = skin.createIcon(scene, part.icon, iconSize).setPosition(x + iconSize / 2, 0);
      icons.push(icon);
      root.add(icon);
      x += iconSize;
    }
  }
  for (const child of [...texts, ...icons]) child.x -= x / 2;
  return { root, texts, icons, width: x };
}

const labelKey = (label: Label) =>
  typeof label === 'string'
    ? label
    : label.map((p) => (typeof p === 'string' ? p : `[${p.icon}]`)).join(' ');

/** A rounded button drawn from Theme tokens; clicks are ignored while it is disabled. */
export function createButton(
  scene: Phaser.Scene,
  skin: UiSkin,
  label: Label,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
  onClick: () => void,
): Button {
  const { theme } = skin;
  const textStyle = { fontFamily: theme.fonts.ui, fontSize: '15px', color: theme.colors.text };
  const bg = scene.add.graphics();
  const root = scene.add.container(x, y, [bg]).setSize(width, height);
  let content = createLabel(scene, skin, label, textStyle);
  let key = labelKey(label);
  root.add(content.root);
  let enabled = true;
  let hovered = false;
  let selected = false;
  let labelColor: string | undefined;

  const draw = () => {
    const fill = !enabled
      ? theme.colors.buttonDisabled
      : hovered
        ? theme.colors.buttonHover
        : theme.colors.button;
    bg.clear();
    bg.fillStyle(colorNumber(fill));
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    if (selected) {
      bg.lineStyle(2, colorNumber(theme.colors.selection));
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    }
    const color = labelColor ?? (enabled ? theme.colors.text : theme.colors.textMuted);
    for (const text of content.texts) text.setColor(color);
    for (const icon of content.icons) icon.setAlpha(enabled ? 1 : 0.45);
  };

  root.setInteractive({ useHandCursor: true });
  root.on('pointerover', () => ((hovered = true), draw()));
  root.on('pointerout', () => ((hovered = false), draw()));
  root.on('pointerdown', () => enabled && onClick());
  draw();

  return {
    root,
    setEnabled(next) {
      if (next === enabled) return;
      enabled = next;
      draw();
    },
    setSelected(next) {
      if (next === selected) return;
      selected = next;
      draw();
    },
    setLabel(label, color) {
      const next = labelKey(label);
      if (next === key && color === labelColor) return;
      if (next !== key) {
        content.root.destroy();
        content = createLabel(scene, skin, label, textStyle);
        key = next;
        root.add(content.root);
      }
      labelColor = color;
      draw();
    },
  };
}

/**
 * The Phaser-drawn HUD: a top bar with lives, wave and the next-wave button, plus the
 * end-of-game overlay. Colours and fonts come only from the Skin's theme tokens, icons from
 * the Skin, text from `strings`.
 */
export function createHud(scene: Phaser.Scene, skin: UiSkin, actions: HudActions): Hud {
  const { theme } = skin;
  const root = scene.add.container(0, 0).setDepth(2000);
  const textStyle = { fontFamily: theme.fonts.ui, fontSize: '16px', color: theme.colors.text };

  const bar = scene.add.graphics();
  bar.fillStyle(colorNumber(theme.colors.hudPanel), 0.8);
  bar.fillRect(0, 0, GAME_WIDTH, BAR_HEIGHT);

  /** An icon at `x` followed by its value. */
  const stat = (icon: IconName, x: number, color = theme.colors.text) => {
    const mark = skin
      .createIcon(scene, icon, STAT_ICON)
      .setPosition(x + STAT_ICON / 2, BAR_HEIGHT / 2);
    const text = scene.add
      .text(x + STAT_ICON + 6, BAR_HEIGHT / 2, '', { ...textStyle, color })
      .setOrigin(0, 0.5);
    root.add([mark, text]);
    return text;
  };
  root.add(bar);
  const lives = stat('heart', PAD);
  const wave = stat('flag', PAD + 80);
  const gold = stat('coin', PAD + 180, theme.colors.gold);
  /** Build buttons are created on first update, once the tower kinds are known. */
  const towerButtons = new Map<string, Button>();
  const nextWave = createButton(
    scene,
    skin,
    [{ icon: 'play' }, strings.startWave],
    { x: GAME_WIDTH - PAD - 60, y: BAR_HEIGHT / 2, width: 120, height: 28 },
    actions.onStartNextWave,
  );
  root.add(nextWave.root);

  const overlay = scene.add.container(0, 0).setVisible(false);
  const dim = scene.add.graphics();
  dim.fillStyle(colorNumber(theme.colors.overlay), 0.6);
  dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const title = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', { ...textStyle, fontSize: '48px' })
    .setOrigin(0.5);
  const restart = createButton(
    scene,
    skin,
    [{ icon: 'retry' }, strings.retry],
    { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 30, width: 140, height: 40 },
    actions.onRestart,
  );
  overlay.add([dim, title, restart.root]);
  root.add(overlay);

  return {
    update(model) {
      model.towers.forEach((t, i) => {
        let button = towerButtons.get(t.kind);
        if (!button) {
          const box = { x: TOWERS_X + i * (TOWER_BUTTON_WIDTH + 8), y: BAR_HEIGHT / 2 };
          button = createButton(
            scene,
            skin,
            [towerName(t.kind), { icon: 'coin' }, String(t.cost)],
            { ...box, width: TOWER_BUTTON_WIDTH, height: 28 },
            () => actions.onChooseBuildKind(t.kind),
          );
          towerButtons.set(t.kind, button);
          root.addAt(button.root, root.getIndex(overlay));
        }
        button.setEnabled(t.affordable);
        button.setSelected(t.selected);
      });
      lives.setText(String(model.lives));
      gold.setText(String(model.gold));
      wave.setText(strings.waveOf(model.waveNumber, model.waveCount));
      nextWave.root.setVisible(model.nextWave !== null);
      if (model.nextWave) {
        const { label, enabled, bonus } = model.nextWave;
        nextWave.setLabel(label, bonus ? theme.colors.gold : undefined);
        nextWave.setEnabled(enabled);
      }
      overlay.setVisible(model.outcome !== 'playing');
      title.setText(model.outcome === 'won' ? strings.victory : strings.defeat);
    },
    playEvents(events) {
      for (const event of events) {
        if (event.type !== 'waveStarted' || event.bonus <= 0) continue;
        const float = scene.add
          .text(gold.x + gold.width + 8, gold.y, `+${event.bonus}`, {
            ...textStyle,
            color: theme.colors.gold,
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);
        root.add(float);
        scene.tweens.add({
          targets: float,
          y: gold.y + 18,
          alpha: 0,
          duration: BONUS_FLOAT_MS,
          ease: 'Quad.easeIn',
          onComplete: () => float.destroy(),
        });
      }
    },
  };
}

/** The next-wave button for the current state; the Simulation decides whether a Wave may start. */
export function nextWaveButton(sim: Simulation): HudModel['nextWave'] {
  const { wave } = sim.state;
  const enabled = sim.canStartNextWave();
  const play = { icon: 'play' } as const;
  if (wave.index < 0) return { label: [play, strings.startWave], enabled };
  if (wave.index >= sim.level.waves.length - 1) return null;
  if (wave.spawning) return { label: [play], enabled: false };
  if (wave.autoStartTicks !== null) {
    return { label: [play, String(Math.ceil(wave.autoStartTicks / TICK_RATE))], enabled };
  }
  return { label: [play, `+${sim.nextWaveBonus()}`, { icon: 'coin' }], enabled, bonus: true };
}

/** Reads the HUD's model off a Simulation's current snapshot and the kind chosen to build. */
export function hudModelOf(sim: Simulation, buildKind: string | null): HudModel {
  return {
    lives: sim.state.lives,
    gold: sim.state.gold,
    towers: Object.keys(sim.units.towers).map((kind) => ({
      kind,
      cost: towerStats(sim.units, kind, 1)!.cost,
      affordable: sim.canAfford(kind),
      selected: kind === buildKind,
    })),
    waveNumber: sim.state.wave.index + 1,
    waveCount: sim.level.waves.length,
    nextWave: nextWaveButton(sim),
    outcome: sim.state.outcome,
  };
}
