import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');
/** Where player-facing text could hide: the render layer and the bundled content. */
const SCANNED = ['src/render', 'content'];
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return filesUnder(file);
    return /\.(ts|json)$/.test(name) ? [file] : [];
  });
}

describe('display text', () => {
  it('has no CJK text outside strings.ts', () => {
    const hits = SCANNED.flatMap((dir) => filesUnder(path.join(ROOT, dir)))
      .filter((file) => !file.endsWith(`${path.sep}strings.ts`))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .flatMap((line, i) =>
            CJK.test(line) ? [`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`] : [],
          ),
      );

    expect(hits).toEqual([]);
  });
});
