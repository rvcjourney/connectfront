import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeScreen } from '../../components/SafeScreen';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { Dropdown } from '../../components/Dropdown';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';

const CATEGORIES = [
  'Technology (IT & Software)',
  'Artificial Intelligence & Data Science',
  'Healthcare & Medical Services',
  'Finance & Economic Services',
  'Business Management & Strategy',
  'Marketing & Communications',
  'Education & Training',
  'Renewable Energy & Sustainability',
  'Transportation & Logistics',
  'Legal & Compliance',
  'Creator Economy & Social Influencing',
  'Astrology & Occult Sciences',
  'Gaming & Esports',
  'Health, Wellness & Sports Performance',
  'UI/UX & No-Code Development',
  'Human-Machine Interaction & AI Ethics',
  'Advanced Manufacturing & Robotics',
  'Fractional & Gig Leadership',
  'Mental Health & Specialized Therapy',
  'ESG & Carbon Management',
  'Others',
];

export default function MentorProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadMentorProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getMentorProfile(user.id);
      setMentorProfile(data);
      setBio(data.bio || '');
      setSpecialization(data.specialization || '');
      setExperienceYears(String(data.experience_years || ''));
      setPricePerHour(String(data.price_per_hour || ''));
      setCategory(data.category || '');
    } catch (error) {
      console.error('Failed to load mentor profile:', error);
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

    if (!specialization.trim()) {
      Toast.show('Specialization cannot be empty');
      return;
    }

    try {
      setSaving(true);

      // Update name in profiles table
      await profileApi.updateProfile({
        userId: user.id,
        name: name.trim(),
      });

      // Update mentor profile
      await profileApi.updateMentorProfile({
        userId: user.id,
        bio: bio || '',
        specialization: specialization.trim(),
        experienceYears: parseInt(experienceYears) || 0,
        pricePerHour: parseFloat(pricePerHour) || 0,
      });

      // Update category
      if (category) {
        await profileApi.updateMentorCategory(user.id, category);
      }

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

      {/* Specialization Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="star"
            size={20}
            color={UNIFIED_THEME.colors.accent.primary}
          />
          <Text style={styles.cardLabel}>Specialization</Text>
        </View>
        <TextInput
          placeholder="e.g., Web Development, Data Science"
          placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
          value={specialization}
          onChangeText={setSpecialization}
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
          placeholder="Tell learners about yourself and your teaching approach"
          placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.bioInput]}
          editable={!saving}
        />
      </View>

      {/* Row: Experience & Price */}
      <View style={styles.row}>
        {/* Experience Card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="timeline"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
            />
            <Text style={styles.cardLabel}>Experience</Text>
          </View>
          <TextInput
            placeholder="Years"
            placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
            style={styles.input}
            editable={!saving}
          />
        </View>

        {/* Price Card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="currency-rupee"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
            />
            <Text style={styles.cardLabel}>Hourly Rate</Text>
          </View>
          <TextInput
            placeholder="Amount"
            placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
            value={pricePerHour}
            onChangeText={setPricePerHour}
            keyboardType="decimal-pad"
            style={styles.input}
            editable={!saving}
          />
        </View>
      </View>

      {/* Category Dropdown */}
      <View style={styles.card}>
        <Dropdown
          label="Professional Category"
          items={CATEGORIES}
          selectedValue={category}
          onSelect={setCategory}
          placeholder="Select your category"
        />
      </View>

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

  row: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
  },

  halfCard: {
    flex: 1,
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
