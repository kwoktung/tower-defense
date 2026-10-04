import { describe, expect, it } from 'vitest';
import { TICK_RATE, secondsToTicks } from './index';

describe('secondsToTicks', () => {
  it('converts config seconds into whole ticks at the fixed tick rate', () => {
    expect(TICK_RATE).toBe(60);
    expect(secondsToTicks(0.5)).toBe(30);
    expect(secondsToTicks(1.2)).toBe(72);
  });
});
