import Toast from 'react-native-simple-toast';
import { downloadRecordingToGallery } from './downloadRecording';

let downloadInProgress = false;

/**
 * Download a recording and save it to the device gallery, with toast feedback.
 * @param {string} recordingUrl
 * @returns {Promise<{ ok: boolean, error?: Error }>}
 */
export async function saveRecordingToGallery(recordingUrl) {
  if (downloadInProgress) {
    Toast.show('Download already in progress', Toast.SHORT);
    return { ok: false };
  }

  downloadInProgress = true;
  Toast.show('Downloading recording…', Toast.SHORT);

  try {
    await downloadRecordingToGallery(recordingUrl);
    Toast.show('Saved to gallery', Toast.SHORT);
    return { ok: true };
  } catch (error) {
    const message =
      error?.message || 'Could not save recording. Check connection and try again.';
    Toast.show(message, Toast.SHORT);
    console.warn('saveRecordingToGallery:', error);
    return { ok: false, error };
  } finally {
    downloadInProgress = false;
  }
}
