import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-simple-toast';
import CosmicBackground from '../../components/CosmicBackground';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';
import { authApi } from '../../api/authApi';
import { SCREEN_NAMES } from '../../navigators/screenNames';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {

      await authApi.signIn({
        email: email.trim().toLowerCase(),
        password,
      });

      Toast.show('Signed in successfully!');
      // AuthContext will handle navigation automatically
    } catch (error) {
      console.error('❌ Login error:', error);
      let message = error.message || 'Something went wrong. Please try again.';

      if (error.message?.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please check and try again.';
      }

      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground style={styles.background}>
      <SafeAreaView style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons
              name="videocam"
              size={40}
              color={UNIFIED_THEME.colors.accent.primary}
              style={styles.logoIcon}
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
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
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                cursorColor={UNIFIED_THEME.colors.accent.secondary}
                selectionColor={UNIFIED_THEME.colors.accent.secondary}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={20}
                color={UNIFIED_THEME.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                cursorColor={UNIFIED_THEME.colors.accent.secondary}
                selectionColor={UNIFIED_THEME.colors.accent.secondary}
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

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREEN_NAMES.ForgotPassword)}
              disabled={loading}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              text={loading ? 'Loading data...' : 'Sign In'}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup_Screen')}
              disabled={loading}
            >
              <Text style={styles.signupLink}>Create one</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
  },

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

  logoIcon: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  subtitle: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
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

  inputIcon: {
    marginRight: UNIFIED_THEME.spacing.md,
  },

  input: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    ...UNIFIED_THEME.typography.bodySm,
    padding: 0,
  },

  eyeIcon: {
    padding: UNIFIED_THEME.spacing.sm,
  },

  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: UNIFIED_THEME.spacing.lg,
    marginTop: UNIFIED_THEME.spacing.sm,
  },

  forgotText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '600',
  },

  loginBtn: {
    marginTop: UNIFIED_THEME.spacing.lg,
  },

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

  signupLink: {
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
