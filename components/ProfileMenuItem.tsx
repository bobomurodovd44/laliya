import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
  iconColor?: string;
  disabled?: boolean;
}

const iconColors = {
  'trash-outline': '#FF4B4B',
  'log-out-outline': '#FF9500',
  'share-social-outline': '#007AFF',
  'star-outline': '#FFD700',
  'document-text-outline': '#8E44AD',
};

export function ProfileMenuItem({ 
  iconName, 
  title, 
  onPress,
  variant = 'default',
  iconColor,
  disabled = false
}: ProfileMenuItemProps) {
  const defaultColor = iconColors[iconName as keyof typeof iconColors] || '#58CC02';
  const finalIconColor = iconColor || (variant === 'danger' ? '#FF4B4B' : defaultColor);
  const backgroundColor = `${finalIconColor}15`; // 15 is hex for ~8% opacity
  const shadowColor = `${finalIconColor}66`; // 66 is hex for ~40% opacity - lighter shadow
  
  return (
    <View style={styles.wrapper}>
      {/* 3D Shadow Layer - Matches icon color */}
      <View style={[styles.shadowLayer, { backgroundColor: shadowColor }]} />
      
      {/* Main Button */}
      <TouchableOpacity 
        style={[styles.container, disabled && styles.disabled]} 
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.8}
        disabled={disabled}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor }]}>
            <Ionicons name={iconName} size={32} color={finalIconColor} />
          </View>
          <Text style={[
            styles.title,
            variant === 'danger' && styles.dangerText,
            disabled && styles.disabledText
          ]}>
            {title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={28} color="#999" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 20,
    transform: [{ translateY: 4 }],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: 'BalsamiqSans',
    color: '#333',
    flex: 1,
    fontWeight: '600',
  },
  dangerText: {
    color: '#FF4B4B',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
});
