import { REACT_APP_AUTH_URL, AUTH_URL, VIDEO_SDK_AUTH_URL } from "@env";
import ApiErrorHandler from "../utils/apiErrorHandler";

const API_BASE_URL = "https://api.videosdk.live/v2";
const VIDEO_SDK_CDN_BASE = "https://cdn.videosdk.live/";
const API_AUTH_URL = (
  REACT_APP_AUTH_URL ||
  AUTH_URL ||
  VIDEO_SDK_AUTH_URL ||
  ""
).trim();

export const getToken = async () => {
  try {
    if (!API_AUTH_URL) {
      throw new Error(
        "REACT_APP_AUTH_URL not configured. Please set REACT_APP_AUTH_URL (or AUTH_URL / VIDEO_SDK_AUTH_URL) in .env file"
      );
    }

    console.log(`📡 Fetching token from: ${API_AUTH_URL}/get-token`);

    const token = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const res = await fetch(`${API_AUTH_URL}/get-token`, {
          method: "GET",
          timeout: 10000, // 10 second timeout
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return data.token;
      },
      3 // Max retries
    );

    console.log("✅ Token received successfully");
    return token;
  } catch (error) {
    ApiErrorHandler.logError("getToken", error);
    const userMessage = ApiErrorHandler.formatErrorMessage(error);
    const apiError = new Error(userMessage);
    apiError.originalError = error;
    throw apiError;
  }
};

export const createMeeting = async ({ token }) => {
  try {
    if (!token) {
      throw new Error("Token is required to create a meeting");
    }

    console.log("📝 Creating meeting...");

    const roomId = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const url = `${API_BASE_URL}/rooms`;
        const options = {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return data.roomId;
      },
      2 // Max retries (fewer for POST)
    );

    console.log("✅ Meeting created. Room ID:", roomId);
    return roomId;
  } catch (error) {
    ApiErrorHandler.logError("createMeeting", error);
    const userMessage = ApiErrorHandler.formatErrorMessage(error);
    const apiError = new Error(userMessage);
    apiError.originalError = error;
    throw apiError;
  }
};

export const validateMeeting = async ({ meetingId, token }) => {
  try {
    if (!meetingId || !token) {
      throw new Error("meetingId and token are required");
    }

    console.log(`🔍 Validating meeting: ${meetingId}`);

    const isValid = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const url = `${API_BASE_URL}/rooms/validate/${meetingId}`;
        const options = {
          method: "GET",
          headers: { Authorization: token },
          timeout: 10000, // 10 second timeout
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`⚠️ Meeting not found: ${meetingId}`);
            return false;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result && result.roomId === meetingId;
      },
      2 // Max retries
    );

    console.log(isValid ? "✅ Meeting is valid" : "❌ Meeting is invalid");
    return isValid;
  } catch (error) {
    ApiErrorHandler.logError("validateMeeting", error);
    console.error("❌ validateMeeting Error:", error.message);
    return false;
  }
};

export const fetchSession = async ({ meetingId, token }) => {
  try {
    if (!meetingId || !token) {
      throw new Error("meetingId and token are required");
    }

    const session = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const url = `${API_BASE_URL}/sessions?roomId=${meetingId}`;
        const options = {
          method: "GET",
          headers: { Authorization: token },
          timeout: 10000,
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result?.data?.[0] || null;
      },
      2 // Max retries
    );

    return session;
  } catch (error) {
    ApiErrorHandler.logError("fetchSession", error);
    console.error("❌ fetchSession Error:", error.message);
    return null;
  }
};

const fetchSessionsByRoom = async ({ meetingId, token }) => {
  try {
    if (!meetingId || !token) return [];

    const sessions = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const url = `${API_BASE_URL}/sessions?roomId=${meetingId}`;
        const options = {
          method: "GET",
          headers: { Authorization: token },
          timeout: 10000,
        };

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      },
      2
    );

    return sessions;
  } catch (error) {
    ApiErrorHandler.logError("fetchSessionsByRoom", error);
    return [];
  }
};

const fetchRecordingById = async ({ recordingId, token }) => {
  try {
    if (!recordingId || !token) return null;

    const recording = await ApiErrorHandler.retryWithBackoff(
      async () => {
        const response = await fetch(`${API_BASE_URL}/recordings/${recordingId}`, {
          method: "GET",
          headers: { Authorization: token },
          timeout: 10000,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
      2
    );

    return recording || null;
  } catch (error) {
    ApiErrorHandler.logError("fetchRecordingById", error);
    return null;
  }
};

const pickRecordingUrlFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  return (
    obj.fileUrl ||
    obj.file_url ||
    obj.playbackUrl ||
    obj.playback_url ||
    obj.downloadUrl ||
    obj.url ||
    obj.hlsUrl ||
    obj.hls_url ||
    obj.filePath ||
    obj.file_path ||
    null
  );
};

export const normalizeRecordingUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const relativePath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${VIDEO_SDK_CDN_BASE}${relativePath}`;
};

export const fetchRecordingUrl = async ({ meetingId, token }) => {
  try {
    if (!meetingId || !token) return null;

    const sessions = await fetchSessionsByRoom({ meetingId, token });
    if (!sessions.length) return null;

    const sortedSessions = [...sessions].sort((a, b) => {
      const aTime = new Date(a?.end || a?.start || 0).getTime();
      const bTime = new Date(b?.end || b?.start || 0).getTime();
      return bTime - aTime;
    });

    for (const session of sortedSessions) {
      const recordingLog = Array.isArray(session?.recordingLog)
        ? session.recordingLog
        : [];

      // 1) Try direct URLs if the session payload already has them.
      const fromDirect =
        pickRecordingUrlFromObject(session.recording) ||
        pickRecordingUrlFromObject(session.recordings);
      if (fromDirect) return normalizeRecordingUrl(fromDirect);

      // 2) Use recording IDs from recordingLog and fetch details.
      for (let i = recordingLog.length - 1; i >= 0; i -= 1) {
        const recordingId = recordingLog[i]?.recordingId;
        if (!recordingId) continue;

        const recording = await fetchRecordingById({ recordingId, token });
        const url =
          pickRecordingUrlFromObject(recording?.file) ||
          pickRecordingUrlFromObject(recording);
        if (url) return normalizeRecordingUrl(url);
      }

      // 3) Legacy fallback fields.
      if (Array.isArray(session.recordings) && session.recordings.length > 0) {
        for (const item of session.recordings) {
          const url = pickRecordingUrlFromObject(item);
          if (url) return normalizeRecordingUrl(url);
        }
      }

      if (Array.isArray(session.files) && session.files.length > 0) {
        for (const item of session.files) {
          const url = pickRecordingUrlFromObject(item);
          if (url) return normalizeRecordingUrl(url);
        }
      }
    }

    return null;
  } catch (error) {
    ApiErrorHandler.logError("fetchRecordingUrl", error);
    return null;
  }
};
