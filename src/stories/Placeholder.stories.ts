import type { Meta, StoryObj } from '@storybook/html-vite';

// Placeholder until ticket 02 adds the Phaser mount helper and the Map stories.
const meta: Meta = {
  title: 'Placeholder',
};
export default meta;

export const Hello: StoryObj = {
  render: () => {
    const el = document.createElement('p');
    el.textContent = 'Storybook is running. Game stories arrive with ticket 02.';
    return el;
  },
};
