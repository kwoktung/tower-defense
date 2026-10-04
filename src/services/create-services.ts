import { bundledLevelSources } from '../content/bundled';
import { createLocalLevelRepository } from './local/local-level-repository';
import type { Services, ServicesEnv } from './types';

/** Composition root: the only place that decides which service implementations to use. */
export function createServices(env: ServicesEnv): Services {
  switch (env.kind) {
    case 'local':
      return { levels: createLocalLevelRepository(bundledLevelSources) };
  }
}
