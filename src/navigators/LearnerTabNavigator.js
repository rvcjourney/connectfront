import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bookings, Settings } from '../assets/icons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import LearnerHomeScreen from '../scenes/learner/HomeScreen';
import LearnerBookingsScreen from '../scenes/learner/BookingsScreen';
import LearnerSettingsScreen from '../scenes/learner/SettingsScreen';

const LearnerTabs = createBottomTabNavigator();

export const LearnerTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <LearnerTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: UNIFIED_THEME.colors.accent.primary,
        tabBarInactiveTintColor: UNIFIED_THEME.colors.text.muted,
        tabBarStyle: {
          backgroundColor: UNIFIED_THEME.colors.primary.dark,
          borderTopColor: UNIFIED_THEME.colors.border.light,
          borderTopWidth: 1,
          height: 60 + (insets.bottom || 0), // Fixed height + bottom inset
          paddingBottom: insets.bottom, // Only home indicator space
          paddingTop: 0,
        },
      }}
    >
      <LearnerTabs.Screen
        name={SCREEN_NAMES.LearnerHome}
        component={LearnerHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Home width={24} height={24} fill={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name={SCREEN_NAMES.LearnerBookings}
        component={LearnerBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => (
            <Bookings width={24} height={24} fill={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name={SCREEN_NAMES.LearnerSettings}
        component={LearnerSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings width={24} height={24} fill={color} />
          ),
        }}
      />
    </LearnerTabs.Navigator>
  );
};
