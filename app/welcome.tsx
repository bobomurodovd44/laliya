import { ImageBackground, StyleSheet, View } from 'react-native';
import { DuoButton } from '../components/DuoButton';
import { StyledText } from '../components/StyledText';

export default function Welcome() {
  return (
    <ImageBackground 
      source={require('../assets/background.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay for better readability */}
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <StyledText variant="title" style={styles.title}>
            🎉 Welcome to Laliya! 🎉
          </StyledText>
          <StyledText variant="subtitle" style={styles.subtitle}>
            Let's have fun learning together!
          </StyledText>
        </View>
        
        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <DuoButton 
            title="🚀 Start Learning" 
            color="green" 
            size="large"
            onPress={() => console.log('Start Learning pressed')}
            style={styles.button}
          />
        </View>
        
        {/* Footer Message */}
        <View style={styles.footer}>
          <StyledText variant="body" style={styles.footerText}>
            Practice speaking, learn new words, and have fun! 🌟
          </StyledText>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#444',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  footerText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
