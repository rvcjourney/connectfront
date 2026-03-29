/**
 * Centralized API Error Handler
 * Provides consistent error handling, retry logic, and error formatting
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

class ApiErrorHandler {
  /**
   * Retry failed API request with exponential backoff
   */
  static async retryWithBackoff(fn, maxRetries = MAX_RETRIES) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries;
        const isNetworkError = this.isNetworkError(error);
        const shouldRetry = isNetworkError && !isLastAttempt;

        if (shouldRetry) {
          const delayMs = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn(
            `⚠️ API request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`,
            error.message
          );
          await this.delay(delayMs);
        } else {
          console.error(
            `❌ API request failed after ${attempt} attempts`,
            error
          );
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error) {
    const networkErrors = [
      "Network request failed",
      "ECONNREFUSED",
      "ECONNABORTED",
      "ETIMEDOUT",
      "EHOSTUNREACH",
      "ENETUNREACH",
      "ENOTFOUND",
    ];

    return networkErrors.some(
      (networkError) =>
        error.message?.includes(networkError) ||
        error.toString().includes(networkError)
    );
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error) {
    return (
      error.status === 400 ||
      error.message?.includes("Invalid") ||
      error.message?.includes("validation")
    );
  }

  /**
   * Check if error is authentication error
   */
  static isAuthError(error) {
    return (
      error.status === 401 ||
      error.status === 403 ||
      error.message?.includes("Unauthorized") ||
      error.message?.includes("authentication")
    );
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error) {
    if (this.isNetworkError(error)) {
      return "Network connection failed. Please check your internet connection and try again.";
    }

    if (this.isValidationError(error)) {
      return error.message || "Invalid input. Please check your data.";
    }

    if (this.isAuthError(error)) {
      return "Authentication failed. Please login again.";
    }

    return error.message || "Something went wrong. Please try again.";
  }

  /**
   * Delay utility for retry logic
   */
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log error for debugging
   */
  static logError(context, error) {
    const errorLog = {
      context,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      isNetworkError: this.isNetworkError(error),
    };

    console.error("📋 Error Log:", errorLog);

    // TODO: Send to external error tracking service
    // this.sendToErrorTracker(errorLog);
  }
}

export default ApiErrorHandler;
