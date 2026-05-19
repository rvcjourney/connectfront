import React from 'react'; // eslint-disable-line
import { createStackNavigator } from '@react-navigation/stack';
import { UNIFIED_THEME } from '../unifiedTheme';
import { INTRO_FLOW } from '../constants/introFlow';
import { SCREEN_NAMES } from './screenNames';
import WelcomeScreen from '../scenes/auth/WelcomeScreen';
import SignupScreen from '../scenes/auth/SignupScreen';
import LoginScreen from '../scenes/auth/LoginScreen';
import ForgotPasswordScreen from '../scenes/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../scenes/auth/ResetPasswordScreen';
import IntroVideosScreen from '../scenes/auth/IntroVideosScreen';

const AuthStack = createStackNavigator();

export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: UNIFIED_THEME.colors.primary.void },
      }}
    >
      <AuthStack.Screen name={SCREEN_NAMES.Welcome} component={WelcomeScreen} />
      <AuthStack.Screen
        name={SCREEN_NAMES.IntroVideos}
        component={IntroVideosScreen}
        initialParams={{ flow: INTRO_FLOW.PRE_AUTH }}
      />
      <AuthStack.Screen name={SCREEN_NAMES.Signup} component={SignupScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.Login} component={LoginScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.ForgotPassword} component={ForgotPasswordScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.ResetPassword} component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
};
