/**
 * IntroClipScene — one page inside IntroVideosScreen’s pager.
 *
 * - If introClips.js provides localSource (require) or remoteUri (https), shows react-native-video.
 * - Otherwise shows a “Video coming soon” placeholder with the clip caption + dev hint.
 * - isActive: when false, video is paused and loading state resets when user swipes away.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';

const C = UNIFIED_THEME.colors;

/** Prefer bundled file; else stream from remoteUri. */
function resolveSource(clip) {
  if (clip?.localSource) {
    return clip.localSource;
  }
  if (clip?.remoteUri) {
    return { uri: clip.remoteUri };
  }
  return null;
}

export default function IntroClipScene({ clip, isActive = false }) {
  const source = clip ? resolveSource(clip) : null;

  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(!!source);
  const [error, setError] = useState(false);

  useEffect(() => {
    setFocused(isActive);
    if (!isActive) {
      /* Next time user lands on this tab, show loader again until onLoad fires. */
      setLoading(!!source);
      setError(false);
    }
  }, [isActive, source]);

  if (!clip) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Clip not found.</Text>
      </View>
    );
  }

  /* No asset configured — designers/devs fill introClips.js */
  if (!source) {
    return (
      <View style={styles.wrap}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.2)', 'rgba(6, 6, 31, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholder}
        >
          <View style={styles.placeholderIcon}>
            <MaterialIcons name="movie-filter" size={52} color={C.accent.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Video coming soon</Text>
          <Text style={styles.placeholderBody}>{clip.caption}</Text>
          <Text style={styles.hint}>
            Add this clip in introClips.js (local file or HTTPS URL).
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.videoCard}>
        {loading && !error ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.accent.secondary} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color={C.accent.error} />
            <Text style={styles.errorText}>Could not play this video.</Text>
          </View>
        ) : (
          // paused when tab not focused — saves battery and avoids overlapping audio
          <Video
            source={source}
            style={styles.video}
            resizeMode="contain"
            controls
            paused={!focused}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            onLoadStart={() => {
              setLoading(true);
              setError(false);
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </View>
      <Text style={styles.caption}>{clip.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingTop: UNIFIED_THEME.spacing.md,
    paddingBottom: UNIFIED_THEME.spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muted: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: C.text.muted,
  },
  videoCard: {
    flex: 1,
    minHeight: 220,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: C.border.light,
    ...UNIFIED_THEME.shadows.medium,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 0, 20, 0.75)',
    zIndex: 2,
  },
  loadingText: {
    marginTop: UNIFIED_THEME.spacing.sm,
    ...UNIFIED_THEME.typography.bodySm,
    color: C.text.secondary,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.sm,
  },
  errorText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: C.text.secondary,
    textAlign: 'center',
  },
  caption: {
    marginTop: UNIFIED_THEME.spacing.md,
    ...UNIFIED_THEME.typography.bodySm,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
  },
  placeholder: {
    flex: 1,
    minHeight: 260,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.border.light,
    padding: UNIFIED_THEME.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  placeholderTitle: {
    ...UNIFIED_THEME.typography.headingSm,
    color: C.text.primary,
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },
  placeholderBody: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: C.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  hint: {
    ...UNIFIED_THEME.typography.labelSm,
    color: C.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
