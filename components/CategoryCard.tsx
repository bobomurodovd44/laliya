import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StyledText } from './StyledText';

interface CategoryCardProps {
  title: string;
  image: ImageSourcePropType;
  onPress?: () => void;
}

const colorThemes = {
  '🐾 Animals': { 
    gradient: ['#FF6B9D', '#C44569'] as const,
    accent: '#FFE66D',
    icon: '🐾'
  },
  '🍎 Foods': { 
    gradient: ['#FFA502', '#FF6348'] as const,
    accent: '#FFE66D',
    icon: '🍎'
  },
  '👨‍👩‍👧 Family': { 
    gradient: ['#4ECDC4', '#44A08D'] as const,
    accent: '#FFE66D',
    icon: '👨‍👩‍👧'
  },
  '🏠 Home & Pets': { 
    gradient: ['#A8E6CF', '#56AB91'] as const,
    accent: '#FFE66D',
    icon: '🏠'
  },
};

export function CategoryCard({ title, image, onPress }: CategoryCardProps) {
  const theme = colorThemes[title as keyof typeof colorThemes] || colorThemes['🐾 Animals'];
  const cleanTitle = title.replace(/[^\w\s&]/g, '').trim();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={styles.container}
    >
      {/* Card Shadow Base */}
      <View style={[styles.shadowBase, { backgroundColor: theme.gradient[1] }]} />
      
      {/* Main Card */}
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Image 
            source={image} 
            style={styles.image}
            contentFit="cover"
          />
          {/* Image Overlay Gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
        </View>
        
        {/* Title Section with Gradient */}
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.titleSection}
        >
          {/* Decorative Pattern */}
          <View style={styles.patternContainer}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>
          
          {/* Title Content */}
          <View style={styles.titleContent}>
            <StyledText variant="subtitle" style={styles.title}>
              {cleanTitle}
            </StyledText>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  shadowBase: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    height: 170,
    borderRadius: 28,
    opacity: 0.3,
  },
  card: {
    width: '100%',
    height: 170,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
    flexDirection: 'row',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  imageSection: {
    width: '45%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  titleSection: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    top: '50%',
    right: 20,
  },
  titleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
