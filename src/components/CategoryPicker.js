import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';
import { fetchActiveCategoryNames } from '../api/contentApi';

const CATEGORIES = [
  'Technology (IT & Software)',
  'Artificial Intelligence & Data Science',
  'Healthcare & Medical Services',
  'Finance & Economic Services',
  'Business Management & Strategy',
  'Marketing & Communications',
  'Education & Training',
  'Renewable Energy & Sustainability',
  'Transportation & Logistics',
  'Legal & Compliance',
  'Creator Economy & Social Influencing',
  'Astrology & Occult Sciences',
  'Gaming & Esports',
  'Health, Wellness & Sports Performance',
  'UI/UX & No-Code Development',
  'Human-Machine Interaction & AI Ethics',
  'Advanced Manufacturing & Robotics',
  'Fractional & Gig Leadership',
  'Mental Health & Specialized Therapy',
  'ESG & Carbon Management',
  'Others',
];

export const CategoryPicker = ({ visible, selectedCategory, onSelect, onClose }) => {
  const [adminCategories, setAdminCategories] = useState([]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchActiveCategoryNames().then((names) => {
      if (!cancelled) setAdminCategories(names || []);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const allCategories = useMemo(() => {
    const set = new Set([...(adminCategories || []), ...CATEGORIES]);
    return Array.from(set);
  }, [adminCategories]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={UNIFIED_THEME.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Your Category</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryItem,
                selectedCategory === category && styles.categoryItemSelected,
              ]}
              onPress={() => {
                onSelect(category);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
              {selectedCategory === category && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={UNIFIED_THEME.colors.primary.light}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  headerTitle: {
    ...UNIFIED_THEME.typography.headingMd,
    color: UNIFIED_THEME.colors.text.primary,
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    marginVertical: UNIFIED_THEME.spacing.xs,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  categoryItemSelected: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderColor: UNIFIED_THEME.colors.primary.dark,
  },
  categoryText: {
    ...UNIFIED_THEME.typography.bodyMd,
    color: UNIFIED_THEME.colors.text.primary,
    flex: 1,
  },
  categoryTextSelected: {
    fontWeight: '600',
    color: UNIFIED_THEME.colors.primary.dark,
  },
});
