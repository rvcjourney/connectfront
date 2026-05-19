import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import MentorProfileScreen from '../shared/MentorProfileScreen';

export default function MentorDashboardScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();

  return (
    <MentorProfileScreen
      route={{ params: { mentorId: profile?.id } }}
      navigation={navigation}
    />
  );
}
