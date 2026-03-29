import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../../unifiedTheme';
import Button from '../../components/Button';

export default function RoleSelectScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Share your expertise and earn',
      icon: 'work',
    },
    {
      id: 'learner',
      title: 'Learner',
      description: 'Learn from industry experts',
      icon: 'school',
    },
  ];

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
        <Text style={styles.title}>Select Your Role</Text>

        <View style={styles.cardsContainer}>
          {roles.map(role => (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelectedRole(role.id)}
              style={[
                styles.card,
                selectedRole === role.id && styles.cardSelected,
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={[
                  styles.iconBackground,
                  selectedRole === role.id && styles.iconBackgroundSelected,
                ]}>
                  <MaterialIcons
                    name={role.icon}
                    size={32}
                    color="#FFF"
                    style={styles.cardIcon}
                  />
                </View>
                <Text
                  style={[
                    styles.cardTitle,
                    selectedRole === role.id && styles.cardTitleSelected,
                  ]}
                >
                  {role.title}
                </Text>
                <Text style={styles.cardDescription}>
                  {role.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            text="Continue"
            onPress={() => {
              if (selectedRole) {
                navigation.navigate('Signup_Screen', { role: selectedRole });
              }
            }}
            disabled={!selectedRole}
            style={{ marginBottom: UNIFIED_THEME.spacing.lg }}
          />

          <Button
            text="Back"
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
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

  title: {
    ...UNIFIED_THEME.typography.headingLg,
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    textAlign: 'center',
    fontWeight: '700',
  },

  cardsContainer: {
    width: '100%',
    marginBottom: UNIFIED_THEME.spacing.xxl,
    gap: UNIFIED_THEME.spacing.lg,
  },

  card: {
    width: '100%',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: UNIFIED_THEME.spacing.xl,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },

  cardSelected: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: UNIFIED_THEME.colors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  iconBackgroundSelected: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
  },

  cardIcon: {
    marginBottom: 0,
  },

  cardTitle: {
    ...UNIFIED_THEME.typography.bodyLg,
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },

  cardTitleSelected: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontWeight: '700',
  },

  cardDescription: {
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.secondary,
    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',
  },
});
