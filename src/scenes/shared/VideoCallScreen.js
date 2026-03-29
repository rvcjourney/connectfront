import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useMeeting,
  MeetingProvider,
  MeetingConsumer,
} from '@videosdk.live/react-native-sdk';
import Toast from 'react-native-simple-toast';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { getToken, createMeeting, validateMeeting } from '../../api/api';
import { bookingApi } from '../../api/bookingApi';
import { earningsApi } from '../../api/earningsApi';
import { useAuth } from '../../hooks/useAuth';
import MeetingContainer from '../meeting/MeetingContainer';

export default function VideoCallScreen({ navigation, route }) {
  const { bookingId, isHost } = route.params;
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [callParams, setCallParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(1); // Start with current user
  const joinTimeRef = useRef(null); // Track when both participants joined (use Ref to persist across re-renders)
  const recordingRef = useRef();

  // Log participant count changes
  useEffect(() => {
    console.log(`👥 Participant count changed to: ${participantCount}`);
  }, [participantCount]);

  // Track when both participants have joined
  useEffect(() => {
    if (participantCount >= 2 && !joinTimeRef.current) {
      const now = new Date();
      joinTimeRef.current = now;
      console.log(`✅ Both participants joined at ${now.toLocaleTimeString()}`);
    }
  }, [participantCount]);

  // Request permissions on Android
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ];

          const granted = await PermissionsAndroid.requestMultiple(permissions);
          const allGranted = permissions.every(
            permission => granted[permission] === PermissionsAndroid.RESULTS.GRANTED
          );

          if (!allGranted) {
            Toast.show('Camera and microphone permissions required');
            navigation.goBack();
            return;
          }
        } catch (error) {
          console.error('Permission error:', error);
        }
      }

      await initializeCall();
    };

    requestPermissions();
  }, []);

  const initializeCall = async () => {
    try {
      const token = await getToken();

      let meetingId;
      let booking;

      if (isHost) {
        // Host: create new meeting
        meetingId = await createMeeting({ token });
        // Save meeting ID to booking
        await bookingApi.setMeetingId({ bookingId, meetingId });
      } else {
        // Guest: get meeting ID from booking
        booking = await bookingApi.getBooking(bookingId);
        if (!booking.meeting_id) {
          throw new Error('Host has not started the meeting yet');
        }
        meetingId = booking.meeting_id;
        // Validate meeting exists
        await validateMeeting({ meetingId, token });
      }

      setCallParams({ token, meetingId });
      setReady(true);
    } catch (error) {
      Toast.show(error.message || 'Failed to initialize call');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingLeft = async () => {
    try {
      // Only mark as completed if:
      // 1. BOTH mentor and learner joined (joinTimeRef proves both were in call)
      // 2. Meeting lasted at least 10 minutes (600 seconds)
      const endTime = new Date();
      const callDuration = joinTimeRef.current ? Math.round((endTime - joinTimeRef.current) / 1000) : 0;
      const MIN_DURATION_SECONDS = 600; // 10 minutes
      const shouldMarkComplete = !!joinTimeRef.current && callDuration >= MIN_DURATION_SECONDS;

      console.log(`📊 Call ended:`);
      console.log(`   - Participants at end: ${participantCount}`);
      console.log(`   - Join time: ${joinTimeRef.current?.toLocaleTimeString()}`);
      console.log(`   - End time: ${endTime.toLocaleTimeString()}`);
      console.log(`   - Call duration: ${callDuration} seconds (min required: ${MIN_DURATION_SECONDS})`);
      console.log(`   - Duration check: ${callDuration >= MIN_DURATION_SECONDS ? '✅ Pass' : '❌ Fail'}`);
      console.log(`   - Should mark complete: ${shouldMarkComplete}`);
      console.log(`   - Is host: ${isHost}`);

      if (shouldMarkComplete) {
        // Update booking status to completed
        console.log(`✅ Updating booking ${bookingId} status to completed...`);
        await bookingApi.updateBookingStatus({
          bookingId,
          status: 'completed',
        });
        console.log(`✅ Booking status updated successfully`);

        // If host, create earnings record
        if (isHost) {
          const booking = await bookingApi.getBooking(bookingId);

          if (booking) {
            const pricePerHour = booking.mentor_profiles?.price_per_hour || 0;
            console.log(`💰 Creating earnings record: mentorId=${profile.id}, amount=${pricePerHour}`);
            await earningsApi.createEarning({
              mentorId: profile.id,
              bookingId,
              amount: pricePerHour,
            });
            console.log(`✅ Earnings record created`);
          }
        }

        Toast.show('Session completed');
      } else {
        // Check why session wasn't completed
        let reason = '';
        if (!joinTimeRef.current) {
          reason = 'both participants did not join';
          console.log(`⚠️ Session ended - ${reason}. Clearing meeting_id...`);
          try {
            await bookingApi.clearMeetingId(bookingId);
            Toast.show('Session ended - Meeting abandoned');
          } catch (cleanupError) {
            console.error('⚠️ Failed to clean up meeting_id:', cleanupError);
            Toast.show('Session ended');
          }
        } else if (callDuration < MIN_DURATION_SECONDS) {
          reason = `call was too short (${callDuration}s, min: ${MIN_DURATION_SECONDS}s)`;
          console.log(`⚠️ Session ended - ${reason}. Clearing meeting_id...`);
          try {
            await bookingApi.clearMeetingId(bookingId);
            Toast.show(`Session too short (${Math.round(callDuration / 60)}min, need 10min)`);
          } catch (cleanupError) {
            console.error('⚠️ Failed to clean up meeting_id:', cleanupError);
            Toast.show('Session ended');
          }
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error ending call:', error);
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: UNIFIED_THEME.colors.primary.dark,
      }}>
        <LoadingOverlay visible message="Preparing your call..." />
      </View>
    );
  }

  if (!ready || !callParams) {
    return (
      <View style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: UNIFIED_THEME.colors.primary.dark,
      }}>
        <LoadingOverlay visible message="Connecting..." />
      </View>
    );
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: UNIFIED_THEME.colors.primary.dark,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      <MeetingProvider
        config={{
          meetingId: callParams.meetingId,
          micEnabled: false,
          webcamEnabled: false,
          name: profile.name,
          notification: {
            title: 'Session in Progress',
            message: 'Your mentoring session is active',
          },
          defaultCamera: 'front',
        }}
        token={callParams.token}
      >
        <MeetingConsumer onMeetingLeft={handleMeetingLeft}>
          {() => (
            <MeetingContainer
              webcamEnabled={true}
              meetingType="ONE_TO_ONE"
              onParticipantCountChange={setParticipantCount}
              isHost={isHost}
            />
          )}
        </MeetingConsumer>
      </MeetingProvider>
    </View>
  );
}
