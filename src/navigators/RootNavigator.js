import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { SplashScreen } from '../components/SplashScreen';
import { UNIFIED_THEME } from '../unifiedTheme';
import { SCREEN_NAMES } from './screenNames';
import { AuthNavigator } from './AuthNavigator';
import { UnifiedTabNavigator } from './UnifiedTabNavigator';
import SharedMentorProfileScreen from '../scenes/shared/MentorProfileScreen';
import BookingScreen from '../scenes/shared/BookingScreen';
import VideoCallScreen from '../scenes/shared/VideoCallScreen';
import RecordingPlayerScreen from '../scenes/shared/RecordingPlayerScreen';
import MentorAvailabilityScreen from '../scenes/mentor/AvailabilityScreen';
import EditProfileScreen from '../scenes/settings/EditProfileScreen';
import RecordedLecturesScreen from '../scenes/settings/RecordedLecturesScreen';
import TransactionHistoryScreen from '../scenes/settings/TransactionHistoryScreen';
import WalletScreen from '../scenes/settings/WalletScreen';
import ReviewScreen from '../scenes/shared/ReviewScreen';
import CategoryMentorsScreen from '../scenes/learner/CategoryMentorsScreen';
import MentorVideosScreen from '../scenes/mentor/MentorVideosScreen';
import PayoutSetupScreen from '../scenes/settings/PayoutSetupScreen';
import ConnectivityScreen from '../scenes/settings/ConnectivityScreen';
import MentorStatsScreen from '../scenes/mentor/MentorStatsScreen';

const RootStack = createStackNavigator();

export const RootNavigator = () => {
  const { session, loading, pendingPasswordReset } = useContext(AuthContext);

  if (loading) {
    return <SplashScreen />;
  }

  const showAuth = !session || pendingPasswordReset;

  return (
    <RootStack.Navigator
      key={showAuth ? 'root-guest' : 'root-authed'}
      initialRouteName={showAuth ? 'Auth' : SCREEN_NAMES.RootUnifiedTabs}
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: UNIFIED_THEME.colors.primary.void },
      }}
    >
      {showAuth ? (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animationEnabled: false }}
        />
      ) : (
        <>
          <RootStack.Screen
            name={SCREEN_NAMES.RootUnifiedTabs}
            component={UnifiedTabNavigator}
            options={{ animationEnabled: false }}
          />
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name={SCREEN_NAMES.EditProfile}
              component={EditProfileScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.RecordedLectures}
              component={RecordedLecturesScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.TransactionHistory}
              component={TransactionHistoryScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.Wallet}
              component={WalletScreen}
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
            <RootStack.Screen
              name={SCREEN_NAMES.Review}
              component={ReviewScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.CategoryMentors}
              component={CategoryMentorsScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.MentorVideos}
              component={MentorVideosScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.PayoutSetup}
              component={PayoutSetupScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.Connectivity}
              component={ConnectivityScreen}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.MentorStats}
              component={MentorStatsScreen}
            />
          </RootStack.Group>
          <RootStack.Screen
            name={SCREEN_NAMES.VideoCall}
            component={VideoCallScreen}
            options={{ animationEnabled: false }}
          />
          <RootStack.Screen
            name={SCREEN_NAMES.RecordingPlayer}
            component={RecordingPlayerScreen}
            options={{ animationEnabled: true }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};
