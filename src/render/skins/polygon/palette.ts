/** Every colour the Polygon skin uses. Enemies are reds; towers (later) are cool tones. */
export const palette = {
  background: '#1e2430',
  path: '#c9b28a',
  slot: '#3d5a4a',
  slotHover: '#6fae8a',
  towerBasic: '#3b82f6',
  towerSplash: '#06b6d4',
  towerUnknown: '#1e40af',
  rangePreview: '#e2e8f0',
  enemyNormal: '#dc2626',
  enemyFast: '#fb7185',
  enemyUnknown: '#991b1b',
  hpBar: '#22c55e',
  hitFlash: '#ffffff',
  projectile: '#facc15',
  splash: '#facc15',
  hpBarEmpty: '#374151',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  gold: '#fbbf24',
  hudPanel: '#0f141c',
  button: '#334155',
  buttonHover: '#475569',
  buttonDisabled: '#1f2937',
  selection: '#fbbf24',
  overlay: '#000000',
} as const;

const ENEMY_COLORS: Record<string, string> = {
  normal: palette.enemyNormal,
  fast: palette.enemyFast,
};

/** The one place an enemy kind gets its colour; unknown kinds share the fallback. */
export function enemyColor(kind: string): string {
  return ENEMY_COLORS[kind] ?? palette.enemyUnknown;
}
