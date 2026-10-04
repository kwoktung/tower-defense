import { bundledLevelSources, bundledUnitsSource } from '../content/bundled';
import { createLocalLevelRepository } from './local/local-level-repository';
import { createLocalProgressStore } from './local/local-progress-store';
import type { KeyValueStorage, Services, ServicesEnv } from './types';

/** The browser's localStorage, touched only on first read or write (Node has none by default). */
const browserStorage: KeyValueStorage = {
  getItem: (key) => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
};

/** Composition root: the only place that decides which service implementations to use. */
export function createServices(env: ServicesEnv): Services {
  switch (env.kind) {
    case 'local':
      return {
        levels: createLocalLevelRepository({
          levels: bundledLevelSources,
          units: bundledUnitsSource,
        }),
        progress: createLocalProgressStore(env.storage ?? browserStorage),
      };
  }
}
