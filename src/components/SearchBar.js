import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Close } from '../assets/icons';
import { UNIFIED_THEME } from '../unifiedTheme';

export const SearchBar = ({ value, onChangeText, placeholder = 'Search mentors...' }) => {
  return (
    <View style={styles.container}>
      <Search width={20} height={20} fill={UNIFIED_THEME.colors.text.secondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={UNIFIED_THEME.colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Close width={20} height={20} fill={UNIFIED_THEME.colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: UNIFIED_THEME.spacing.md,
    marginVertical: UNIFIED_THEME.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    ...UNIFIED_THEME.typography.bodySm,
    color: UNIFIED_THEME.colors.text.primary,
  },
});
