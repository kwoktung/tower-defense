import { afterEach, beforeEach, expect, vi, type MockInstance } from 'vitest';

const READY_TIMEOUT_MS = 5000;

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error');
});

afterEach(async () => {
  // Phaser stories render asynchronously; wait for the first frame so boot errors surface here.
  if (window.__STORY_READY__ === false) {
    await vi.waitFor(
      () => {
        if (!window.__STORY_READY__) throw new Error('Story did not render its first frame');
      },
      { timeout: READY_TIMEOUT_MS, interval: 50 },
    );
  }
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});
