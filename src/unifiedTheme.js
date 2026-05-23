/**
 * Unified Theme System — cosmic / galaxy aesthetic
 * Deep space palette, nebula gradients, stellar accents
 */

export const UNIFIED_THEME = {
  colors: {
    primary: {
      void: '#000008',
      dark: '#02010c',
      light: '#050514',
      nebula: '#0a0518',
      gradient: ['#000008', '#040210', '#08061c', '#041020', '#020208'],
    },

    cosmic: {
      nebulaHaze: [
        'rgba(124, 58, 237, 0.14)',
        'rgba(14, 165, 233, 0.07)',
        'rgba(236, 72, 153, 0.04)',
        'rgba(124, 58, 237, 0.1)',
      ],
      nebulaLocations: [0, 0.35, 0.62, 1],
      /** Same stops as CosmicBackground + bottom tab sky */
      mainGradientLocations: [0, 0.28, 0.52, 0.78, 1],
      hazeOpacity: 0.72,
    },

    /** Bottom tab bar — cosmic glass + accents (floating capsule) */
    tabBar: {
      outerRadius: 26,
      glassGradient: [
        'rgba(2, 2, 12, 0.98)',
        'rgba(6, 5, 22, 0.97)',
        'rgba(2, 12, 28, 0.98)',
      ],
      glassBorder: 'rgba(167, 139, 250, 0.22)',
      activeIndicatorGradient: ['#f0d875', '#5eead4'],
      activePillGradient: [
        'rgba(124, 58, 237, 0.38)',
        'rgba(94, 234, 212, 0.22)',
        'rgba(240, 216, 117, 0.12)',
      ],
      iconRingGradient: [
        'rgba(240, 216, 117, 0.55)',
        'rgba(94, 234, 212, 0.35)',
        'rgba(167, 139, 250, 0.4)',
      ],
      rimBorder: 'rgba(94, 234, 212, 0.12)',
      labelShadow: 'rgba(240, 216, 117, 0.4)',
      iconSize: 23,
      iconSizeFocused: 25,
      floating: {
        horizontalInset: 16,
        bottomGap: 12,
        barMinHeight: 64,
        /** Scroll padding reserve (bar + FAB overflow; safe area added separately) */
        contentReserve: 115,
      },
      uploadFabSize: 52,
      uploadFabLift: 22,
      /** Full-width bar: base tint on top of sky gradients */
      flatBarBase: 'rgba(2, 2, 14, 0.97)',
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
      primary: '#f0f0fc',
      secondary: '#b8b8d4',
      muted: '#8888a8',
      disabled: '#545470',
      onAccent: '#060412',
    },

    component: {
      card: 'rgba(255, 255, 255, 0.04)',
      input: 'rgba(255, 255, 255, 0.032)',
      button: '#a78bfa',
      buttonSecondary: 'rgba(167, 139, 250, 0.16)',
      overlay: 'rgba(0, 0, 6, 0.92)',
      disabled: 'rgba(255, 255, 255, 0.025)',
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
