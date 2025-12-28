import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity } from 'react-native';
import { StyledText } from './StyledText';

interface CategoryCardProps {
  title: string;
  image: ImageSourcePropType;
  onPress?: () => void;
}

export function CategoryCard({ title, image, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image 
        source={image} 
        style={styles.image}
        resizeMode="cover"
      />
      <StyledText variant="subtitle" style={styles.title}>
        {title}
      </StyledText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
    flexDirection: 'row',
  },
  image: {
    width: '40%',
    height: '100%',
  },
  title: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
    color: '#333',
    fontSize: 26,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
});
