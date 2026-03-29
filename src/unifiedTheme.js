/**
 * Unified Theme System
 * Single source of truth for all colors, spacing, typography, and shadows
 * Used across all 30+ screens in the application
 */

export const UNIFIED_THEME = {
  // Core Color Palette
  colors: {
    // Primary gradient backgrounds
    primary: {
      light: '#0f1b3f',      // Main dark blue background
      dark: '#0a0f20',       // Darker variant for layers
      gradient: ['#0f1b3f', '#1a0033', '#0d0015'],
    },

    // Accent colors (unified across entire app - NO MORE ADMIN-ONLY COLORS)
    accent: {
      primary: '#f8559c',    // Neon pink (primary action, borders, accents)
      secondary: '#00d4ff',  // Cyan (secondary accent, highlights)
      success: '#10B981',    // Unified green for all success states
      warning: '#F59E0B',    // Unified orange for warnings
      error: '#EF4444',      // Unified red for errors
      info: '#3B82F6',       // Blue for info messages
    },

    // Text colors
    text: {
      primary: '#ffffff',           // Main text
      secondary: '#e0e0e0',         // Secondary text
      muted: '#b0b0b0',             // Muted/disabled text
      disabled: '#707070',          // Disabled state text
      onAccent: '#ffffff',          // Text on accent background
    },

    // Component backgrounds
    component: {
      card: 'rgba(255, 255, 255, 0.08)',           // Glassmorphic card
      input: 'rgba(255, 255, 255, 0.05)',          // Input field
      button: '#f8559c',                           // Primary button
      buttonSecondary: 'rgba(255, 0, 110, 0.15)',  // Ghost/secondary button
      overlay: 'rgba(0, 0, 0, 0.7)',               // Modal overlay
      disabled: 'rgba(255, 255, 255, 0.03)',       // Disabled component
    },

    // Border colors
    border: {
      light: 'rgba(255, 0, 110, 0.15)',   // Light/subtle borders
      default: 'rgba(255, 0, 110, 0.3)',  // Standard borders (inputs, cards)
      strong: 'rgba(255, 0, 110, 0.5)',   // Strong/prominent borders
      accent: '#ff006e',                   // Accent color borders
    },

    // Status-specific colors (consistent everywhere)
    status: {
      pending: '#F59E0B',       // Orange - waiting/processing
      approved: '#10B981',      // Green - approved/confirmed
      rejected: '#EF4444',      // Red - rejected/cancelled
      active: '#10B981',        // Green - active/online
      inactive: '#707070',      // Gray - inactive/offline
      available: '#10B981',     // Green - available/open
      unavailable: '#EF4444',   // Red - unavailable/closed
    },
  },

  // Consistent spacing scale
  spacing: {
    xs: 4,      // Extra small
    sm: 8,      // Small
    md: 12,     // Medium
    lg: 16,     // Large
    xl: 20,     // Extra large
    xxl: 24,    // 2x extra large
    xxxl: 32,   // 3x extra large
  },

  // Border radius for consistency
  borderRadius: {
    sm: 8,      // Small (input fields)
    md: 12,     // Medium (cards, buttons)
    lg: 16,     // Large (sections)
    xl: 20,     // Extra large
    round: 50,  // Circular (avatar, rounded button)
  },

  // Shadow/elevation system
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: 'rgba(255, 0, 110, 0.3)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: 'rgba(255, 0, 110, 0.4)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 5,
    },
    large: {
      shadowColor: 'rgba(255, 0, 110, 0.6)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 15,
      elevation: 10,
    },
    glow: {
      shadowColor: '#ff006e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10,
    },
  },

  // Typography scale
  typography: {
    // Headings
    headingXL: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    headingLg: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    headingMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    headingSm: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    headingXs: { fontSize: 18, fontWeight: '600', lineHeight: 24 },

    // Body text
    bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySm: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    bodyXs: { fontSize: 11, fontWeight: '400', lineHeight: 14 },

    // Labels
    labelLg: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    labelMd: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
    labelSm: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  },
};

export default UNIFIED_THEME;
