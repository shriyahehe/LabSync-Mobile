
export const LabSyncColors = {
  background: '#F5F3EC',
  surface: '#FCFBF7',
  surfaceSecondary: '#F0EFE7',

  primary: '#176B63',
  primaryDark: '#10564F',
  primaryLight: '#DCE9E3',

  secondary: '#527A8A',
  secondaryLight: '#E4EDF0',

  accent: '#B77932',
  accentLight: '#F4E9D8',

  ink: '#172A36',
  text: '#344650',
  muted: '#65747C',
  subtle: '#929D9E',

  border: '#D8DDD8',
  divider: '#E6E5DD',

  success: '#27815D',
  successLight: '#E2EFE7',

  warning: '#B77932',
  warningLight: '#F7EEDC',

  danger: '#B84A42',
  dangerLight: '#F5E5E2',

  white: '#FFFFFF',
  black: '#000000',
}

export const LabSyncSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
}

export const LabSyncRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
}

export const LabSyncTypography = {
  display: 32,
  heading1: 26,
  heading2: 21,
  heading3: 17,
  body: 14,
  bodySmall: 12,
  caption: 10,
  eyebrow: 9,
}

export const LabSyncShadows = {
  card: {
    shadowColor: '#172A36',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  floating: {
    shadowColor: '#172A36',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
}

export const LabSyncTheme = {
  colors: LabSyncColors,
  spacing: LabSyncSpacing,
  radius: LabSyncRadius,
  typography: LabSyncTypography,
  shadows: LabSyncShadows,
}

export default LabSyncTheme
