import type * as Phaser from 'phaser';
import { towerStats } from '../content/schemas';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import type { Simulation } from '../sim/simulation';
import { TICK_RATE } from '../sim/time';
import type { Outcome, SimEvent } from '../sim/types';
import { colorNumber, type SkinTheme } from './skin';

/** Everything the HUD shows, derived from one SimState snapshot. */
export interface HudModel {
  lives: number;
  gold: number;
  /** One build button per tower kind, in catalog order. */
  towers: { kind: string; name: string; cost: number; affordable: boolean; selected: boolean }[];
  /** 1-based number of the current Wave; 0 before the first Wave. */
  waveNumber: number;
  waveCount: number;
  /** The next-wave button: what it says, whether it can be pressed, and whether it offers gold. */
  nextWave: { label: string; enabled: boolean; bonus?: boolean };
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
/** How long the Early call bonus floats beside the gold. */
const BONUS_FLOAT_MS = 600;

export interface Button {
  root: Phaser.GameObjects.Container;
  setEnabled(enabled: boolean): void;
  setSelected(selected: boolean): void;
  /** Changes the label; `color` (a Theme token value) overrides the enabled/disabled colour. */
  setLabel(label: string, color?: string): void;
}

/** A rounded button drawn from Theme tokens; clicks are ignored while it is disabled. */
export function createButton(
  scene: Phaser.Scene,
  theme: SkinTheme,
  label: string,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
  onClick: () => void,
): Button {
  const bg = scene.add.graphics();
  const text = scene.add
    .text(0, 0, label, { fontFamily: theme.fonts.ui, fontSize: '15px', color: theme.colors.text })
    .setOrigin(0.5);
  const root = scene.add.container(x, y, [bg, text]).setSize(width, height);
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
    text.setColor(labelColor ?? (enabled ? theme.colors.text : theme.colors.textMuted));
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
      if (label === text.text && color === labelColor) return;
      text.setText(label);
      labelColor = color;
      draw();
    },
  };
}

/**
 * The Phaser-drawn HUD: a top bar with lives, wave and the next-wave button, plus the
 * end-of-game overlay. Colours and fonts come only from the Skin's theme tokens.
 */
export function createHud(scene: Phaser.Scene, theme: SkinTheme, actions: HudActions): Hud {
  const root = scene.add.container(0, 0).setDepth(2000);
  const textStyle = { fontFamily: theme.fonts.ui, fontSize: '16px', color: theme.colors.text };

  const bar = scene.add.graphics();
  bar.fillStyle(colorNumber(theme.colors.hudPanel), 0.8);
  bar.fillRect(0, 0, GAME_WIDTH, BAR_HEIGHT);

  const lives = scene.add.text(PAD, BAR_HEIGHT / 2, '', textStyle).setOrigin(0, 0.5);
  const wave = scene.add.text(PAD + 90, BAR_HEIGHT / 2, '', textStyle).setOrigin(0, 0.5);
  const gold = scene.add
    .text(PAD + 200, BAR_HEIGHT / 2, '', { ...textStyle, color: theme.colors.gold })
    .setOrigin(0, 0.5);
  /** Build buttons are created on first update, once the tower kinds are known. */
  const towerButtons = new Map<string, Button>();
  const nextWave = createButton(
    scene,
    theme,
    '开始下一波',
    { x: GAME_WIDTH - PAD - 60, y: BAR_HEIGHT / 2, width: 120, height: 28 },
    actions.onStartNextWave,
  );
  root.add([bar, lives, wave, gold, nextWave.root]);

  const overlay = scene.add.container(0, 0).setVisible(false);
  const dim = scene.add.graphics();
  dim.fillStyle(colorNumber(theme.colors.overlay), 0.6);
  dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const title = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', { ...textStyle, fontSize: '48px' })
    .setOrigin(0.5);
  const restart = createButton(
    scene,
    theme,
    '重来',
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
            theme,
            `${t.name} ${t.cost}`,
            { ...box, width: TOWER_BUTTON_WIDTH, height: 28 },
            () => actions.onChooseBuildKind(t.kind),
          );
          towerButtons.set(t.kind, button);
          root.addAt(button.root, root.getIndex(overlay));
        }
        button.setEnabled(t.affordable);
        button.setSelected(t.selected);
      });
      lives.setText(`生命 ${model.lives}`);
      gold.setText(`金币 ${model.gold}`);
      wave.setText(`第 ${model.waveNumber} / ${model.waveCount} 波`);
      nextWave.setLabel(model.nextWave.label, model.nextWave.bonus ? theme.colors.gold : undefined);
      nextWave.setEnabled(model.nextWave.enabled);
      overlay.setVisible(model.outcome !== 'playing');
      title.setText(model.outcome === 'won' ? '胜利' : '失败');
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
  if (wave.index < 0) return { label: '开始第 1 波', enabled };
  if (wave.index >= sim.level.waves.length - 1) return { label: '最后一波', enabled: false };
  if (wave.spawning) return { label: '出怪中', enabled: false };
  if (wave.autoStartTicks !== null) {
    return { label: `下一波 ${Math.ceil(wave.autoStartTicks / TICK_RATE)}`, enabled };
  }
  return { label: `提前开波 +${sim.nextWaveBonus()}`, enabled, bonus: true };
}

/** Reads the HUD's model off a Simulation's current snapshot and the kind chosen to build. */
export function hudModelOf(sim: Simulation, buildKind: string | null): HudModel {
  return {
    lives: sim.state.lives,
    gold: sim.state.gold,
    towers: Object.entries(sim.units.towers).map(([kind, def]) => ({
      kind,
      name: def.name,
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
