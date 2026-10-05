/** Every colour the fruit skin draws itself; the art supplies the rest. Warm orchard tones. */
export const palette = {
  grass: '#5a9a46',
  path: '#c99a5b',
  pathEdge: '#8a5a32',
  slot: '#6b4a2b',
  slotHover: '#ffe08a',
  rangePreview: '#fff6d6',
  text: '#fffaf0',
  textMuted: '#d9c9a8',
  gold: '#ffcc33',
  hudPanel: '#3d2a1a',
  button: '#7a5230',
  buttonHover: '#94663c',
  buttonDisabled: '#4a3524',
  selection: '#ffd84d',
  danger: '#ff6b5b',
  overlay: '#1a120b',
  hpBar: '#7ed957',
  hpBarEmpty: '#3b2a1c',
  /** The sour ring and wash on a slowed enemy. */
  sour: '#d4f04a',
  fallback: '#ff00ff',
} as const;

/** Juice colour of each tower kind: its shots' splashes and its sale. */
const JUICE: Record<string, string> = {
  basic: '#4b5fd6',
  splash: '#ffc233',
  slow: '#d4f04a',
};

export function juiceColor(kind: string): string {
  return JUICE[kind] ?? palette.gold;
}

/** Body colour of each enemy kind, for its kill burst. */
const ENEMY: Record<string, string> = {
  normal: '#7cc84a',
  fast: '#9aa7b0',
  armored: '#7a6a5c',
};

export function enemyColor(kind: string): string {
  return ENEMY[kind] ?? palette.textMuted;
}

export const uiFont = 'system-ui, sans-serif';
