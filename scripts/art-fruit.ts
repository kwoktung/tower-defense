/// <reference types="node" />
/**
 * Builds the fruit skin's atlas from the raw Gemini images, reproducibly:
 *
 *   pnpm art:fruit
 *
 * For each sprite sheet in art/fruit/manifest.json: removes the flat magenta background, splits
 * the sheet into its frames on empty columns (left to right), trims and scales each frame to fit
 * its box, then packs every frame into one atlas PNG plus a Phaser JSON-hash file. Textures are
 * cropped square and written next to it. Needs ImageMagick 7 (`magick`).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ART = path.join(ROOT, 'art/fruit');
const RAW = path.join(ART, 'raw');
const OUT = path.join(ROOT, 'src/render/skins/fruit/assets');
/** Gemini exports JPEG, so the magenta is noisy; this tolerance and a 1 px erode cut it cleanly. */
const FUZZ = '22%';
/** Columns whose average alpha is below this count as empty when splitting a sheet. */
const EMPTY_COLUMN = 0.004;
/** Pieces closer than this (in raw pixels) belong to the same frame, e.g. a held pineapple chunk. */
const MERGE_GAP = 24;
const PADDING = 2;
const ATLAS_WIDTH = 512;
/** Keeps PNG output byte-identical across runs. */
const DETERMINISTIC = ['-strip', '-define', 'png:exclude-chunks=date,time'];

interface Manifest {
  sprites: { source: string; frames: string[]; box: number }[];
  textures: { source: string; name: string; size: number }[];
}

