import React from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { LogBox } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { AuthProvider } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { RootNavigator } from "./src/navigators/RootNavigator";
import { SCREEN_NAMES } from "./src/navigators/screenNames";

LogBox.ignoreLogs([
  "Warning: Non-serializable values detected",
  "Animated: `useNativeDriver`"
]);

export default function App() {
  const navigationRef = React.useRef();

  console.log('🚀 App started');

  return (
    <ErrorBoundary
      onReset={() => {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: SCREEN_NAMES.Welcome }],
        });
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
