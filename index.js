/**
 * @format
 */

import { AppRegistry, StatusBar } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import { register } from "@videosdk.live/react-native-sdk";
import notifee from "@notifee/react-native";
import colors from "./src/styles/colors";

StatusBar.setBackgroundColor(colors.primary[900]);

// Required by notifee — must be registered before AppRegistry
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Background notification events handled here (tap, dismiss, etc.)
});

// Register the service
register();

AppRegistry.registerComponent(appName, () => App);
