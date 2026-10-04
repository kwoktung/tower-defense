import type { Preview } from '@storybook/html-vite';
import { destroyMountedGame } from '../src/storybook/mount-phaser-story';
import type { ShotsParameters } from '../src/storybook/shots';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  beforeEach: ({ parameters }) => {
    window.__STORY_SHOTS__ = (parameters.shots as ShotsParameters | undefined) ?? null;
    // The returned cleanup runs when the story unmounts, releasing its Phaser game.
    return destroyMountedGame;
  },
};

export default preview;
