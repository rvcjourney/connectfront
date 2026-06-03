import { SafeScreen } from '../../components/SafeScreen';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { launchImageLibrary } from 'react-native-image-picker';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';
import { videoApi } from '../../api/videoApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { formatDate } from '../../utils/dateHelpers';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;

const PANEL_BG = '#161432';
const SHEET_BG = '#0f0e2a';

function SectionHeaderRow({ title, count }) {
  return (
    <View style={styles.secHdrRow}>
      <Text style={styles.secHdrTitle}>{title}</Text>
      {count != null ? (
        <View style={styles.secHdrCount}>
          <Text style={styles.secHdrCountText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MenuRow({ icon, accent, label, onPress, noBorder }) {
  const iconColor = accent === 'gold' ? GOLD : accent === 'teal' ? TEAL : PURPLE_LINK;

  return (
    <TouchableOpacity
      style={[styles.menuItem, noBorder && styles.noBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.menuLeft}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={C.text.muted} />
    </TouchableOpacity>
  );
}

export default function UnifiedSettingsScreen({ navigation }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

  const loadSubscriptions = useCallback(async () => {
    if (!profile?.id) {
      setSubscriptions([]);
      return;
    }
    setSubsLoading(true);
    try {
      const rows = await videoApi.getLearnerActiveSubscriptionsDetail(profile.id);
      setSubscriptions(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.warn('UnifiedSettings: subscriptions load failed', e?.message || e);
      setSubscriptions([]);
      Toast.show('Could not load subscriptions');
    } finally {
      setSubsLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions])
  );

  const goToVideos = useCallback(() => {
    navigation.navigate(SCREEN_NAMES.LearnerSection, {
      screen: SCREEN_NAMES.LearnerVideos,
    });
  }, [navigation]);

  const openMentor = useCallback(
    mentorId => {
      navigation.navigate(SCREEN_NAMES.MentorProfile, { mentorId });
    },
    [navigation]
  );

  const handlePickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, includeBase64: true },
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.base64) return;
        try {
          setLoading(true);
          const url = await profileApi.uploadAvatar({
            userId: profile.id,
            base64: asset.base64,
            mimeType: asset.type || 'image/jpeg',
            fileName: asset.fileName || 'avatar.jpg',
          });
          setAvatarUrl(url);
          await refreshProfile();
          Toast.show('Photo updated');
        } catch {
          Toast.show('Failed to upload photo');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Toast.show('Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <SafeScreen scrollable={false} padding={T.spacing.lg} hasBottomTabs={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={B.premiumGradient} style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {avatarUrl ? (
                    <Image key={avatarUrl} source={{ uri: avatarUrl, cache: 'reload' }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <MaterialIcons name="person" size={36} color={PURPLE_LINK} />
                    </View>
                  )}
                </View>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={loading}>
                <MaterialIcons name="camera-alt" size={14} color={C.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
              {profile?.username ? (
                <Text style={styles.profileUsername}>@{profile.username}</Text>
              ) : null}
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.badge}>
                <MaterialIcons name="workspace-premium" size={12} color={GOLD} />
                <Text style={styles.badgeText}>Mentor & Learner</Text>
              </View>
            </View>
          </View>
        </View>

        <SectionHeaderRow title="Video subscriptions" count={subscriptions.length || null} />
        <View style={styles.subsCard}>
          {subsLoading ? (
            <View style={styles.subsLoading}>
              <ActivityIndicator size="small" color={TEAL} />
              <Text style={styles.subsLoadingText}>Checking subscriptions…</Text>
            </View>
          ) : subscriptions.length === 0 ? (
            <View style={styles.subsEmptyWrap}>
              <MaterialIcons name="subscriptions" size={28} color={PURPLE_LINK} />
              <Text style={styles.subsEmpty}>
                No active video library subscriptions. Subscribe from a mentor’s profile or open{' '}
                <Text style={styles.subsEmptyEm}>Learner → Videos</Text>.
              </Text>
            </View>
          ) : (
            subscriptions.map(row => {
              const m = row.profiles;
              const name = m?.name || 'Mentor';
              const expLabel = row.expires_at
                ? `Access until ${formatDate(row.expires_at)}`
                : 'Full access active';
              return (
                <TouchableOpacity
                  key={`${row.mentor_id}`}
                  style={styles.subsRow}
                  onPress={() => openMentor(row.mentor_id)}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={B.premiumGradient} style={styles.subsAvatarRing}>
                    <View style={styles.subsAvatarInner}>
                      {m?.avatar_url ? (
                        <Image source={{ uri: m.avatar_url }} style={styles.subsAvatar} />
                      ) : (
                        <View style={[styles.subsAvatar, styles.subsAvatarPh]}>
                          <MaterialIcons name="person" size={20} color={PURPLE_LINK} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  <View style={styles.subsMeta}>
                    <Text style={styles.subsName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.subsExpiry} numberOfLines={1}>{expLabel}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={C.text.muted} />
                </TouchableOpacity>
              );
            })
          )}
          {!subsLoading && (
            <TouchableOpacity style={styles.subsExplore} onPress={goToVideos} activeOpacity={0.8}>
              <MaterialIcons name="play-circle-outline" size={18} color={TEAL} />
              <Text style={styles.subsExploreText}>Open Videos tab</Text>
            </TouchableOpacity>
          )}
        </View>

        <SectionHeaderRow title="Account" />
        <View style={styles.card}>
          <MenuRow
            icon="edit"
            accent="gold"
            label="Edit Profile"
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
          />
          <MenuRow icon="notifications" accent="purple" label="Notifications" />
          <MenuRow
            icon="account-balance-wallet"
            accent="gold"
            label="My Wallet"
            onPress={() => navigation.navigate(SCREEN_NAMES.Wallet)}
          />
          <MenuRow
            icon="account-balance"
            accent="teal"
            label="Payout Setup"
            onPress={() => navigation.navigate(SCREEN_NAMES.PayoutSetup)}
          />
          <MenuRow
            icon="history"
            accent="purple"
            label="Transaction history"
            onPress={() => navigation.navigate(SCREEN_NAMES.TransactionHistory)}
          />
          <MenuRow
            icon="video-library"
            accent="gold"
            label="Recorded lectures"
            onPress={() => navigation.navigate(SCREEN_NAMES.RecordedLectures)}
          />
          <MenuRow
            icon="video-camera-back"
            accent="teal"
            label="My Videos"
            onPress={() => navigation.navigate(SCREEN_NAMES.MentorVideos)}
          />
          <MenuRow icon="privacy-tip" accent="purple" label="Privacy Policy" />
          <MenuRow icon="contact-support" accent="gold" label="Help & Support" noBorder />
        </View>

        <Button
          text="Sign Out"
          onPress={handleLogout}
          variant="goldOutline"
          style={styles.signOutBtn}
        />
      </ScrollView>

      <LoadingOverlay visible={loading} message="Uploading..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: T.spacing.xxxl,
  },
  screenTitle: {
    fontSize: 22,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.lg,
  },
  secHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.sm,
    paddingHorizontal: T.spacing.xs,
  },
  secHdrTitle: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '800',
  },
  secHdrCount: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: S.accentViolet,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    alignItems: 'center',
  },
  secHdrCountText: {
    fontSize: 12,
    color: PURPLE_LINK,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.lg,
  },
  avatarWrapper: { position: 'relative' },
  avatarRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary.void,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PANEL_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  profileMeta: { flex: 1 },
  profileName: {
    fontSize: 18,
    color: C.text.primary,
    fontWeight: '800',
    marginBottom: T.spacing.xs,
  },
  profileUsername: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    marginBottom: T.spacing.xs,
  },
  profileEmail: {
    fontSize: 13,
    color: C.text.secondary,
    marginBottom: T.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: S.accentGold,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  badgeText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '700',
  },
  card: {
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.15)',
  },
  noBorder: { borderBottomWidth: 0 },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
  },
  menuLabel: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '600',
  },
  signOutBtn: { marginBottom: T.spacing.xxxl },
  subsCard: {
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    padding: T.spacing.lg,
    marginBottom: T.spacing.lg,
  },
  subsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.sm,
  },
  subsLoadingText: {
    fontSize: 13,
    color: C.text.secondary,
  },
  subsEmptyWrap: {
    alignItems: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.sm,
  },
  subsEmpty: {
    fontSize: 13,
    color: C.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  subsEmptyEm: {
    color: TEAL,
    fontWeight: '700',
  },
  subsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.15)',
    gap: T.spacing.md,
  },
  subsAvatarRing: {
    padding: 2,
    borderRadius: 24,
  },
  subsAvatarInner: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  subsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary.void,
  },
  subsAvatarPh: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsMeta: { flex: 1, minWidth: 0 },
  subsName: {
    fontSize: 15,
    color: C.text.primary,
    fontWeight: '700',
  },
  subsExpiry: {
    fontSize: 12,
    color: C.text.muted,
    marginTop: 2,
  },
  subsExplore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
    backgroundColor: S.accentTeal,
  },
  subsExploreText: {
    fontSize: 13,
    color: TEAL,
    fontWeight: '700',
  },
});
