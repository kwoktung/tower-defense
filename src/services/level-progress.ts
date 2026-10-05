import { z } from 'zod';

/** A player's best finished game on one level — the single definition of its shape. */
export const LevelProgressSchema = z.object({
  bestOutcome: z.enum(['won', 'lost']),
  /** Lives left when that best result was reached. */
  bestLivesLeft: z.int().nonnegative(),
  /** ISO timestamp of when the stored result was recorded. */
  updatedAt: z.string(),
});

export type LevelProgress = z.infer<typeof LevelProgressSchema>;

/** A finished game as reported to the ProgressStore; it adds the timestamp. */
export type GameResult = Pick<LevelProgress, 'bestOutcome' | 'bestLivesLeft'>;
