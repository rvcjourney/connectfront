import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import HomeScreen from '../scenes/home/HomeScreen';
import { MentorSectionNavigator } from './MentorSectionNavigator';
import { LearnerSectionNavigator } from './LearnerSectionNavigator';
import UnifiedSettingsScreen from '../scenes/settings/UnifiedSettingsScreen';

const BottomTab = createBottomTabNavigator();

export const UnifiedTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: UNIFIED_THEME.colors.accent.primary,
        tabBarInactiveTintColor: UNIFIED_THEME.colors.text.muted,
        tabBarStyle: {
          backgroundColor: UNIFIED_THEME.colors.primary.dark,
          borderTopColor: UNIFIED_THEME.colors.border.light,
          borderTopWidth: 1,
          height: 60 + (insets.bottom || 0),
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <BottomTab.Screen
        name={SCREEN_NAMES.UnifiedHome}
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={SCREEN_NAMES.MentorSection}
        component={MentorSectionNavigator}
        options={{
          tabBarLabel: 'Mentor',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="school" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={SCREEN_NAMES.LearnerSection}
        component={LearnerSectionNavigator}
        options={{
          tabBarLabel: 'Learner',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="menu-book" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={SCREEN_NAMES.UnifiedSettings}
        component={UnifiedSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};
