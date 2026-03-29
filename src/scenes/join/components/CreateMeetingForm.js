import { View, StyleSheet } from "react-native";
import TextInputContainer from "../../../components/TextInputContainer";
import Button from "../../../components/Button";

export const CreateMeetingForm = ({
  name,
  onNameChange,
  onCreateMeeting,
  isLoading,
}) => {
  return (
    <View style={styles.container}>
      <TextInputContainer
        placeholder="Enter your name"
        value={name}
        setValue={onNameChange}
      />

      <Button
        text="Create a one-to-one meeting"
        onPress={onCreateMeeting}
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
