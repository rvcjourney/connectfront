import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Button from "./Button";
import { UNIFIED_THEME } from "../unifiedTheme";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Optional: Send error to external logging service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // TODO: Implement error logging to service (Sentry, LogRocket, etc.)
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.toString(),
      stack: errorInfo.componentStack,
      userAgent: "React Native App",
    };

    console.log("📊 Error logged:", errorData);
    // Example: Send to logging service
    // fetch('https://your-logging-service.com/errors', {
    //   method: 'POST',
    //   body: JSON.stringify(errorData)
    // });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Reset navigation to home
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>

            {/* Error Title */}
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>

            {/* Error Message */}
            <Text style={styles.errorMessage}>
              {this.state.error?.toString() || "An unexpected error occurred"}
            </Text>

            {/* Error Details (Dev only) */}
            {__DEV__ && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Error Details:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.detailsScroll}
                >
                  <Text style={styles.detailsText}>
                    {this.state.errorInfo?.componentStack}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* Error Count */}
            {this.state.errorCount > 1 && (
              <Text style={styles.errorCountText}>
                Error occurred {this.state.errorCount} times
              </Text>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <Button
              text="Try Again"
              variant="primary"
              onPress={this.handleReset}
              style={styles.actionBtn}
            />
            <Button
              text="Go Home"
              variant="outline"
              onPress={this.handleGoHome}
              style={styles.actionBtn}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorIconContainer: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  errorIcon: {
    fontSize: 60,
  },
  errorTitle: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.md,
    textAlign: "center",
  },
  errorMessage: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: "center",
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginVertical: UNIFIED_THEME.spacing.lg,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  detailsTitle: {
    ...UNIFIED_THEME.typography.labelMd,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  detailsScroll: {
    maxHeight: 120,
  },
  detailsText: {
    ...UNIFIED_THEME.typography.bodyXs,
    color: UNIFIED_THEME.colors.accent.secondary,
    lineHeight: 16,
  },
  errorCountText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.warning,
    marginTop: UNIFIED_THEME.spacing.md,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: UNIFIED_THEME.spacing.md,
    marginTop: UNIFIED_THEME.spacing.xl,
  },
  actionBtn: { flex: 1, marginVertical: 0 },
});
