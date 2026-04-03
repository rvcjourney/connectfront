import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { authApi } from '../../api/authApi';
import { profileApi } from '../../api/profileApi';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      Toast.show('Please enter your name');
      return;
    }
    if (!email.trim()) {
      Toast.show('Please enter your email');
      return;
    }
    if (password.length < 8) {
      Toast.show('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Toast.show('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { user } = await authApi.signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        role: 'both',
      });

      // Create both mentor and learner profiles
      if (user?.id) {
        await Promise.all([
          profileApi.createMentorProfile(user.id),
          profileApi.createLearnerProfile(user.id),
        ]);
      }

      Toast.show('Account created! Please sign in.');
      navigation.navigate('Login_Screen');
    } catch (error) {
      Toast.show(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[
        UNIFIED_THEME.colors.primary.dark,
        UNIFIED_THEME.colors.primary.light,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person"
                size={20}
                color={UNIFIED_THEME.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
                style={styles.input}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="email"
                size={20}
                color={UNIFIED_THEME.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={20}
                color={UNIFIED_THEME.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Password (min 8 chars)"
                placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={styles.eyeIcon}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={UNIFIED_THEME.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={UNIFIED_THEME.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                style={styles.eyeIcon}
              >
                <MaterialIcons
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={UNIFIED_THEME.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <Button
              text="Create Account"
              onPress={handleSignup}
              disabled={loading}
              style={styles.signupBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login_Screen')}
              disabled={loading}
            >
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <LoadingOverlay visible={loading} message="Creating your account..." />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },
  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  formContainer: {
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    height: 50,
  },
  inputIcon: { marginRight: UNIFIED_THEME.spacing.md },
  input: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    ...UNIFIED_THEME.typography.bodySm,
    padding: 0,
  },
  eyeIcon: { padding: UNIFIED_THEME.spacing.sm },
  signupBtn: { marginTop: UNIFIED_THEME.spacing.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xl,
    gap: UNIFIED_THEME.spacing.sm,
  },
  footerText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
  },
  signinLink: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  backButtonText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.secondary,
    fontWeight: '600',
  },
});
