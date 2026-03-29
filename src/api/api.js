import { REACT_APP_AUTH_URL } from "@env";
import ApiErrorHandler from "../utils/apiErrorHandler";

const API_BASE_URL = "https://api.videosdk.live/v2";
const API_AUTH_URL = REACT_APP_AUTH_URL;

export const getToken = async () => {
  try {
    if (!API_AUTH_URL) {
      throw new Error("REACT_APP_AUTH_URL not configured. Please set it in .env file");
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
