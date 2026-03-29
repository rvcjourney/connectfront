import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SCREEN_NAMES } from './screenNames';
import { AuthNavigator } from './AuthNavigator';
import { LearnerTabNavigator } from './LearnerTabNavigator';
import { MentorTabNavigator } from './MentorTabNavigator';
import SharedMentorProfileScreen from '../scenes/shared/MentorProfileScreen';
import BookingScreen from '../scenes/shared/BookingScreen';
import VideoCallScreen from '../scenes/shared/VideoCallScreen';
import MentorAvailabilityScreen from '../scenes/mentor/AvailabilityScreen';
import LearnerProfileScreen from '../scenes/learner/ProfileScreen';
import MentorProfileScreen from '../scenes/mentor/ProfileScreen';

const RootStack = createStackNavigator();

export const RootNavigator = () => {
  const { session, profile, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingOverlay visible message="Loading..." />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0a0f20' },
      }}
    >
      {!session ? (
        <RootStack.Group screenOptions={{ headerShown: false }}>
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animationEnabled: false }}
          />
        </RootStack.Group>
      ) : profile?.role === 'learner' ? (
        <>
          <RootStack.Group screenOptions={{ headerShown: false }}>
            <RootStack.Screen
              name="LearnerTabs"
              component={LearnerTabNavigator}
              options={{ animationEnabled: false }}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name={SCREEN_NAMES.MentorProfile}
              component={SharedMentorProfileScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.Booking}
              component={BookingScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.LearnerProfile}
              component={LearnerProfileScreen}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ animationEnabled: false }}>
            <RootStack.Screen
              name={SCREEN_NAMES.VideoCall}
              component={VideoCallScreen}
            />
          </RootStack.Group>
        </>
      ) : (
        <>
          <RootStack.Group screenOptions={{ headerShown: false }}>
            <RootStack.Screen
              name="MentorTabs"
              component={MentorTabNavigator}
              options={{ animationEnabled: false }}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name={SCREEN_NAMES.MentorAvailability}
              component={MentorAvailabilityScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.MentorProfileEdit}
              component={MentorProfileScreen}
            />
          </RootStack.Group>
          <RootStack.Group screenOptions={{ animationEnabled: false }}>
            <RootStack.Screen
              name={SCREEN_NAMES.VideoCall}
              component={VideoCallScreen}
            />
          </RootStack.Group>
        </>
      )}
    </RootStack.Navigator>
  );
};
