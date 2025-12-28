import { Ionicons } from '@expo/vector-icons';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from './StyledText';

const routeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  welcome: 'sparkles',
  profile: 'person',
  task: 'list',
};

export function CustomHeader({ options, route }: BottomTabHeaderProps) {
  const insets = useSafeAreaInsets();
  const iconName = routeIcons[route.name] || 'shapes';
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
       <View style={styles.content}>
          <Ionicons name={iconName} size={28} color="#fff" style={styles.icon} />
          <StyledText variant="title" style={styles.title}>
            {options.title || route.name}
          </StyledText>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#58CC02',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    zIndex: 100,
  },
  content: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