function magick(args: string[]): string {
  const run = spawnSync('magick', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (run.error) throw new Error('ImageMagick 7 (`magick`) is required: brew install imagemagick');
  if (run.status !== 0) throw new Error(`magick ${args.join(' ')}\n${run.stderr}`);
  return run.stdout;
}

const size = (file: string) => {
  const [w, h] = magick(['identify', '-format', '%w %h', file]).split(' ').map(Number);
  return { w: w!, h: h! };
};

/** Background colour sampled from the top-left corner, then removed everywhere within FUZZ. */
function cutOut(source: string, out: string): void {
  const bg = magick([source, '-format', '%[pixel:p{3,3}]', 'info:']).trim();
  magick([
    source,
    '-alpha',
    'set',
    '-fuzz',
    FUZZ,
    '-transparent',
    bg,
    '-channel',
    'A',
    '-morphology',
    'Erode',
    'Disk:1',
    '+channel',
    `PNG32:${out}`,
  ]);
}

/** Splits a cut-out sheet into `count` column ranges, left to right, on empty columns. */
function columnRanges(file: string, count: number): [number, number][] {
  const { w } = size(file);
  const alpha = magick([file, '-alpha', 'extract', '-scale', `${w}x1!`, '-depth', '16', 'txt:-'])
    .split('\n')
    .filter((line) => /^\d+,0:/.test(line))
    .map((line) => Number(/\((\d+(?:\.\d+)?)/.exec(line)![1]) / 65535);
  const ranges: [number, number][] = [];
  alpha.forEach((a, x) => {
    if (a < EMPTY_COLUMN) return;
    const last = ranges.at(-1);
    if (last && x - last[1] <= MERGE_GAP) last[1] = x;
    else ranges.push([x, x]);
  });
  const mass = ([a, b]: [number, number]) => alpha.slice(a, b + 1).reduce((s, v) => s + v, 0);
  const kept = [...ranges].sort((a, b) => mass(b) - mass(a)).slice(0, count);
  if (kept.length < count) {
    throw new Error(`${path.basename(file)}: found ${kept.length} pieces, expected ${count}`);
  }
  return kept.sort((a, b) => a[0] - b[0]);
}

/** Crops one frame out of a cut-out sheet and trims it, at raw size. */
function cropFrame(sheet: string, [x0, x1]: [number, number], out: string): void {
  const { h } = size(sheet);
  magick([
    sheet,
    '-crop',
    `${x1 - x0 + 1}x${h}+${x0}+0`,
    '+repage',
    '-trim',
    '+repage',
    `PNG32:${out}`,
  ]);
}

/**
 * Scales a sheet's frames by one factor, so the largest fits `box`: sizes within a sheet stay as
 * drawn (a crowned level 3 is no smaller than level 1, a fly stays smaller than a beetle).
 */
function scaleFrames(files: string[], box: number): void {
  const largest = Math.max(...files.map((f) => Math.max(size(f).w, size(f).h)));
  const percent = ((box / largest) * 100).toFixed(4);
  for (const file of files) {
    magick([
      file,
      '-filter',
      'Lanczos',
      '-resize',
      `${percent}%`,
      ...DETERMINISTIC,
      `PNG32:${file}`,
    ]);
  }
}

interface Placed {
  name: string;
  file: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Shelf packing: tallest first, left to right, a new shelf when the row is full. */
function pack(frames: { name: string; file: string }[]): { placed: Placed[]; height: number } {
  const sized = frames.map((f) => ({ ...f, ...size(f.file) }));
  sized.sort((a, b) => b.h - a.h || a.name.localeCompare(b.name));
  const placed: Placed[] = [];
  let x = PADDING;
  let y = PADDING;
  let shelf = 0;
  for (const f of sized) {
    if (x + f.w + PADDING > ATLAS_WIDTH) {
      x = PADDING;
      y += shelf + PADDING;
      shelf = 0;
    }
    placed.push({ name: f.name, file: f.file, x, y, w: f.w, h: f.h });
    x += f.w + PADDING;
    shelf = Math.max(shelf, f.h);
  }
  return { placed, height: y + shelf + PADDING };
}

function main(): void {
  const manifest = JSON.parse(readFileSync(path.join(ART, 'manifest.json'), 'utf8')) as Manifest;
  const work = mkdtempSync(path.join(tmpdir(), 'art-fruit-'));
  mkdirSync(OUT, { recursive: true });
  try {
    const frames: { name: string; file: string }[] = [];
    for (const sprite of manifest.sprites) {
      const sheet = path.join(work, `${path.parse(sprite.source).name}.png`);
      cutOut(path.join(RAW, sprite.source), sheet);
      const files = columnRanges(sheet, sprite.frames.length).map((range, i) => {
        const name = sprite.frames[i]!;
        const file = path.join(work, `${name}.png`);
        cropFrame(sheet, range, file);
        frames.push({ name, file });
        return file;
      });
      scaleFrames(files, sprite.box);
    }

    const { placed, height } = pack(frames);
    magick([
      '-size',
      `${ATLAS_WIDTH}x${height}`,
      'xc:none',
      ...placed.flatMap((p) => [p.file, '-geometry', `+${p.x}+${p.y}`, '-composite']),
      ...DETERMINISTIC,
      `PNG32:${path.join(OUT, 'fruit-atlas.png')}`,
    ]);
    const json = {
      frames: Object.fromEntries(
        [...placed]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((p) => [
            p.name,
            {
              frame: { x: p.x, y: p.y, w: p.w, h: p.h },
              rotated: false,
              trimmed: false,
              spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h },
              sourceSize: { w: p.w, h: p.h },
            },
          ]),
      ),
      meta: { image: 'fruit-atlas.png', size: { w: ATLAS_WIDTH, h: height }, scale: '1' },
    };
    writeFileSync(path.join(OUT, 'fruit-atlas.json'), `${JSON.stringify(json, null, 2)}\n`);

    for (const texture of manifest.textures) {
      const src = path.join(RAW, texture.source);
      const { w, h } = size(src);
      const side = Math.min(w, h);
      magick([
        src,
        '-gravity',
        'center',
        '-crop',
        `${side}x${side}+0+0`,
        '+repage',
        '-filter',
        'Lanczos',
        '-resize',
        `${texture.size}x${texture.size}!`,
        ...DETERMINISTIC,
        `PNG24:${path.join(OUT, `${texture.name}.png`)}`,
      ]);
    }

    console.log(
      `Wrote ${placed.length} frames (${ATLAS_WIDTH}x${height}) and ${manifest.textures.length} textures to ${path.relative(ROOT, OUT)}/`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main();
