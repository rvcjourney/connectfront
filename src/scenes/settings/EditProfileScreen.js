import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { launchImageLibrary } from 'react-native-image-picker';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { SafeScreen } from '../../components/SafeScreen';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profileApi';
import { MENTOR_CATEGORIES } from '../../constants/mentorCategories';

const SectionHeader = ({ icon, title, accent }) => (
  <View style={sSection.row}>
    <View style={[sSection.badge, { backgroundColor: accent + '25' }]}>
      <MaterialIcons name={icon} size={13} color={accent} />
    </View>
    <Text style={[sSection.title, { color: accent }]}>{title}</Text>
    <View style={[sSection.line, { backgroundColor: accent + '30' }]} />
  </View>
);

const sSection = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
    marginTop: UNIFIED_THEME.spacing.lg,
    gap: UNIFIED_THEME.spacing.sm,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
  },
});

const Field = ({ icon, label, value, onChangeText, placeholder, readOnly, hint, multiline, isLast, keyboardType }) => (
  <View style={[sField.wrapper, isLast && sField.noBorder]}>
    <View style={sField.labelRow}>
      {icon && <MaterialIcons name={icon} size={13} color={UNIFIED_THEME.colors.text.muted} style={sField.icon} />}
      <Text style={sField.label}>{label}</Text>
    </View>
    {readOnly ? (
      <View style={sField.readOnlyBox}>
        <Text style={sField.readOnlyText}>{value}</Text>
        <MaterialIcons name="lock-outline" size={14} color={UNIFIED_THEME.colors.text.disabled} />
      </View>
    ) : (
      <TextInput
        style={[sField.input, multiline && sField.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={UNIFIED_THEME.colors.text.disabled}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType || 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    )}
    {hint && <Text style={sField.hint}>{hint}</Text>}
  </View>
);

const sField = StyleSheet.create({
  wrapper: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  noBorder: { borderBottomWidth: 0 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: { marginRight: 5 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: UNIFIED_THEME.colors.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderRadius: 10,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
  },
  multiline: {
    height: 80,
    paddingTop: UNIFIED_THEME.spacing.sm,
  },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderRadius: 10,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    opacity: 0.6,
  },
  readOnlyText: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    color: UNIFIED_THEME.colors.text.disabled,
    marginTop: 4,
  },
});

export default function EditProfileScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name || '');
  const [learnerBio, setLearnerBio] = useState('');
  const [interests, setInterests] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
    setName(profile?.name || '');
    loadProfiles();
  }, [profile?.id]);

  const loadProfiles = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [mentorData, learnerData] = await Promise.allSettled([
        profileApi.getMentorProfile(profile.id),
        profileApi.getLearnerProfile(profile.id),
      ]);
      if (mentorData.status === 'fulfilled' && mentorData.value) {
        const m = mentorData.value;
        setSpecialization(m.specialization || '');
        setMentorBio(m.bio || '');
        setExperienceYears(m.experience_years ? String(m.experience_years) : '');
        setPricePerHour(m.price_per_hour ? String(m.price_per_hour) : '');
        setCategory(m.category || '');
      }
      if (learnerData.status === 'fulfilled' && learnerData.value) {
        const l = learnerData.value;
        setLearnerBio(l.bio || '');
        setInterests(Array.isArray(l.interests) ? l.interests.join(', ') : (l.interests || ''));
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show('Please enter your name');
      return;
    }
    try {
      setSaving(true);
      await Promise.all([
        profileApi.updateProfile({ userId: profile.id, name: name.trim() }),
        profileApi.updateMentorProfile({
          userId: profile.id,
          specialization,
          bio: mentorBio,
          experienceYears: parseInt(experienceYears) || 0,
          pricePerHour: parseFloat(pricePerHour) || 0,
        }),
        profileApi.updateLearnerProfile({
          userId: profile.id,
          bio: learnerBio,
          interests: interests.split(',').map(i => i.trim()).filter(Boolean),
        }),
        category ? profileApi.updateMentorCategory(profile.id, category) : Promise.resolve(),
      ]);
      await refreshProfile();
      Toast.show('Profile saved');
      navigation.goBack();
    } catch (err) {
      console.error('Save profile error:', err?.message || err);
      Toast.show('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeScreen scrollable={false} padding={0}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={UNIFIED_THEME.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarRing}
            onPress={handlePickImage}
            disabled={loading}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={54} color={UNIFIED_THEME.colors.text.muted} />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.body}>
          {/* Personal Info */}
          <SectionHeader
            icon="person"
            title="Personal Info"
            accent={UNIFIED_THEME.colors.accent.secondary}
          />
          <View style={styles.card}>
            <Field
              icon="badge"
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your display name"
            />
            <Field
              icon="email"
              label="Email"
              value={profile?.email}
              readOnly
              hint="Email cannot be changed"
              isLast
            />
          </View>

          {/* As Learner */}
          <SectionHeader icon="school" title="As Learner" accent="#10B981" />
          <View style={styles.card}>
            <Field
              icon="info-outline"
              label="Bio"
              value={learnerBio}
              onChangeText={setLearnerBio}
              placeholder="Tell mentors about yourself"
              multiline
            />
            <Field
              icon="interests"
              label="Interests"
              value={interests}
              onChangeText={setInterests}
              placeholder="React, Python, Design…"
              hint="Comma separated"
              isLast
            />
          </View>

          {/* As Mentor */}
          <SectionHeader
            icon="workspace-premium"
            title="As Mentor"
            accent={UNIFIED_THEME.colors.accent.primary}
          />
          <View style={styles.card}>
            <Field
              icon="stars"
              label="Specialization"
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="e.g. Full Stack Developer"
            />
            <Field
              icon="info-outline"
              label="Bio"
              value={mentorBio}
              onChangeText={setMentorBio}
              placeholder="Describe your expertise"
              multiline
            />
            <View style={styles.rowFields}>
              <View style={{ flex: 1, marginRight: UNIFIED_THEME.spacing.sm }}>
                <Field
                  icon="event-note"
                  label="Experience (yrs)"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  placeholder="0"
                  keyboardType="numeric"
                  isLast
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  icon="currency-rupee"
                  label="Rate (₹/hr)"
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  placeholder="0"
                  keyboardType="numeric"
                  isLast
                />
              </View>
            </View>

            {/* Category dropdown */}
            <View style={[sField.wrapper, sField.noBorder]}>
              <View style={sField.labelRow}>
                <MaterialIcons name="category" size={13} color={UNIFIED_THEME.colors.text.muted} style={sField.icon} />
                <Text style={sField.label}>Category</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowCategoryPicker(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={category ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {category || 'Select a category'}
                </Text>
                <MaterialIcons
                  name={showCategoryPicker ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={UNIFIED_THEME.colors.text.muted}
                />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.dropdownList}>
                  {MENTOR_CATEGORIES.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        index === MENTOR_CATEGORIES.length - 1 && styles.dropdownItemLast,
                        category === cat && styles.dropdownItemActive,
                      ]}
                      onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, category === cat && styles.dropdownItemTextActive]}>
                        {cat}
                      </Text>
                      {category === cat && (
                        <MaterialIcons name="check" size={16} color={UNIFIED_THEME.colors.accent.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.saveFooter} />
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading || saving} message={saving ? 'Saving…' : 'Loading…'} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: UNIFIED_THEME.colors.text.primary,
    letterSpacing: 0.3,
  },
  saveBtn: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: 20,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: UNIFIED_THEME.spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.accent.primary,
    padding: 3,
    marginBottom: UNIFIED_THEME.spacing.sm,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },
  avatarHint: {
    fontSize: 12,
    color: UNIFIED_THEME.colors.text.muted,
  },
  body: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
  },
  card: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  rowFields: {
    flexDirection: 'row',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderRadius: 10,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
  },
  dropdownValue: {
    fontSize: 14,
    color: UNIFIED_THEME.colors.text.primary,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: UNIFIED_THEME.colors.text.disabled,
  },
  dropdownList: {
    marginTop: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: 'rgba(167, 139, 250, 0.12)' },
  dropdownItemText: {
    fontSize: 14,
    color: UNIFIED_THEME.colors.text.primary,
  },
  dropdownItemTextActive: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },
  saveFooter: { height: UNIFIED_THEME.spacing.xxxl },
});
