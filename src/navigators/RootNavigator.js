import React, { useContext, useEffect, useState } from 'react'; // eslint-disable-line
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { UNIFIED_THEME } from '../unifiedTheme';
import { INTRO_FLOW } from '../constants/introFlow';
import { postLoginIntroSeenKey } from '../constants/storageKeys';
import { SCREEN_NAMES } from './screenNames';
import { AuthNavigator } from './AuthNavigator';
import { UnifiedTabNavigator } from './UnifiedTabNavigator';
import IntroVideosScreen from '../scenes/auth/IntroVideosScreen';
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
  const [postLoginIntro, setPostLoginIntro] = useState({
    ready: false,
    needsIntro: false,
  });

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!session?.user?.id) {
      setPostLoginIntro({ ready: true, needsIntro: false });
      return;
    }

    setPostLoginIntro({ ready: false, needsIntro: false });

    let cancelled = false;
    (async () => {
      try {
        const key = postLoginIntroSeenKey(session.user.id);
        const v = await AsyncStorage.getItem(key);
        if (!cancelled) {
          setPostLoginIntro({
            ready: true,
            needsIntro: v !== '1',
          });
        }
      } catch {
        if (!cancelled) {
          setPostLoginIntro({ ready: true, needsIntro: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, loading]);

  if (loading) {
    return <LoadingOverlay visible message="Loading..." />;
  }

  if (session && !pendingPasswordReset && !postLoginIntro.ready) {
    return <LoadingOverlay visible message="Loading..." />;
  }

  const showAuth = !session || pendingPasswordReset;

  const initialRouteName = showAuth
    ? 'Auth'
    : postLoginIntro.needsIntro
      ? SCREEN_NAMES.PostLoginIntro
      : SCREEN_NAMES.RootUnifiedTabs;

  return (
    <RootStack.Navigator
      key={showAuth ? 'root-guest' : 'root-authed'}
      initialRouteName={initialRouteName}
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
            name={SCREEN_NAMES.PostLoginIntro}
            component={IntroVideosScreen}
            initialParams={{ flow: INTRO_FLOW.POST_AUTH }}
            options={{ gestureEnabled: false, animationEnabled: true }}
          />
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
