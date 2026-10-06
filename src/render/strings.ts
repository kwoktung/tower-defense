/**
 * Every piece of text the player reads. The one source of display text: the Unit catalog and
 * the rest of the render layer hold none. English only for now; another language would be a
 * second object of the same type.
 */
export const en = {
  towerNames: { basic: 'Basic', splash: 'Splash', slow: 'Frost' } as Record<string, string>,
  level: (level: number) => `Lv${level}`,
  /** Lives, gold and wave are shown as icons plus numbers. */
  waveOf: (number: number, count: number) => `${number}/${count}`,
  startWave: 'Start',
  victory: 'Victory',
  defeat: 'Defeat',
  retry: 'Retry',
  stats: {
    damage: 'DMG',
    rate: 'RATE',
    range: 'RANGE',
    splash: 'SPLASH',
    slow: 'SLOW',
  },
  perSecond: (value: string) => `${value}/s`,
  seconds: (value: number) => `${value}s`,
  sell: (value: number) => `Sell +${value}`,
  confirmSell: (value: number) => `Confirm +${value}`,
  maxLevel: 'MAX',
};

export type Strings = typeof en;

export const strings: Strings = en;

/** A tower kind's display name; an unknown kind shows as itself. */
export function towerName(kind: string): string {
  return strings.towerNames[kind] ?? kind;
}
