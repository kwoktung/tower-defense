import type { Preview } from '@storybook/html-vite';
import { destroyMountedGame } from '../src/storybook/mount-phaser-story';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  // The returned cleanup runs when the story unmounts, releasing its Phaser game.
  beforeEach: () => destroyMountedGame,
};

export default preview;
