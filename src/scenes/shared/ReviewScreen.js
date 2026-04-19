import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { reviewsApi } from '../../api/reviewsApi';
import { useAuth } from '../../hooks/useAuth';

const T = UNIFIED_THEME;

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function ReviewScreen({ navigation, route }) {
  const { bookingId, mentorId, mentorName } = route.params;
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Toast.show('Please select a rating'); return; }
    try {
      setSubmitting(true);
      await reviewsApi.submitReview({
        bookingId,
        mentorId,
        learnerId: profile.id,
        rating,
        comment: comment.trim(),
      });
      Toast.show('Review submitted. Thank you!');
      navigation.goBack();
    } catch (err) {
      Toast.show(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + T.spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color={T.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Session</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Mentor name */}
        <View style={styles.mentorRow}>
          <View style={styles.mentorIcon}>
            <MaterialIcons name="person" size={24} color={T.colors.accent.secondary} />
          </View>
          <View>
            <Text style={styles.mentorLabel}>Your mentor</Text>
            <Text style={styles.mentorName}>{mentorName}</Text>
          </View>
        </View>

        {/* Stars */}
        <Text style={styles.sectionLabel}>How was your session?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7} style={styles.starBtn}>
              <MaterialIcons
                name={i <= rating ? 'star' : 'star-outline'}
                size={44}
                color={i <= rating ? T.colors.accent.warning : T.colors.text.muted}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
        )}

        {/* Comment */}
        <Text style={styles.sectionLabel}>Add a comment (optional)</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this mentor…"
            placeholderTextColor={T.colors.text.muted}
            multiline
            numberOfLines={4}
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/300</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnOff]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={rating > 0 ? [T.colors.accent.secondary, T.colors.component.button] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            <MaterialIcons name="star" size={18} color={rating > 0 ? T.colors.text.onAccent : T.colors.text.muted} />
            <Text style={[styles.submitTxt, rating === 0 && { color: T.colors.text.muted }]}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.colors.primary.dark },
  scroll: { flex: 1 },
  content: { padding: T.spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.xl,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.colors.component.card,
    borderWidth: 1, borderColor: T.colors.border.light,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.colors.text.primary },

  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.md,
    backgroundColor: T.colors.component.card,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.lg,
    marginBottom: T.spacing.xl,
  },
  mentorIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(94,234,212,0.12)',
    borderWidth: 1, borderColor: 'rgba(94,234,212,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  mentorLabel: { fontSize: 11, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  mentorName: { fontSize: 16, fontWeight: '700', color: T.colors.text.primary, marginTop: 2 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: T.colors.text.secondary, marginBottom: T.spacing.md },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  starBtn: { padding: 4 },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: T.colors.accent.warning,
    marginBottom: T.spacing.xl,
  },

  inputCard: {
    backgroundColor: T.colors.component.input,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    padding: T.spacing.md,
    marginBottom: T.spacing.xl,
  },
  input: {
    color: T.colors.text.primary,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
  },
  charCount: { fontSize: 11, color: T.colors.text.muted, textAlign: 'right', marginTop: T.spacing.xs },

  submitBtn: { borderRadius: T.borderRadius.lg, overflow: 'hidden' },
  submitBtnOff: { opacity: 0.5 },
  submitGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md + 2,
  },
  submitTxt: { fontSize: 15, fontWeight: '700', color: T.colors.text.onAccent },
});
