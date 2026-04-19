import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SCREEN_NAMES } from './screenNames';
import { CapsuleTabBar } from '../components/CapsuleTabBar';
import LearnerHomeScreen from '../scenes/learner/HomeScreen';
import LearnerBookingsScreen from '../scenes/learner/BookingsScreen';

const TopTab = createMaterialTopTabNavigator();

const tabIcon =
  (name) =>
  ({ color, focused }) =>
    (
      <MaterialIcons
        name={name}
        size={focused ? 22 : 20}
        color={color}
      />
    );

export const LearnerSectionNavigator = () => {
  return (
    <TopTab.Navigator
      tabBar={props => <CapsuleTabBar {...props} compact />}
      screenOptions={{
        swipeEnabled: true,
        lazy: true,
      }}
      style={{ backgroundColor: 'transparent' }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <TopTab.Screen
        name={SCREEN_NAMES.LearnerSearch}
        component={LearnerHomeScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: tabIcon('explore'),
        }}
      />
      <TopTab.Screen
        name={SCREEN_NAMES.LearnerBookings}
        component={LearnerBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: tabIcon('event-note'),
        }}
      />
    </TopTab.Navigator>
  );
};
