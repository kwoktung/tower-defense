declare global {
  interface Window {
    /** The current story's `parameters.shots`, published for the Shots script. */
    __STORY_SHOTS__?: ShotsParameters | null;
  }
}

/** Per-story Shots settings, read by `pnpm shots`. */
export interface ShotsParameters {
  /**
   * Also shoot the story fast-forwarded by each of these tick counts (via the `advanceTicks`
   * arg), producing `<story-id>--t<ticks>.png`. Only meaningful for stories with that arg.
   */
  ticks?: number[];
}
