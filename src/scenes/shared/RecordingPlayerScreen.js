import React, { useMemo, useState } from 'react';
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
import { UNIFIED_THEME } from '../../unifiedTheme';
import { normalizeRecordingUrl } from '../../api/api';

const T = UNIFIED_THEME;

export default function RecordingPlayerScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sourceUrl = useMemo(() => {
    const rawUrl = route?.params?.recordingUrl;
    return normalizeRecordingUrl(rawUrl);
  }, [route?.params?.recordingUrl]);

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
        <Text style={styles.title}>Session Recording</Text>
      </View>

      <View style={styles.playerCard}>
        {!sourceUrl ? (
          <View style={styles.centered}>
            <MaterialIcons
              name="error-outline"
              size={42}
              color={T.colors.accent.error}
            />
            <Text style={styles.errorText}>Recording URL is unavailable.</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialIcons
              name="error-outline"
              size={42}
              color={T.colors.accent.error}
            />
            <Text style={styles.errorText}>Could not load this recording.</Text>
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
    justifyContent: 'space-between',
    marginBottom: T.spacing.md,
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
    fontWeight: '700',
  },
  playerCard: {
    flex: 1,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    backgroundColor: 'rgba(0,0,0,0.85)',
    overflow: 'hidden',
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
