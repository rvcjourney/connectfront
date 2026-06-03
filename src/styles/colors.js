/**
 * @deprecated Import UNIFIED_THEME from '../unifiedTheme' in new code.
 * Kept for meeting module compatibility — values map to cosmic theme.
 */
import { UNIFIED_THEME } from '../unifiedTheme';

const M = UNIFIED_THEME.colors.meeting;

const colors = {
  primary: {
    100: M[100],
    200: M[200],
    400: M[400],
    500: M[500],
    600: M[600],
    700: M[700],
    800: M[800],
    900: M[900],
  },
  black: UNIFIED_THEME.colors.primary.void,
  purple: M.accent,
};

export default colors;
