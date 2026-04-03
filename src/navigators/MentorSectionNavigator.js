import React from 'react'; // eslint-disable-line
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import { CapsuleTabBar } from '../components/CapsuleTabBar';
import MentorDashboardScreen from '../scenes/mentor/HomeScreen';
import MentorCallsScreen from '../scenes/mentor/CallsScreen';
import MentorEarningsScreen from '../scenes/mentor/EarningsScreen';
import MentorAvailabilityScreen from '../scenes/mentor/AvailabilityScreen';

const TopTab = createMaterialTopTabNavigator();

export const MentorSectionNavigator = () => {
  return (
    <TopTab.Navigator
      tabBar={props => <CapsuleTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        lazy: true,
      }}
      style={{ backgroundColor: UNIFIED_THEME.colors.primary.light }}
      sceneContainerStyle={{ backgroundColor: UNIFIED_THEME.colors.primary.light }}
    >
      <TopTab.Screen
        name={SCREEN_NAMES.MentorDashboard}
        component={MentorDashboardScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <TopTab.Screen
        name={SCREEN_NAMES.MentorCalls}
        component={MentorCallsScreen}
        options={{ tabBarLabel: 'Calls' }}
      />
      <TopTab.Screen
        name={SCREEN_NAMES.MentorEarnings}
        component={MentorEarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <TopTab.Screen
        name={SCREEN_NAMES.MentorAvailabilityTab}
        component={MentorAvailabilityScreen}
        options={{ tabBarLabel: 'Availability' }}
      />
    </TopTab.Navigator>
  );
};
