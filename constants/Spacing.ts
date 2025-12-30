export const Spacing = {
  // Spacing Scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  huge: 60,
  
  // Common Spacing
  padding: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  // Border Radius
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 30,
    round: 999,
  },
  
  // Dimensions
  size: {
    buttonHeight: {
      small: 48,
      medium: 56,
      large: 60,
    },
    icon: {
      small: 20,
      medium: 24,
      large: 28,
      xlarge: 32,
      xxlarge: 40,
    },
    avatar: {
      small: 40,
      medium: 60,
      large: 80,
      xlarge: 120,
    },
    card: {
      small: 100,
      medium: 135,
      large: 200,
    },
  },
  
  // Shadow Presets
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    xlarge: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
  },
  
  // Border Width
  borderWidth: {
    thin: 1,
    medium: 2,
    thick: 3,
    xthick: 4,
    xxthick: 5,
    xxxthick: 6,
  },
} as const;

