import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import { CapsuleTabBar } from '../components/CapsuleTabBar';
import LearnerHomeScreen from '../scenes/learner/HomeScreen';
import LearnerBookingsScreen from '../scenes/learner/BookingsScreen';

const TopTab = createMaterialTopTabNavigator();

export const LearnerSectionNavigator = () => {
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
        name={SCREEN_NAMES.LearnerSearch}
        component={LearnerHomeScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <TopTab.Screen
        name={SCREEN_NAMES.LearnerBookings}
        component={LearnerBookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
    </TopTab.Navigator>
  );
};
