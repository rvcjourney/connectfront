export const SCREEN_NAMES = {
  // Existing (preserve)
  Join: "Join_Screen",
  Meeting: "Meeting_Screen",

  // Auth
  Welcome: "Welcome_Screen",
  Signup: "Signup_Screen",
  Login: "Login_Screen",
  IntroVideos: "IntroVideos_Screen",

  /** Root stack — main tabs (must match RootNavigator screen name) */
  RootUnifiedTabs: "UnifiedTabs",
  /** Shown once per user after login until Skip / close */
  PostLoginIntro: "PostLoginIntro_Screen",

  // Unified bottom tabs
  UnifiedHome: "UnifiedHome_Screen",
  MentorSection: "MentorSection_Screen",
  LearnerSection: "LearnerSection_Screen",
  UnifiedSettings: "UnifiedSettings_Screen",

  // Mentor top tabs
  MentorDashboard: "MentorDashboard_Tab",
  MentorCalls: "MentorCalls_Tab",
  MentorEarnings: "MentorEarnings_Tab",
  MentorAvailabilityTab: "MentorAvailability_Tab",

  // Learner top tabs
  LearnerSearch: "LearnerSearch_Tab",
  LearnerBookings: "LearnerBookings_Tab",

  // Modal overlays (shared)
  EditProfile: "EditProfile_Screen",
  MentorProfile: "MentorProfile_Screen",
  Booking: "Booking_Screen",
  VideoCall: "VideoCall_Screen",
  RecordingPlayer: "RecordingPlayer_Screen",
  MentorAvailability: "MentorAvailability_Screen",
};
