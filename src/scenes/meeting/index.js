import React, { useEffect, useState } from "react";
import { Platform, NativeModules, PermissionsAndroid, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MeetingConsumer,
  MeetingProvider,
} from "@videosdk.live/react-native-sdk";
import { UNIFIED_THEME } from "../../unifiedTheme";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import MeetingContainer from "./MeetingContainer";
import { SCREEN_NAMES } from "../../navigators/screenNames";

const { ForegroundServiceModule } = NativeModules;

const requestPermissions = async () => {
  if (Platform.OS !== "android") return true;

  try {
    // Core permissions required for video call
    const corePermissions = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ];

    // Optional: POST_NOTIFICATIONS (may not exist on older Android versions)
    const optionalPermissions = [];
    if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      optionalPermissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const allPermissions = [...corePermissions, ...optionalPermissions];


    const granted = await PermissionsAndroid.requestMultiple(allPermissions);


    // Check if core permissions are granted
    const coreGranted = corePermissions.every(
      (permission) => granted[permission] === PermissionsAndroid.RESULTS.GRANTED
    );

    if (coreGranted) {
      return true;
    } else {
      // Log which permissions were denied
      corePermissions.forEach((perm) => {
      });
      return false;
    }
  } catch (err) {
    console.error("❌ Error requesting permissions:", err);
    return false;
  }
};

export default function ({ navigation, route }) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const {
    token,
    meetingId,
    micEnabled,
    webcamEnabled,
    name,
    meetingType,
    defaultCamera,
  } = route.params;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const granted = await requestPermissions();
      if (isMounted) setPermissionsGranted(granted);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMeetingJoined = async () => {
    if (permissionsGranted) {
      if (Platform.OS === "android") {
        setTimeout(async () => {
          try {
            await ForegroundServiceModule.startService();
          } catch (err) {
            console.error("[Error starting foreground service:", err);
          }
        }, 300);
      }
    }
  };

  const handleMeetingLeft = () => {
    if (Platform.OS === "android") {
      ForegroundServiceModule.stopService();
    }
    navigation.navigate(SCREEN_NAMES.Join);
  };

  if (Platform.OS === "android" && !permissionsGranted) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={styles.safeArea}
      >
        <LoadingOverlay
          visible={true}
          message="Requesting permissions"
          backdropOpacity={0}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={styles.safeArea}
    >
      <MeetingProvider
        config={{
          meetingId: meetingId,
          micEnabled: micEnabled,
          webcamEnabled: webcamEnabled,
          name: name,
          notification: {
            title: "Video SDK Meeting",
            message: "Meeting is running.",
          },
          defaultCamera: defaultCamera,
        }}
        token={token}
      >
        <MeetingConsumer
          onMeetingJoined={handleMeetingJoined}
          onMeetingLeft={handleMeetingLeft}
        >
          {() => (
            <MeetingContainer
              webcamEnabled={webcamEnabled}
              meetingType={meetingType}
            />
          )}
        </MeetingConsumer>
      </MeetingProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    padding: UNIFIED_THEME.spacing.md,
  },
});
