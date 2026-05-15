/**
 * Optional static payload for local UI experiments (not used by MentorProfileScreen).
 * The profile screen loads live data via profileApi, videoApi, and bookingApi.
 */
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const THUMB = seed =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/304/240`;

export function buildMentorProfileUiState(params = {}) {
  const mentorId = params?.mentorId || 'ui-preview-mentor';
  const displayName = params?.mentorName?.trim() || 'Ananya Sharma';

  const mentor = {
    id: mentorId,
    specialization: 'Content Creator & Social Media Strategist',
    bio:
      'Helping brands and creators grow online with proven content strategies that get real results.',
    experience_years: 6,
    price_per_hour: 2500,
    rating: 4.9,
    total_sessions: 1200,
    /** Shown in stats row to match catalog scale (falls back to videos.length). */
    published_video_count: 240,
    /** First chips on profile; rest implied by `+N` in UI. */
    tags: [
      'Content Strategy',
      'Social Media',
      'Branding',
      'Growth',
      'Analytics',
      'Storytelling',
    ],
    profiles: {
      name: displayName,
      email: 'mentor@example.com',
      avatar_url: `https://i.pravatar.cc/280?u=${encodeURIComponent(mentorId)}`,
    },
  };

  const videos = [
    {
      id: 'v1',
      title: '3 Content Ideas You Can Post Today',
      thumbnail_url: THUMB('nav1'),
      video_url: SAMPLE_VIDEO,
      is_free: true,
      duration_sec: 612,
    },
    {
      id: 'v2',
      title: 'Hook formulas that stop the scroll',
      thumbnail_url: THUMB('list2'),
      video_url: SAMPLE_VIDEO,
      is_free: true,
      duration_sec: 445,
    },
    {
      id: 'v2b',
      title: 'Repurpose one shoot into a week of posts',
      thumbnail_url: THUMB('repurpose'),
      video_url: SAMPLE_VIDEO,
      is_free: true,
      duration_sec: 721,
    },
    {
      id: 'v3',
      title: 'Advanced Content Strategy Framework',
      thumbnail_url: THUMB('state3'),
      video_url: SAMPLE_VIDEO,
      is_free: false,
      duration_sec: 1104,
    },
    {
      id: 'v4',
      title: 'Brand voice that converts',
      thumbnail_url: THUMB('ship4'),
      video_url: SAMPLE_VIDEO,
      is_free: false,
      duration_sec: 892,
    },
    {
      id: 'v5',
      title: 'Campaign teardown: what actually worked',
      thumbnail_url: THUMB('campaign5'),
      video_url: SAMPLE_VIDEO,
      is_free: false,
      duration_sec: 1240,
    },
  ];

  const pastSessions = [
    {
      id: 'ps1',
      student_name: 'Neha Verma',
      topic: 'Instagram Growth Strategy',
      date_label: '18 May 2024',
      rating: 5.0,
      student_avatar_url: THUMB('student-neha'),
    },
  ];

  return {
    mentor,
    videos,
    pastSessions,
    unlockPrice: 299,
  };
}
