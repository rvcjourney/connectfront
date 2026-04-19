import React from "react";
import "react-native-gesture-handler";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { UNIFIED_THEME } from "./src/unifiedTheme";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { AuthProvider } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { RootNavigator } from "./src/navigators/RootNavigator";
import { SCREEN_NAMES } from "./src/navigators/screenNames";
import { linking } from "./src/navigators/linkingConfig";
import { loadRemoteConfig } from "./src/utils/remoteConfig";

LogBox.ignoreLogs([
  "Warning: Non-serializable values detected",
  "Animated: `useNativeDriver`"
]);

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
    card: "transparent",
    border: UNIFIED_THEME.colors.border.light,
  },
};

export default function App() {
  const navigationRef = React.useRef();

  React.useEffect(() => { loadRemoteConfig(); }, []);

  return (
    <ErrorBoundary
      onReset={() => {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: SCREEN_NAMES.Welcome }],
        });
      }}
    >
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
              <RootNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
