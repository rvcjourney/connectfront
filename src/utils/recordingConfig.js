/**
 * VideoSDK cloud recording layout for 1-on-1 mentoring calls.
 * GRID + gridSize 2 → equal 50/50 split of both cameras (landscape).
 * @see https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/recording-and-live-streaming/record-meeting
 */
export const ONE_TO_ONE_RECORDING_CONFIG = {
  layout: {
    type: 'GRID',
    priority: 'SPEAKER',
    gridSize: 2,
  },
  theme: 'DARK',
  mode: 'video-and-audio',
  quality: 'high',
  orientation: 'landscape',
};

/** Pass null webhook/aws paths so VideoSDK applies the layout config. */
export function startOneToOneRecording(startRecording) {
  startRecording(null, null, ONE_TO_ONE_RECORDING_CONFIG);
}
