/// <reference types="node" />
/**
 * Screenshots every story, with and without the Debug overlay, into .shots/. Stories whose
 * `parameters.shots.ticks` lists tick counts are also shot fast-forwarded by each of them.
 *
 *   pnpm shots                 build Storybook, shoot every story
 *   pnpm shots map             only stories whose id or title contains "map"
 *   pnpm shots --skip-build    reuse the existing storybook-static build
 *   pnpm shots --skin=fruit    render with another Skin; files get a `--fruit` suffix
 */
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const STATIC_DIR = path.join(ROOT, 'storybook-static');
const OUT_DIR = path.join(ROOT, '.shots');
const READY_TIMEOUT_MS = 10_000;

interface IndexEntry {
  type: 'story' | 'docs';
  id: string;
  title: string;
  name: string;
}

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const filter = args.find((a) => !a.startsWith('--'))?.toLowerCase();
const skin = args.find((a) => a.startsWith('--skin='))?.slice('--skin='.length);

if (!skipBuild || !existsSync(STATIC_DIR)) {
  console.log('Building Storybook…');
  const build = spawnSync('pnpm', ['exec', 'storybook', 'build', '--quiet', '-o', STATIC_DIR], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const index = JSON.parse(readFileSync(path.join(STATIC_DIR, 'index.json'), 'utf8')) as {
  entries: Record<string, IndexEntry>;
};
const stories = Object.values(index.entries).filter(
  (e) =>
    e.type === 'story' &&
    (!filter || e.id.toLowerCase().includes(filter) || e.title.toLowerCase().includes(filter)),
);
if (stories.length === 0) {
  console.error(filter ? `No stories match "${filter}".` : 'No stories found.');
  process.exit(1);
}

// A full run replaces the folder so screenshots of deleted stories don't linger.
if (!filter && !skin) rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const server = await serve(STATIC_DIR);
const { port } = server.address() as AddressInfo;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const written: string[] = [];
const failures: string[] = [];

/** Loads one story variant, waits for its first frame and screenshots the canvas. */
async function shoot(storyId: string, args: Record<string, string>, suffix: string) {
  const file = path.join(OUT_DIR, `${storyId}${skin ? `--${skin}` : ''}${suffix}.png`);
  const argString = Object.entries(skin ? { ...args, skin } : args)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  try {
    await page.goto(
      `http://localhost:${port}/iframe.html?id=${storyId}&viewMode=story&args=${argString}`,
    );
    await page.waitForFunction(() => window.__STORY_READY__ === true, null, {
      timeout: READY_TIMEOUT_MS,
    });
    const canvas = page.locator('canvas').first();
    await ((await canvas.count()) ? canvas : page).screenshot({ path: file });
    written.push(path.relative(ROOT, file));
  } catch (error) {
    failures.push(`${storyId}${suffix}: ${(error as Error).message}`);
  }
}

try {
  for (const story of stories) {
    await shoot(story.id, { debug: '!false' }, '');
    // Stories publish `parameters.shots` once loaded; ticks add fast-forwarded variants.
    const ticks = await page.evaluate(() => window.__STORY_SHOTS__?.ticks ?? []);
    await shoot(story.id, { debug: '!true' }, '--debug');
    for (const t of ticks.filter((t) => t > 0)) {
      await shoot(story.id, { debug: '!false', advanceTicks: String(t) }, `--t${t}`);
      await shoot(story.id, { debug: '!true', advanceTicks: String(t) }, `--debug--t${t}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\nWrote ${written.length} screenshot(s):`);
for (const file of written) console.log(`  ${file}`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

function serve(dir: string): Promise<Server> {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
  };
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = path.join(dir, pathname);
    if (!file.startsWith(dir)) return void res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}
