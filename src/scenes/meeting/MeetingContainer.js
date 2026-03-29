import {
  useMeeting,
} from "@videosdk.live/react-native-sdk";
import { useEffect, useState } from "react";
import OneToOneMeetingViewer from "./OneToOne";
import ConferenceMeetingViewer from "./Conference/ConferenceMeetingViewer";
import ParticipantLimitViewer from "./OneToOne/ParticipantLimitViewer";
import WaitingToJoinView from "./Components/WaitingToJoinView";
import React from "react";

export default function MeetingContainer({ webcamEnabled, meetingType, onParticipantCountChange, isHost }) {
  const [isJoined, setJoined] = useState(false);
  const [participantLimit, setParticipantLimit] = useState(false);

  const { join, participants, leave } = useMeeting({
    onMeetingJoined: () => {
      setTimeout(() => {
        setJoined(true);
      }, 500);
    },
    onParticipantLeft: () => {
      if (participants.size < 2) {
        setParticipantLimit(false);
      }
    },
  });

  // Track participant count and notify parent
  useEffect(() => {
    const participantCount = participants.size + 1; // +1 for self
    console.log(`👥 Participants joined: ${participantCount}`);
    if (onParticipantCountChange) {
      onParticipantCountChange(participantCount);
    }
  }, [participants.size, onParticipantCountChange]);

  useEffect(() => {
    if (isJoined) {
      if (participants.size > 2) {
        setParticipantLimit(true);
      }
    }
  }, [isJoined]);

  useEffect(() => {
    setTimeout(() => {
      if (!isJoined) {
        join();
      }
    }, 1000);

    return () => {
      leave();
    };
  }, []);

  return isJoined ? (
    meetingType === "GROUP" ? (
      <ConferenceMeetingViewer />
    ) : participantLimit ? (
      <ParticipantLimitViewer />
    ) : (
      <OneToOneMeetingViewer isHost={isHost} />
    )
  ) : (
    <WaitingToJoinView />
  );
}
