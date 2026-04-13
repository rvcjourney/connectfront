/**
 * Intro carousel content (order = tab order in IntroVideosScreen).
 *
 * Each object: stable `route` key, optional `tabLabel`/`tabIcon` (reserved for future UI),
 * `caption` under the player, and either:
 *   - localSource: require('...mp4')  (bundle under src/assets/videos/ recommended), or
 *   - remoteUri: 'https://...mp4'
 * If both are null, IntroClipScene shows the “Video coming soon” placeholder.
 */
export const APP_DISPLAY_NAME = 'Connectiqo';

/** Stable route keys — must stay in sync with TabView routes built from INTRO_CLIPS. */
export const INTRO_CLIP_ROUTES = {
  overview: 'IntroClip_Overview',
  sessions: 'IntroClip_Sessions',
  mentors: 'IntroClip_Mentors',
  start: 'IntroClip_GetStarted',
};

export const INTRO_CLIPS = [
  {
    route: INTRO_CLIP_ROUTES.overview,
    tabLabel: 'Overview',
    tabIcon: 'explore',
    remoteUri: null,
    localSource: null,
    caption: 'See what Connectiqo is and how it fits your goals.',
  },
  {
    route: INTRO_CLIP_ROUTES.sessions,
    tabLabel: 'Sessions',
    tabIcon: 'video-library',
    remoteUri: null,
    localSource: null,
    caption: 'Live video sessions and how booking works.',
  },
  {
    route: INTRO_CLIP_ROUTES.mentors,
    tabLabel: 'Mentors',
    tabIcon: 'school',
    remoteUri: null,
    localSource: null,
    caption: 'Finding mentors and learning with confidence.',
  },
  {
    route: INTRO_CLIP_ROUTES.start,
    tabLabel: 'Get started',
    tabIcon: 'stars',
    remoteUri: null,
    localSource: null,
    caption: 'Your first steps after signing up.',
  },
];
