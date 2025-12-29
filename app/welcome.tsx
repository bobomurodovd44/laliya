import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet, View } from 'react-native';
import { DuoButton } from '../components/DuoButton';
import { StyledText } from '../components/StyledText';

export default function Welcome() {
  const router = useRouter();
  
  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  
  // Shape animation values
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;
  const shape6Anim = useRef(new Animated.Value(0)).current;
  
  // Parrot animation
  const parrotAnim = useRef(new Animated.Value(0)).current;
  
  // Sparkle animations
  const sparkle1Anim = useRef(new Animated.Value(0)).current;
  const sparkle2Anim = useRef(new Animated.Value(0)).current;
  const sparkle3Anim = useRef(new Animated.Value(0)).current;
  const sparkle4Anim = useRef(new Animated.Value(0)).current;

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

    // Continuous floating animations for shapes
    const createFloatingAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start floating animations with different speeds
    createFloatingAnimation(shape1Anim, 3000).start();
    createFloatingAnimation(shape2Anim, 2500).start();
    createFloatingAnimation(shape3Anim, 3500).start();
    createFloatingAnimation(shape4Anim, 2800).start();
    createFloatingAnimation(shape5Anim, 3200).start();
    createFloatingAnimation(shape6Anim, 2700).start();

    // Parrot bouncing animation - very slow and smooth
    Animated.loop(
      Animated.sequence([
        Animated.spring(parrotAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 10,
        }),
        Animated.spring(parrotAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 10,
        }),
      ])
    ).start();

    // Sparkle animations with different timings
    const createSparkleAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createSparkleAnimation(sparkle1Anim, 0).start();
    createSparkleAnimation(sparkle2Anim, 400).start();
    createSparkleAnimation(sparkle3Anim, 200).start();
    createSparkleAnimation(sparkle4Anim, 600).start();
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

  // Shape floating animations
  const shape1TranslateY = shape1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const shape2TranslateY = shape2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const shape3TranslateY = shape3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const shape4TranslateY = shape4Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  const shape5TranslateY = shape5Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const shape6TranslateY = shape6Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  // Rotation animations for some shapes
  const shape1Rotate = shape1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const shape2Rotate = shape2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20deg', '25deg'],
  });

  const shape4Rotate = shape4Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '50deg'],
  });

  const shape6Rotate = shape6Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '-10deg'],
  });

  // Parrot animation interpolations - very gentle and subtle
  const parrotTranslateY = parrotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const parrotRotate = parrotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const parrotScale = parrotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });

  // Sparkle interpolations
  const sparkle1Opacity = sparkle1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkle1Scale = sparkle1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
  });

  const sparkle2Opacity = sparkle2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkle2Scale = sparkle2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
  });

  const sparkle3Opacity = sparkle3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkle3Scale = sparkle3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
  });

  const sparkle4Opacity = sparkle4Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkle4Scale = sparkle4Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
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
          {/* Decorative Shapes */}
          <View style={styles.decorativeShapes}>
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeCircle1,
                { transform: [{ translateY: shape1TranslateY }, { rotate: shape1Rotate }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeSquare1,
                { transform: [{ translateY: shape2TranslateY }, { rotate: shape2Rotate }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeCircle2,
                { transform: [{ translateY: shape3TranslateY }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeStar1,
                { transform: [{ translateY: shape4TranslateY }, { rotate: shape4Rotate }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeCircle3,
                { transform: [{ translateY: shape5TranslateY }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.shape, 
                styles.shapeSquare2,
                { transform: [{ translateY: shape6TranslateY }, { rotate: shape6Rotate }] }
              ]} 
            />
          </View>

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
          {/* Parrot with Sparkles Container */}
          <View style={styles.parrotContainer}>
            {/* Sparkle Stars */}
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkle1,
                {
                  opacity: sparkle1Opacity,
                  transform: [{ scale: sparkle1Scale }],
                }
              ]}
            >
              ✨
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkle2,
                {
                  opacity: sparkle2Opacity,
                  transform: [{ scale: sparkle2Scale }],
                }
              ]}
            >
              ⭐
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkle3,
                {
                  opacity: sparkle3Opacity,
                  transform: [{ scale: sparkle3Scale }],
                }
              ]}
            >
              ✨
            </Animated.Text>
            
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkle4,
                {
                  opacity: sparkle4Opacity,
                  transform: [{ scale: sparkle4Scale }],
                }
              ]}
            >
              ⭐
            </Animated.Text>

            {/* Parrot Image */}
            <Animated.Image
              source={require('../assets/parrot.png')}
              style={[
                styles.parrotImage,
                {
                  transform: [
                    { 
                      scale: Animated.multiply(
                        buttonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                        parrotScale
                      )
                    },
                    { translateY: parrotTranslateY },
                    { rotate: parrotRotate }
                  ]
                }
              ]}
              resizeMode="contain"
            />
          </View>
          
          {/* Button with Sparkle */}
          <View style={styles.buttonWrapper}>
            {/* Single Button Sparkle */}
            <Animated.Text
              style={[
                styles.buttonSparkle,
                {
                  opacity: sparkle2Opacity,
                  transform: [{ scale: sparkle2Scale }],
                }
              ]}
            >
              ⭐
            </Animated.Text>

            <DuoButton 
              title="Start Learning" 
              color="green" 
              size="large"
              onPress={() => router.push('/')}
              style={styles.button}
            />
          </View>
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
    paddingVertical: 120, // Adjusted for transparent header
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
    paddingVertical: 30,
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
    opacity: 0.3,
  },
  shapeCircle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    top: -10,
    left: '8%',
  },
  shapeSquare1: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#FF6B9D',
    top: -5,
    right: '8%',
    transform: [{ rotate: '20deg' }],
  },
  shapeCircle2: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4ECDC4',
    bottom: 0,
    left: '10%',
  },
  shapeStar1: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFA502',
    top: '40%',
    right: '5%',
    transform: [{ rotate: '45deg' }],
  },
  shapeCircle3: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#A8E6CF',
    bottom: -5,
    right: '12%',
  },
  shapeSquare2: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: '#CE82FF',
    top: '42%',
    left: '4%',
    transform: [{ rotate: '-15deg' }],
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
  parrotContainer: {
    position: 'relative',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 32,
  },
  sparkle1: {
    top: 20,
    left: 20,
  },
  sparkle2: {
    top: 30,
    right: 15,
  },
  sparkle3: {
    bottom: 30,
    left: 15,
  },
  sparkle4: {
    bottom: 20,
    right: 20,
  },
  parrotImage: {
    width: 240,
    height: 240,
    marginBottom: 20,
  },
  buttonWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSparkle: {
    position: 'absolute',
    fontSize: 28,
    top: -8,
    right: '10%',
  },
  button: {
    width: '100%',
    marginBottom: 30,
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
