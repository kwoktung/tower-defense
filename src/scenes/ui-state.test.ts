import { describe, expect, it } from 'vitest';
import { fixtures } from '../fixtures/named';
import { scenario } from '../fixtures/scenario';
import { createSimulation, type Simulation } from '../sim/simulation';
import {
  clickBuildOption,
  clickMap,
  createUiState,
  dropStaleSelection,
  hoverBuildOption,
  selectTower,
  slotHoverFor,
} from './ui-state';

const setup = (gold = 200) => {
  const fixture = scenario().withGold(gold).withTower('basic', 'slot-3').build();
  const sim = createSimulation(fixture);
  return { sim, ui: createUiState(), towerId: sim.state.towers[0]!.id };
};

const slotsBuilt = (sim: Simulation) => sim.state.towers.map((t) => t.slotId);

describe('clicking the map', () => {
  it('opens the panel of the tower on the clicked Slot', () => {
    const { sim, ui, towerId } = setup();

    clickMap(sim, ui, 'slot-3');

    expect(ui.selectedTowerId).toBe(towerId);
    expect(ui.buildMenu).toBeNull();
  });

  it('opens the Build menu on a free Slot, previewing nothing and building nothing', () => {
    const { sim, ui } = setup();

    clickMap(sim, ui, 'slot-2');

    expect(ui.buildMenu).toEqual({ slotId: 'slot-2', previewKind: null, hoverKind: null });
    expect(slotsBuilt(sim)).toEqual(['slot-3']);
  });

  it('moves an open Build menu to another free Slot, dropping its preview', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');
    clickBuildOption(sim, ui, 'basic');

    clickMap(sim, ui, 'slot-5');

    expect(ui.buildMenu).toEqual({ slotId: 'slot-5', previewKind: null, hoverKind: null });
  });

  it('closes the Build menu when its own Slot is clicked again', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');

    clickMap(sim, ui, 'slot-2');

    expect(ui.buildMenu).toBeNull();
  });

  it('closes the Build menu when empty ground is clicked, building nothing', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');
    clickBuildOption(sim, ui, 'basic');

    clickMap(sim, ui, null);

    expect(ui.buildMenu).toBeNull();
    expect(slotsBuilt(sim)).toEqual(['slot-3']);
  });

  it("closes the Build menu and opens a tower's panel when the tower is clicked", () => {
    const { sim, ui, towerId } = setup();
    clickMap(sim, ui, 'slot-2');

    clickMap(sim, ui, 'slot-3');

    expect(ui.buildMenu).toBeNull();
    expect(ui.selectedTowerId).toBe(towerId);
  });

  it('closes an open panel, with its pending sell confirmation, when a free Slot is clicked', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);
    ui.confirmingSell = true;

    clickMap(sim, ui, 'slot-2');

    expect(ui).toMatchObject({ selectedTowerId: null, confirmingSell: false });
    expect(ui.buildMenu?.slotId).toBe('slot-2');
  });

  it('closes an open panel when empty ground is clicked', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);

    clickMap(sim, ui, null);

    expect(ui.selectedTowerId).toBeNull();
  });
});

describe('the Build menu', () => {
  it('previews a kind on the first press and builds it on the second', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');

    clickBuildOption(sim, ui, 'splash');
    expect(ui.buildMenu?.previewKind).toBe('splash');
    expect(slotsBuilt(sim)).toEqual(['slot-3']);

    clickBuildOption(sim, ui, 'splash');
    expect(sim.state.towers.at(-1)).toMatchObject({ slotId: 'slot-2', kind: 'splash' });
    expect(ui.buildMenu).toBeNull();
  });

  it('switches the preview when another option is pressed, building nothing', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');
    clickBuildOption(sim, ui, 'basic');

    clickBuildOption(sim, ui, 'slow');

    expect(ui.buildMenu?.previewKind).toBe('slow');
    expect(slotsBuilt(sim)).toEqual(['slot-3']);
  });

  it('previews but does not build a kind the gold does not cover, until it does', () => {
    // 40 gold: short of a basic tower until the one on slot-3 is sold.
    const { sim, ui, towerId } = setup(40);
    clickMap(sim, ui, 'slot-2');

    clickBuildOption(sim, ui, 'basic');
    clickBuildOption(sim, ui, 'basic');
    expect(ui.buildMenu?.previewKind).toBe('basic');
    expect(slotsBuilt(sim)).toEqual(['slot-3']);

    sim.sellTower(towerId);
    clickBuildOption(sim, ui, 'basic');
    expect(slotsBuilt(sim)).toEqual(['slot-2']);
  });

  it('never builds on hover alone: a press after hovering only previews', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');

    hoverBuildOption(ui, 'basic');
    clickBuildOption(sim, ui, 'basic');

    expect(ui.buildMenu).toMatchObject({ previewKind: 'basic', hoverKind: 'basic' });
    expect(slotsBuilt(sim)).toEqual(['slot-3']);
  });

  it('closes once its Slot is taken', () => {
    const { sim, ui } = setup();
    clickMap(sim, ui, 'slot-2');

    sim.placeTower('slot-2', 'basic');
    dropStaleSelection(sim, ui);

    expect(ui.buildMenu).toBeNull();
  });

  it('closes once the game is over', () => {
    const sim = createSimulation(fixtures.won());
    const ui = createUiState();
    const free = sim.level.slots.find((s) => sim.isSlotFree(s.id))!.id;
    ui.buildMenu = { slotId: free, previewKind: null, hoverKind: null };

    dropStaleSelection(sim, ui);

    expect(ui.buildMenu).toBeNull();
  });
});

describe('selection', () => {
  it('is dropped once its tower has been sold', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);

    sim.sellTower(towerId);
    dropStaleSelection(sim, ui);

    expect(ui.selectedTowerId).toBeNull();
  });
});

describe('hovering the map', () => {
  it('highlights free Slots only', () => {
    const { sim } = setup();

    expect(slotHoverFor(sim, 'slot-2')).toEqual({ slotId: 'slot-2' });
    expect(slotHoverFor(sim, 'slot-3')).toBeNull();
    expect(slotHoverFor(sim, null)).toBeNull();
  });
});
