import { describe, expect, it } from 'vitest';
import { scenario } from '../fixtures/scenario';
import { createSimulation } from '../sim/simulation';
import {
  chooseBuildKind,
  clickMap,
  createUiState,
  dropStaleSelection,
  selectTower,
  slotHoverFor,
} from './ui-state';

const setup = () => {
  const fixture = scenario().withGold(200).withTower('basic', 'slot-3').build();
  const sim = createSimulation(fixture);
  return { sim, ui: createUiState(fixture.units), towerId: sim.state.towers[0]!.id };
};

describe('clicking the map', () => {
  it('selects the tower on the clicked Slot instead of building', () => {
    const { sim, ui, towerId } = setup();

    clickMap(sim, ui, 'slot-3');

    expect(ui.selectedTowerId).toBe(towerId);
    expect(sim.state.towers).toHaveLength(1);
  });

  it('only closes an open panel when a free Slot is clicked, building nothing', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);

    clickMap(sim, ui, 'slot-2');

    expect(ui.selectedTowerId).toBeNull();
    expect(sim.isSlotFree('slot-2')).toBe(true);
  });

  it('closes an open panel when empty ground is clicked', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);

    clickMap(sim, ui, null);

    expect(ui.selectedTowerId).toBeNull();
  });

  it('builds the chosen kind on a free Slot when no panel is open', () => {
    const { sim, ui } = setup();

    clickMap(sim, ui, 'slot-2');

    expect(sim.state.towers.map((t) => t.slotId)).toEqual(['slot-3', 'slot-2']);
  });
});

describe('selection', () => {
  it('is cleared, with any pending sell confirmation, by choosing a kind to build', () => {
    const { ui, towerId } = setup();
    selectTower(ui, towerId);
    ui.confirmingSell = true;

    chooseBuildKind(ui, 'splash');

    expect(ui).toMatchObject({ buildKind: 'splash', selectedTowerId: null, confirmingSell: false });
  });

  it('is dropped once its tower has been sold', () => {
    const { sim, ui, towerId } = setup();
    selectTower(ui, towerId);

    sim.sellTower(towerId);
    dropStaleSelection(sim, ui);

    expect(ui.selectedTowerId).toBeNull();
  });

  it('hides the build preview on free Slots while a tower is selected', () => {
    const { sim, ui, towerId } = setup();

    expect(slotHoverFor(sim, 'slot-2', ui)).not.toBeNull();
    selectTower(ui, towerId);
    expect(slotHoverFor(sim, 'slot-2', ui)).toBeNull();
  });
});
