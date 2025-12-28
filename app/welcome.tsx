import { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet, View } from 'react-native';
import { DuoButton } from '../components/DuoButton';
import { StyledText } from '../components/StyledText';

export default function Welcome() {
  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential entrance animations
    Animated.sequence([
      // Header appears first
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      // Button appears with bounce
      Animated.spring(buttonAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 12,
      }),
      // Footer fades in last
      Animated.spring(footerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
    ]).start();
  }, []);

  // Interpolate animations
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const buttonTranslateY = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const footerTranslateY = footerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

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
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerTranslateY }],
            }
          ]}
        >
          <StyledText variant="title" style={styles.title}>
            Welcome to Laliya!
          </StyledText>
          <StyledText variant="subtitle" style={styles.subtitle}>
            Let's have fun learning together!
          </StyledText>
        </Animated.View>
        
        {/* Main Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: buttonAnim,
              transform: [{ translateY: buttonTranslateY }],
            }
          ]}
        >
          <DuoButton 
            title="🚀 Start Learning" 
            color="green" 
            size="large"
            onPress={() => {}}
            style={styles.button}
          />
        </Animated.View>
        
        {/* Footer Message */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: footerAnim,
              transform: [{ translateY: footerTranslateY }],
            }
          ]}
        >
          <StyledText variant="body" style={styles.footerText}>
            Practice speaking, learn new words, and have fun! 🌟
          </StyledText>
        </Animated.View>
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
