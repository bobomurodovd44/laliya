import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface DuoButtonProps {
  title: string;
  onPress?: () => void;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const colorSchemes = {
  green: {
    top: '#58CC02',
    bottom: '#46A302',
    border: '#3D8C02',
  },
  blue: {
    top: '#1CB0F6',
    bottom: '#1899D6',
    border: '#1577B3',
  },
  red: {
    top: '#FF4B4B',
    bottom: '#E03E3E',
    border: '#C43535',
  },
  yellow: {
    top: '#FFC800',
    bottom: '#FFAB00',
    border: '#E09600',
  },
  purple: {
    top: '#CE82FF',
    bottom: '#B565E0',
    border: '#9D52C4',
  },
};

const sizes = {
  small: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    borderRadius: 16,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    fontSize: 18,
    borderRadius: 20,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    fontSize: 22,
    borderRadius: 24,
  },
};

export function DuoButton({ 
  title, 
  onPress, 
  color = 'green', 
  size = 'medium',
  style 
}: DuoButtonProps) {
  const colors = colorSchemes[color];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {/* Shadow/Bottom layer */}
      <View 
        style={[
          styles.shadowLayer,
          {
            backgroundColor: colors.border,
            borderRadius: sizeStyle.borderRadius,
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            paddingBottom: sizeStyle.paddingVertical + 8,
          }
        ]} 
      >
        {/* Main button layer */}
        <View 
          style={[
            styles.buttonLayer,
            {
              backgroundColor: colors.top,
              borderRadius: sizeStyle.borderRadius,
              paddingVertical: sizeStyle.paddingVertical,
              paddingHorizontal: sizeStyle.paddingHorizontal,
              borderBottomWidth: 4,
              borderBottomColor: colors.bottom,
            }
          ]}
        >
          <Text 
            style={[
              styles.text,
              { fontSize: sizeStyle.fontSize }
            ]}
          >
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container for the button
  },
  shadowLayer: {
    // This creates the 3D depth effect
  },
  buttonLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'BalsamiqSans',
    textAlign: 'center',
  },
});
