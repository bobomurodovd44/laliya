export const Typography = {
  // Font Families
  fontFamily: {
    primary: 'FredokaOne',
    secondary: 'BalsamiqSans',
    tertiary: 'PatrickHand',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32,
    huge: 42,
    massive: 48,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
  },
  
  // Typography Presets
  presets: {
    title: {
      fontFamily: 'FredokaOne',
      fontSize: 32,
      color: '#333333',
      fontWeight: '700',
    },
    subtitle: {
      fontFamily: 'BalsamiqSans',
      fontSize: 18,
      color: '#666666',
      fontWeight: '400',
    },
    body: {
      fontFamily: 'BalsamiqSans',
      fontSize: 16,
      color: '#333333',
      fontWeight: '400',
    },
    caption: {
      fontFamily: 'BalsamiqSans',
      fontSize: 14,
      color: '#999999',
      fontWeight: '400',
    },
    button: {
      fontFamily: 'FredokaOne',
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: 1,
    },
  },
} as const;

