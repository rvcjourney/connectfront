/**
 * Unified Theme System — cosmic / galaxy aesthetic
 * Deep space palette, nebula gradients, stellar accents
 */

export const UNIFIED_THEME = {
  colors: {
    primary: {
      void: '#020014',
      dark: '#06061f',
      light: '#0c0c28',
      nebula: '#140a32',
      gradient: ['#020014', '#0a0628', '#120a38', '#082040', '#040818'],
    },

    cosmic: {
      nebulaHaze: [
        'rgba(124, 58, 237, 0.22)',
        'rgba(14, 165, 233, 0.12)',
        'rgba(236, 72, 153, 0.08)',
        'rgba(124, 58, 237, 0.18)',
      ],
      nebulaLocations: [0, 0.35, 0.62, 1],
      /** Same stops as CosmicBackground + bottom tab sky */
      mainGradientLocations: [0, 0.28, 0.52, 0.78, 1],
      hazeOpacity: 0.85,
    },

    /** Bottom tab bar — cosmic glass + accents (capsule or full-width bar) */
    tabBar: {
      outerRadius: 24,
      glassGradient: [
        'rgba(244, 244, 255, 0.08)',
        'rgba(167, 139, 250, 0.14)',
        'rgba(94, 234, 212, 0.09)',
      ],
      activePillGradient: [
        'rgba(167, 139, 250, 0.32)',
        'rgba(94, 234, 212, 0.16)',
      ],
      rimBorder: 'rgba(94, 234, 212, 0.12)',
      labelShadow: 'rgba(240, 216, 117, 0.4)',
      iconSize: 23,
      iconSizeFocused: 26,
      /** Full-width bar: base tint on top of sky gradients */
      flatBarBase: 'rgba(6, 6, 31, 0.94)',
      /** Top edge shimmer (horizontal) */
      flatBarEdge: [
        'rgba(94, 234, 212, 0.45)',
        'rgba(167, 139, 250, 0.35)',
        'rgba(240, 216, 117, 0.25)',
        'rgba(94, 234, 212, 0.2)',
      ],
      /** Material top tabs — soft nebula panel behind active tab */
      topNavActiveWash: [
        'rgba(124, 58, 237, 0.14)',
        'rgba(94, 234, 212, 0.1)',
        'rgba(236, 72, 153, 0.06)',
      ],
      /** Top tabs — icon ring (stellar halo) */
      topNavIconRing: [
        'rgba(240, 216, 117, 0.35)',
        'rgba(94, 234, 212, 0.2)',
        'rgba(167, 139, 250, 0.25)',
      ],
    },

    accent: {
      primary: '#f0d875',
      secondary: '#5eead4',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
    },

    text: {
      primary: '#f4f4ff',
      secondary: '#c4c4e0',
      muted: '#9090b8',
      disabled: '#5c5c78',
      onAccent: '#0a0520',
    },

    component: {
      card: 'rgba(255, 255, 255, 0.07)',
      input: 'rgba(255, 255, 255, 0.06)',
      button: '#a78bfa',
      buttonSecondary: 'rgba(167, 139, 250, 0.2)',
      overlay: 'rgba(2, 0, 20, 0.82)',
      disabled: 'rgba(255, 255, 255, 0.04)',
    },

    border: {
      light: 'rgba(167, 139, 250, 0.22)',
      default: 'rgba(94, 234, 212, 0.28)',
      strong: 'rgba(240, 216, 117, 0.45)',
      accent: '#5eead4',
    },

    status: {
      pending: '#fbbf24',
      approved: '#34d399',
      rejected: '#f87171',
      active: '#34d399',
      inactive: '#6b7280',
      available: '#34d399',
      unavailable: '#f87171',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 50,
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: 'rgba(167, 139, 250, 0.45)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
    },
    medium: {
      shadowColor: 'rgba(94, 234, 212, 0.35)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: 'rgba(124, 58, 237, 0.55)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 12,
    },
    glow: {
      shadowColor: '#c4b5fd',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 22,
      elevation: 12,
    },
  },

  typography: {
    headingXL: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    headingLg: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    headingMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    headingSm: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    headingXs: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
    bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySm: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    bodyXs: { fontSize: 11, fontWeight: '400', lineHeight: 14 },
    labelLg: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    labelMd: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
    labelSm: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  },
};

export default UNIFIED_THEME;
