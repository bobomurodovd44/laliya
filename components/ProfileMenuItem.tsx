import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuItemProps {
  icon: string;
  title: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
}

export function ProfileMenuItem({ 
  icon, 
  title, 
  onPress,
  variant = 'default'
}: ProfileMenuItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[
          styles.title,
          variant === 'danger' && styles.dangerText
        ]}>
          {title}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'BalsamiqSans',
    color: '#333',
    flex: 1,
  },
  dangerText: {
    color: '#FF4B4B',
  },
  arrow: {
    fontSize: 32,
    color: '#999',
    fontWeight: 'bold',
  },
});
