import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'node_modules', '.shots'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  // Layering (ADR-0001): the Simulation is pure TypeScript.
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'phaser', message: 'Simulation must not depend on Phaser (ADR-0001).' }],
          patterns: [
            {
              group: [
                '**/render',
                '**/render/**',
                '**/scenes',
                '**/scenes/**',
                '**/services',
                '**/services/**',
              ],
              message: 'Simulation must not depend on render, scenes or services (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
  // Rendering never touches data services; only scenes do.
  {
    files: ['src/render/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services', '**/services/**', '**/scenes', '**/scenes/**'],
              message: 'Render must not depend on services or scenes; scenes wire them together.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
