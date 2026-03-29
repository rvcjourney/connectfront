import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Phone, Earnings, Settings } from '../assets/icons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import MentorDashboardScreen from '../scenes/mentor/HomeScreen';
import MentorCallsScreen from '../scenes/mentor/CallsScreen';
import MentorEarningsScreen from '../scenes/mentor/EarningsScreen';
import MentorSettingsScreen from '../scenes/mentor/SettingsScreen';

const MentorTabs = createBottomTabNavigator();

export const MentorTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <MentorTabs.Navigator
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
      <MentorTabs.Screen
        name={SCREEN_NAMES.MentorDashboard}
        component={MentorDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Home width={24} height={24} fill={color} />
          ),
        }}
      />
      <MentorTabs.Screen
        name={SCREEN_NAMES.MentorCalls}
        component={MentorCallsScreen}
        options={{
          tabBarLabel: 'Calls',
          tabBarIcon: ({ color }) => (
            <Phone width={24} height={24} fill={color} />
          ),
        }}
      />
      <MentorTabs.Screen
        name={SCREEN_NAMES.MentorEarnings}
        component={MentorEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color }) => (
            <Earnings width={24} height={24} fill={color} />
          ),
        }}
      />
      <MentorTabs.Screen
        name={SCREEN_NAMES.MentorSettings}
        component={MentorSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings width={24} height={24} fill={color} />
          ),
        }}
      />
    </MentorTabs.Navigator>
  );
};
