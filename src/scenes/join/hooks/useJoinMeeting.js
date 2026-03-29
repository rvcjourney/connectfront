import React, { useState, useRef, useEffect } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  createCameraVideoTrack,
  useMediaDevice,
  switchAudioDevice,
} from "@videosdk.live/react-native-sdk";
import Toast from "react-native-simple-toast";
import { getToken, createMeeting, validateMeeting } from "../../../api/api";
import { SCREEN_NAMES } from "../../../navigators/screenNames";

const DEFAULT_MEETING_TYPE = { key: "ONE_TO_ONE", value: "One to One Meeting" };

export const useJoinMeeting = (navigation) => {
  // Video & Media State
  const [tracks, setTrack] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user");

  // Form State
  const [name, setName] = useState("");
  const [meetingId, setMeetingId] = useState("");

  // UI State
  const [isAudioListVisible, setAudioListVisible] = useState(false);
  const [audioList, setAudioList] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isVisibleCreateMeeting, setIsVisibleCreateMeeting] = useState(false);
  const [isVisibleJoinMeeting, setIsVisibleJoinMeeting] = useState(false);
  const [meetingType] = useState(DEFAULT_MEETING_TYPE); // No setter - always ONE_TO_ONE

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const optionRef = useRef();
  const { getAudioDeviceList } = useMediaDevice();

  // Video Track Management
  const disposeVideoTrack = () => {
    setTrack((stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      return stream;
    });
  };

  const getTrack = async () => {
    try {
      const track = await createCameraVideoTrack({
        optimizationMode: "motion",
        encoderConfig: "h720p_w960p",
        facingMode: facingMode,
      });
      setTrack(track);
    } catch (error) {
      console.error("Error creating camera track:", error);
      Toast.show("Failed to access camera");
    }
  };

  const toggleCameraFacing = () => {
    try {
      disposeVideoTrack();
    } finally {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }
  };

  // Audio Device Management
  const fetchAudioDevices = async () => {
    try {
      const devices = await getAudioDeviceList();
      setAudioList(devices);
    } catch (error) {
      console.error("Error fetching audio devices:", error);
      Toast.show("Failed to fetch audio devices");
    }
  };

  const handleDeviceSelect = async (device) => {
    try {
      await switchAudioDevice(device.deviceId);
      setSelectedDeviceId(device.deviceId);
      toggleAudioList();
    } catch (error) {
      console.error("Error switching audio device:", error);
      Toast.show("Failed to switch audio device");
    }
  };

  const handleAudioButtonPress = async () => {
    await fetchAudioDevices();
    toggleAudioList();
  };

  const toggleAudioList = () => {
    setAudioListVisible(!isAudioListVisible);
  };

  // Meeting Operations
  const createNewMeeting = async () => {
    try {
      if (!name.trim()) {
        Toast.show("Please enter your name");
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Creating a room");
      const token = await getToken();

      if (!token) {
        Toast.show("Failed to get authentication token");
        return;
      }

      const newMeetingId = await createMeeting({ token });

      if (!newMeetingId) {
        Toast.show("Failed to create meeting. Please try again.");
        return;
      }

      disposeVideoTrack();
      navigation.navigate(SCREEN_NAMES.Meeting, {
        name: name.trim(),
        token,
        meetingId: newMeetingId,
        micEnabled: micOn,
        webcamEnabled: videoOn,
        meetingType: meetingType.key,
        defaultCamera: facingMode === "user" ? "front" : "back",
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
      Toast.show(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const joinExistingMeeting = async () => {
    try {
      if (!name.trim()) {
        Toast.show("Please enter your name");
        return;
      }

      if (!meetingId.trim()) {
        Toast.show("Please enter meeting code");
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Joining a room");
      const token = await getToken();

      if (!token) {
        Toast.show("Failed to get authentication token");
        return;
      }

      const isValid = await validateMeeting({
        token,
        meetingId: meetingId.trim(),
      });

      if (!isValid) {
        Toast.show("Invalid meeting ID. Please check and try again.");
        return;
      }

      disposeVideoTrack();
      navigation.navigate(SCREEN_NAMES.Meeting, {
        name: name.trim(),
        token,
        meetingId: meetingId.trim(),
        micEnabled: micOn,
        webcamEnabled: videoOn,
        meetingType: meetingType.key,
        defaultCamera: facingMode === "user" ? "front" : "back",
      });
    } catch (error) {
      console.error("Error joining meeting:", error);
      Toast.show(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // UI State Management
  const isMainScreen = () => {
    return !isVisibleJoinMeeting && !isVisibleCreateMeeting;
  };

  const closeModals = () => {
    setIsVisibleCreateMeeting(false);
    setIsVisibleJoinMeeting(false);
  };

  // Initialize & Cleanup
  useFocusEffect(
    React.useCallback(() => {
      getTrack();
    }, [])
  );

  useEffect(() => {
    getTrack();
  }, [facingMode]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!isMainScreen()) {
          closeModals();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [isVisibleCreateMeeting, isVisibleJoinMeeting])
  );

  return {
    // Video State
    tracks,
    videoOn,
    setVideoOn,
    facingMode,
    toggleCameraFacing,

    // Mic State
    micOn,
    setMicOn,

    // Form State
    name,
    setName,
    meetingId,
    setMeetingId,

    // Meeting Type (always ONE_TO_ONE)
    meetingType,

    // UI State
    isAudioListVisible,
    audioList,
    selectedDeviceId,
    isVisibleCreateMeeting,
    setIsVisibleCreateMeeting,
    isVisibleJoinMeeting,
    setIsVisibleJoinMeeting,
    isMainScreen,
    closeModals,
    isLoading,
    loadingMessage,

    // Methods
    handleAudioButtonPress,
    handleDeviceSelect,
    toggleAudioList,
    toggleCameraFacing,
    createNewMeeting,
    joinExistingMeeting,

    // Refs
    optionRef,
  };
};
