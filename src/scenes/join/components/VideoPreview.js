import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { RTCView } from "@videosdk.live/react-native-sdk";
import {
  MicOff,
  MicOn,
  VideoOff,
  VideoOn,
} from "../../../assets/icons";
import { UNIFIED_THEME } from "../../../unifiedTheme";

export const VideoPreview = ({
  tracks,
  videoOn,
  onToggleVideo,
  micOn,
  onToggleMic,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        {videoOn && tracks ? (
          <RTCView
            streamURL={tracks.toURL()}
            objectFit={"cover"}
            mirror={true}
            style={styles.rtcView}
          />
        ) : (
          <View style={styles.cameraOffContainer}>
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={onToggleMic}
            style={[
              styles.controlButton,
              {
                backgroundColor: micOn
                  ? UNIFIED_THEME.colors.accent.primary
                  : UNIFIED_THEME.colors.accent.error,
              },
            ]}
          >
            {micOn ? (
              <MicOn width={25} height={25} fill={UNIFIED_THEME.colors.text.onAccent} />
            ) : (
              <MicOff
                width={25}
                height={25}
                fill={UNIFIED_THEME.colors.text.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onToggleVideo}
            style={[
              styles.controlButton,
              {
                backgroundColor: videoOn
                  ? UNIFIED_THEME.colors.accent.primary
                  : UNIFIED_THEME.colors.accent.error,
              },
            ]}
          >
            {videoOn ? (
              <VideoOn width={25} height={25} fill={UNIFIED_THEME.colors.text.onAccent} />
            ) : (
              <VideoOff
                width={35}
                height={35}
                fill={UNIFIED_THEME.colors.text.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: "5%",
    height: "45%",
  },
  videoWrapper: {
    flex: 1,
    width: "50%",
    alignSelf: "center",
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },
  rtcView: {
    flex: 1,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
  },
  cameraOffContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },
  cameraOffText: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  controlsContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: UNIFIED_THEME.spacing.md,
    right: 0,
    left: 0,
  },
  controlButton: {
    height: 50,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    ...UNIFIED_THEME.shadows.medium,
  },
});
