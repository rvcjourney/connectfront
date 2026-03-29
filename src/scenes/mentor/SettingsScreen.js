import { SafeScreen } from './../../components/SafeScreen';
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { launchImageLibrary } from 'react-native-image-picker';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

export default function MentorSettingsScreen({ navigation }) {
  const { profile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

  const handlePickImage = async () => {
    try {
      launchImageLibrary(
        {
          mediaType: 'photo',
          includeBase64: false,
          quality: 0.8,
        },
        async response => {
          if (response.didCancel) return;
          if (response.errorCode) {
            Toast.show('Failed to pick image');
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            await uploadAvatar(asset.uri, asset.fileName);
          }
        }
      );
    } catch (error) {
      Toast.show('Failed to pick image');
    }
  };

  const uploadAvatar = async (imageUri, fileName) => {
    try {
      setLoading(true);
      await profileApi.uploadAvatar({
        userId: profile.id,
        imageUri,
        fileName: fileName || 'avatar.jpg',
      });
      Toast.show('Avatar updated successfully');
    } catch (error) {
      Toast.show('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Toast.show('Signed out successfully');
            } catch (error) {
              Toast.show('Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg} hasBottomTabs={true}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card Section */}
        <View style={styles.profileCard}>
          {/* Avatar with Background */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons
                    name="person"
                    size={48}
                    color="#FFF"
                  />
                </View>
              )}
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickImage}
                disabled={loading}
              >
                <MaterialIcons
                  name="camera-alt"
                  size={14}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || 'N/A'}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {profile?.role === 'mentor' ? 'Mentor' : 'User'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate(SCREEN_NAMES.MentorProfileEdit)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="edit"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Edit Profile</Text>
                <Text style={styles.settingDescription}>Update your information</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate(SCREEN_NAMES.MentorAvailability)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Manage Availability</Text>
                <Text style={styles.settingDescription}>Set your working hours</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="notifications"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>Manage alerts and reminders</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Payments</Text>
                <Text style={styles.settingDescription}>Transaction History</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="privacy-tip"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>View our policies</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name="contact-support"
                  size={20}
                  color={UNIFIED_THEME.colors.accent.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>Get assistance</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={UNIFIED_THEME.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            text="Sign Out"
            onPress={handleLogout}
            variant="ghost"
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Updating..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },

  // Profile Card Section
  profileCard: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.lg,
  },

  avatarWrapper: {
    position: 'relative',
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },

  profileInfo: {
    flex: 1,
  },

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

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderRadius: 20,
  },

  roleBadgeText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },

  // Settings Section
  settingsSection: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  sectionTitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.md,
    marginLeft: UNIFIED_THEME.spacing.sm,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: UNIFIED_THEME.spacing.md,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },

  settingTextContainer: {
    flex: 1,
  },

  settingLabel: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },

  settingDescription: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },

  // Sign Out Section
  signOutSection: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  signOutButton: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
});
