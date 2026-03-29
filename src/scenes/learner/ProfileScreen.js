import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';

export default function LearnerProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [learnerProfile, setLearnerProfile] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadLearnerProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const loadLearnerProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getLearnerProfile(user.id);
      setLearnerProfile(data);
      setBio(data.bio || '');
      setInterests(data.interests?.join(', ') || '');
    } catch (error) {
      console.error('Failed to load learner profile:', error);
      Toast.show('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Toast.show('Name cannot be empty');
      return;
    }

    try {
      setSaving(true);

      // Parse interests from comma-separated string to array
      const interestsArray = interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      // Update name in profiles table
      await profileApi.updateProfile({
        userId: user.id,
        name: name.trim(),
      });

      // Update learner profile (bio and interests)
      await profileApi.updateLearnerProfile({
        userId: user.id,
        bio: bio || '',
        interests: interestsArray,
      });

      await refreshProfile();
      Toast.show('Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Toast.show('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Loading profile..." />;
  }

  return (
    <SafeScreen scrollable={true} padding={UNIFIED_THEME.spacing.lg} hasBottomTabs={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={UNIFIED_THEME.colors.text.primary}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>Update your information</Text>
        </View>
      </View>

      {/* Email Card (Read-only) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="mail"
            size={20}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.cardLabel}>Email Address</Text>
        </View>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyValue}>{profile?.email || 'N/A'}</Text>
          <Text style={styles.readOnlyHint}>Cannot be changed</Text>
        </View>
      </View>

      {/* Name Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="person"
            size={20}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.cardLabel}>Full Name</Text>
        </View>
        <TextInput
          placeholder="Enter your full name"
          placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={!saving}
        />
      </View>

      {/* Bio Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="description"
            size={20}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.cardLabel}>Bio</Text>
        </View>
        <TextInput
          placeholder="Tell mentors about yourself"
          placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.bioInput]}
          editable={!saving}
        />
      </View>

      {/* Interests Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="interests"
            size={20}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.cardLabel}>Interests</Text>
        </View>
        <TextInput
          placeholder="Separate with commas (e.g., Python, ML, Web Dev)"
          placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
          value={interests}
          onChangeText={setInterests}
          multiline
          numberOfLines={3}
          style={[styles.input, styles.bioInput]}
          editable={!saving}
        />
      </View>

      {/* Rating Card (Read-only) */}
      {learnerProfile?.rating ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="star"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
            />
            <Text style={styles.cardLabel}>Your Rating</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyValue}>
              ⭐ {learnerProfile.rating.toFixed(1)} / 5.0
            </Text>
            <Text style={styles.readOnlyHint}>Based on sessions completed</Text>
          </View>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          text="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          disabled={saving}
          style={styles.actionButton}
        />
        <Button
          text={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSaveProfile}
          disabled={saving}
          style={styles.actionButton}
        />
      </View>

      <LoadingOverlay visible={saving} message="Updating profile..." />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xl,
    gap: UNIFIED_THEME.spacing.md,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },

  card: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  cardLabel: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontWeight: '600',
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: 8,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    color: UNIFIED_THEME.colors.text.primary,
    ...UNIFIED_THEME.typography.bodySm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: UNIFIED_THEME.spacing.md,
  },

  readOnlyField: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: 8,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    opacity: 0.7,
  },

  readOnlyValue: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  readOnlyHint: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    fontStyle: 'italic',
  },

  actions: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
    marginTop: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  actionButton: {
    flex: 1,
  },
});
