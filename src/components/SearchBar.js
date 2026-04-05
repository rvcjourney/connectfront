import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UNIFIED_THEME } from '../unifiedTheme';

const T = UNIFIED_THEME;

const ICON_SLOT = 44;

/**
 * Search field — aligned text, focus ring, stable trailing slot (no layout jump on clear).
 */
export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search mentors...',
  containerStyle,
  onSubmitEditing,
  autoFocus,
  editable = true,
}) => {
  const [focused, setFocused] = useState(false);
  const text = value ?? '';

  return (
    <View
      style={[
        styles.container,
        focused ? styles.containerFocused : null,
        containerStyle,
      ]}
    >
      <View style={styles.iconLead} pointerEvents="none">
        <MaterialIcons
          name="search"
          size={22}
          color={focused ? T.colors.accent.secondary : T.colors.text.muted}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={T.colors.text.muted}
        value={text}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        editable={editable}
        underlineColorAndroid="transparent"
        selectionColor={T.colors.accent.secondary}
      />

      <View style={styles.iconTrail}>
        {text.length > 0 ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearInner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <View style={styles.clearChip}>
              <MaterialIcons name="close" size={18} color={T.colors.text.primary} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.colors.component.input,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border.light,
    marginBottom: T.spacing.lg,
    minHeight: 50,
    paddingHorizontal: 2,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  containerFocused: {
    borderColor: T.colors.border.default,
    backgroundColor: T.colors.component.card,
    ...Platform.select({
      ios: {
        shadowColor: T.colors.accent.secondary,
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  iconLead: {
    width: ICON_SLOT,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTrail: {
    width: ICON_SLOT,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.colors.border.light,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    paddingRight: T.spacing.xs,
    margin: 0,
    ...T.typography.bodyMd,
    color: T.colors.text.primary,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : {}),
  },
});
