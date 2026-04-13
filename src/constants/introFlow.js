/**
 * Which entry path opened IntroVideosScreen — used when leaving:
 * - POST_AUTH: set AsyncStorage “intro seen” for user, then replace → main tabs.
 * - PRE_AUTH: go back or replace → Welcome (no storage key).
 */
export const INTRO_FLOW = {
  PRE_AUTH: 'preAuth',
  POST_AUTH: 'postAuth',
};
