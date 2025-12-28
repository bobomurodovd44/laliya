import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { CategoryCard } from '../components/CategoryCard';
import { StyledText } from '../components/StyledText';

export default function Index() {
  return (
    <ImageBackground 
      source={require('../assets/background.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Decorative Shapes */}
          <View style={styles.decorativeShapes}>
            <View style={[styles.shape, styles.shapeCircle1]} />
            <View style={[styles.shape, styles.shapeSquare1]} />
            <View style={[styles.shape, styles.shapeCircle2]} />
            <View style={[styles.shape, styles.shapeSquare2]} />
          </View>
          
          <StyledText variant="title" style={styles.title}>
            Choose a Category
          </StyledText>
          <StyledText variant="body" style={styles.subtitle}>
            Pick what you want to learn today!
          </StyledText>
        </View>
        
        {/* Category List */}
        <View style={styles.categoryList}>
          <CategoryCard 
            title="🐾 Animals"
            image={require('../assets/animals.jpg')}
            onPress={() => {}}
          />
          
          <CategoryCard 
            title="🍎 Foods"
            image={require('../assets/foods.jpg')}
            onPress={() => {}}
          />
          
          <CategoryCard 
            title="👨‍👩‍👧 Family"
            image={require('../assets/family.jpg')}
            onPress={() => {}}
          />
          
          <CategoryCard 
            title="🏠 Home & Pets"
            image={require('../assets/home_animals.jpg')}
            onPress={() => {}}
          />
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 45,
    marginTop: 20,
    position: 'relative',
    paddingVertical: 10,
  },
  decorativeShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  shape: {
    position: 'absolute',
    opacity: 0.25,
  },
  shapeCircle1: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    top: -10,
    left: '10%',
  },
  shapeSquare1: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FF6B9D',
    top: 20,
    right: '8%',
    transform: [{ rotate: '15deg' }],
  },
  shapeCircle2: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4ECDC4',
    bottom: -15,
    left: '15%',
  },
  shapeSquare2: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: '#FFA502',
    bottom: 0,
    right: '12%',
    transform: [{ rotate: '-10deg' }],
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#444',
    fontSize: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryList: {
    width: '100%',
  },
  bottomSpacer: {
    height: 20,
  },
});
