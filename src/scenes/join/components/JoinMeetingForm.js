import { View, StyleSheet } from "react-native";
import TextInputContainer from "../../../components/TextInputContainer";
import Button from "../../../components/Button";

export const JoinMeetingForm = ({
  name,
  onNameChange,
  meetingId,
  onMeetingIdChange,
  onJoinMeeting,
  isLoading,
}) => {
  return (
    <View style={styles.container}>
      <TextInputContainer
        placeholder="Enter your name"
        value={name}
        setValue={onNameChange}
      />

      <TextInputContainer
        placeholder="Enter meeting code"
        value={meetingId}
        setValue={onMeetingIdChange}
      />

      <Button
        text="Join a one-to-one meeting"
        onPress={onJoinMeeting}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
