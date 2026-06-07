import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { normalizeRecordingUrl } from '../../api/api';
import { saveRecordingToGallery } from '../../utils/recordingActions';

const T = UNIFIED_THEME;

export default function RecordingPlayerScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const sourceUrl = useMemo(() => {
    const rawUrl = route?.params?.recordingUrl;
    return normalizeRecordingUrl(rawUrl);
  }, [route?.params?.recordingUrl]);

  const handleDownload = useCallback(async () => {
    if (!sourceUrl || downloading) return;
    setDownloading(true);
    try {
      await saveRecordingToGallery(sourceUrl);
    } finally {
      setDownloading(false);
    }
  }, [downloading, sourceUrl]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <MaterialIcons name="arrow-back" size={20} color={T.colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Session Recording</Text>
          <Text style={styles.subtitle}>Watch and review this session</Text>
        </View>
        {sourceUrl ? (
          <TouchableOpacity
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.85}
            accessibilityLabel="Download recording to gallery"
          >
            {downloading ? (
              <ActivityIndicator size="small" color={T.colors.accent.secondary} />
            ) : (
              <MaterialIcons
                name="file-download"
                size={22}
                color={T.colors.accent.secondary}
              />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightPad} />
        )}
      </View>

      <View style={styles.playerCard}>
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playerGlow}
          pointerEvents="none"
        />
        {!sourceUrl ? (
          <View style={styles.centered}>
            <MaterialIcons
              name="error-outline"
              size={42}
              color={T.colors.accent.error}
            />
            <Text style={styles.errorText}>Recording URL is unavailable.</Text>
            <Text style={styles.errorHint}>Please return and try opening it again.</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialIcons
              name="error-outline"
              size={42}
              color={T.colors.accent.error}
            />
            <Text style={styles.errorText}>Could not load this recording.</Text>
            <Text style={styles.errorHint}>Check your connection and retry.</Text>
          </View>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="large"
                  color={T.colors.accent.secondary}
                />
                <Text style={styles.loadingText}>Loading recording...</Text>
              </View>
            ) : null}
            <Video
              source={{ uri: sourceUrl }}
              style={styles.video}
              controls
              resizeMode="contain"
              paused={false}
              playInBackground={false}
              playWhenInactive={false}
              onLoadStart={() => {
                setLoading(true);
                setError(false);
              }}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error('Recording player error:', e);
                setLoading(false);
                setError(true);
              }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: T.colors.primary.void,
    padding: T.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: T.spacing.md,
    gap: T.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
  },
  backText: {
    ...T.typography.bodySm,
    color: T.colors.text.primary,
    fontWeight: '700',
  },
  title: {
    ...T.typography.labelMd,
    color: T.colors.text.primary,
    fontWeight: '800',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.spacing.sm,
  },
  subtitle: {
    ...T.typography.bodyXs,
    color: T.colors.text.muted,
    marginTop: 2,
  },
  headerRightPad: {
    width: 36,
  },
  downloadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: T.borderRadius.sm,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: T.colors.component.card,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  playerCard: {
    flex: 1,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: 'rgba(0,0,0,0.85)',
    overflow: 'hidden',
  },
  playerGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: T.spacing.lg,
    gap: T.spacing.sm,
  },
  errorText: {
    ...T.typography.bodyMd,
    color: T.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorHint: {
    ...T.typography.bodySm,
    color: T.colors.text.muted,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 0, 20, 0.7)',
  },
  loadingText: {
    marginTop: T.spacing.sm,
    ...T.typography.bodySm,
    color: T.colors.text.secondary,
  },
});
