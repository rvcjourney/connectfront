import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';

export default function WelcomeScreen({ navigation }) {
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
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <MaterialIcons
            name="videocam"
            size={40}
            color={UNIFIED_THEME.colors.accent.primary}
          />
        </View>

        {/* Title Section */}
        <Text style={styles.title}>Connect with Your</Text>

        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>Connectiqo</Text>
        </View>

        <Text style={styles.subtitle}>
          Learn from experts{'\n'}or share your expertise
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RoleSelect_Screen')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[
              UNIFIED_THEME.colors.accent.primary,
              UNIFIED_THEME.colors.accent.secondary,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="star"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
              style={styles.statIconSpacing}
            />
            <Text style={styles.statText}>Expert Mentors</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <MaterialIcons
              name="lock"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
              style={styles.statIconSpacing}
            />
            <Text style={styles.statText}>Secure Payment</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <MaterialIcons
              name="videocam"
              size={20}
              color={UNIFIED_THEME.colors.accent.primary}
              style={styles.statIconSpacing}
            />
            <Text style={styles.statText}>Video Call</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },

  logoContainer: {
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
    letterSpacing: 0.5,
  },

  appNameContainer: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  appName: {
    ...UNIFIED_THEME.typography.headingXL,
    fontSize: 40,
    color: UNIFIED_THEME.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 52,
  },

  subtitle: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    lineHeight: 24,
  },

  button: {
    width: '100%',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    borderRadius: 12,
    overflow: 'hidden',
  },

  buttonGradient: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },

  buttonText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconSpacing: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  statText: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    marginHorizontal: UNIFIED_THEME.spacing.sm,
  },
});
