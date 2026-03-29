import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREEN_NAMES } from './screenNames';
import WelcomeScreen from '../scenes/auth/WelcomeScreen';
import RoleSelectScreen from '../scenes/auth/RoleSelectScreen';
import SignupScreen from '../scenes/auth/SignupScreen';
import LoginScreen from '../scenes/auth/LoginScreen';

const AuthStack = createStackNavigator();

export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0a0f20' },
      }}
    >
      <AuthStack.Screen name={SCREEN_NAMES.Welcome} component={WelcomeScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.RoleSelect} component={RoleSelectScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.Signup} component={SignupScreen} />
      <AuthStack.Screen name={SCREEN_NAMES.Login} component={LoginScreen} />
    </AuthStack.Navigator>
  );
};
