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
          <StyledText variant="title" style={styles.title}>
            🎯 Choose a Category
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
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
