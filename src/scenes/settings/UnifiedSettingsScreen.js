import { SafeScreen } from '../../components/SafeScreen';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { launchImageLibrary } from 'react-native-image-picker';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

export default function UnifiedSettingsScreen({ navigation }) {
  const { profile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

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
    <SafeScreen scrollable={false} padding={UNIFIED_THEME.spacing.lg} hasBottomTabs={false}>
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.16)',
            'rgba(94, 234, 212, 0.1)',
            'rgba(2, 0, 20, 0.45)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.eyebrow}>Preferences</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account, content, and support options.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={40} color="#FFF" />
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={loading}>
                <MaterialIcons name="camera-alt" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.badge}>
                <MaterialIcons name="workspace-premium" size={12} color={UNIFIED_THEME.colors.accent.primary} />
                <Text style={styles.badgeText}>Mentor & Learner</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(SCREEN_NAMES.EditProfile)}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name="edit" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Edit Profile</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="notifications" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Notifications</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="account-balance-wallet" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Payments</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(SCREEN_NAMES.RecordedLectures)}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name="video-library" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Recorded lectures</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="privacy-tip" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.noBorder]}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="contact-support" size={20} color={UNIFIED_THEME.colors.accent.primary} />
              <Text style={styles.menuLabel}>Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UNIFIED_THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <Button
          text="Sign Out"
          onPress={handleLogout}
          variant="ghost"
          style={styles.signOutBtn}
        />
      </ScrollView>

      <LoadingOverlay visible={loading} message="Uploading..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    padding: UNIFIED_THEME.spacing.lg,
    overflow: 'hidden',
  },
  eyebrow: {
    ...UNIFIED_THEME.typography.labelSm,
    color: UNIFIED_THEME.colors.accent.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.lg,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.primary.dark,
  },
  profileMeta: { flex: 1 },
  profileName: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  profileEmail: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderRadius: 10,
  },
  badgeText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
    marginLeft: UNIFIED_THEME.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  card: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  noBorder: { borderBottomWidth: 0 },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.md,
  },
  menuLabel: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '500',
  },
  signOutBtn: { marginBottom: UNIFIED_THEME.spacing.xxxl },
});
