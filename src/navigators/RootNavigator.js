import React, { useContext } from 'react'; // eslint-disable-line
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SCREEN_NAMES } from './screenNames';
import { AuthNavigator } from './AuthNavigator';
import { UnifiedTabNavigator } from './UnifiedTabNavigator';
import SharedMentorProfileScreen from '../scenes/shared/MentorProfileScreen';
import BookingScreen from '../scenes/shared/BookingScreen';
import VideoCallScreen from '../scenes/shared/VideoCallScreen';
import MentorAvailabilityScreen from '../scenes/mentor/AvailabilityScreen';
import EditProfileScreen from '../scenes/settings/EditProfileScreen';

const RootStack = createStackNavigator();

export const RootNavigator = () => {
  const { session, loading } = useContext(AuthContext);

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
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animationEnabled: false }}
        />
      ) : (
        <>
          <RootStack.Screen
            name="UnifiedTabs"
            component={UnifiedTabNavigator}
            options={{ animationEnabled: false }}
          />
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name={SCREEN_NAMES.EditProfile}
              component={EditProfileScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.MentorProfile}
              component={SharedMentorProfileScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.Booking}
              component={BookingScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.MentorAvailability}
              component={MentorAvailabilityScreen}
            />

          </RootStack.Group>
          <RootStack.Screen
            name={SCREEN_NAMES.VideoCall}
            component={VideoCallScreen}
            options={{ animationEnabled: false }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};
