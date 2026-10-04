import type * as Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import type { Simulation } from '../sim/simulation';
import type { Outcome } from '../sim/types';
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
  canStartNextWave: boolean;
  outcome: Outcome;
}

export interface HudActions {
  onSelectTower(kind: string): void;
  onStartNextWave(): void;
  onRestart(): void;
}

export interface Hud {
  update(model: HudModel): void;
  destroy(): void;
}

const BAR_HEIGHT = 40;
const PAD = 12;
/** Centre x of the first build button. */
const TOWERS_X = 380;
const TOWER_BUTTON_WIDTH = 110;

interface Button {
  root: Phaser.GameObjects.Container;
  setEnabled(enabled: boolean): void;
  setSelected(selected: boolean): void;
}

function createButton(
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
    text.setColor(enabled ? theme.colors.text : theme.colors.textMuted);
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
            () => actions.onSelectTower(t.kind),
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
      nextWave.setEnabled(model.canStartNextWave);
      overlay.setVisible(model.outcome !== 'playing');
      title.setText(model.outcome === 'won' ? '胜利' : '失败');
    },
    destroy: () => root.destroy(),
  };
}

/** Reads the HUD's model off a Simulation's current snapshot and the player's tower selection. */
export function hudModelOf(sim: Simulation, selectedTower: string | null): HudModel {
  return {
    lives: sim.state.lives,
    gold: sim.state.gold,
    towers: Object.entries(sim.units.towers).map(([kind, def]) => ({
      kind,
      name: def.name,
      cost: def.cost,
      affordable: sim.state.gold >= def.cost,
      selected: kind === selectedTower,
    })),
    waveNumber: sim.state.wave.index + 1,
    waveCount: sim.level.waves.length,
    canStartNextWave: sim.canStartNextWave(),
    outcome: sim.state.outcome,
  };
}
