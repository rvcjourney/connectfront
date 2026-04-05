/**
 * Intro video tabs — set `localSource` and/or `remoteUri` per clip.
 * Bundled: add files under src/assets/videos/ and use
 *   localSource: require('../assets/videos/your-clip.mp4'),
 * Remote: remoteUri: 'https://example.com/clip.mp4'
 */
export const APP_DISPLAY_NAME = 'Connectiqo';

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
