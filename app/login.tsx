import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Animated shapes (Consistent with other pages)
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate floating shapes
    const animateShape = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
    };

    animateShape(shape1Anim, 4000);
    animateShape(shape2Anim, 5000);
    animateShape(shape3Anim, 6000);
    animateShape(shape4Anim, 4500);
    animateShape(shape5Anim, 5500);
  }, []);

  const handleLogin = () => {
    // Implement login logic here
    // console.log('Login pressed', email, password);
    router.replace('/'); // Navigate to home on success
  };

  const handleGoogleLogin = () => {
    // console.log('Google Login pressed');
  };

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundLayer} />

      {/* Animated Floating Shapes */}
      <View style={styles.animatedShapesContainer}>
        <Animated.View style={[styles.floatingShape, styles.circle1, {
          transform: [
            { translateY: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
            { translateX: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square1, {
          transform: [
            { translateY: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
            { rotate: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle2, {
          transform: [
            { translateY: shape3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
            { scale: shape3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square2, {
          transform: [
            { translateY: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 35] }) },
            { translateX: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle3, {
          transform: [
            { translateY: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -45] }) },
            { rotate: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] }) }
          ]
        }]} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        <View style={[styles.formContainer, { marginTop: insets.top + 60 }]}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back, friend!</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={24} color="#CCC" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#CCC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color="#CCC" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#CCC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={32} 
                  color="#FF8C00" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>LET'S GO!</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupLink} 
            onPress={() => router.push('/signup')} // Navigation to Signup
          >
            <Text style={styles.signupLinkText}>
              Don't have an account? <Text style={styles.signupLinkHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.orText}>OR</Text>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={24} color="#FFFFFF" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E8',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5E8',
  },
  animatedShapesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  floatingShape: {
    position: 'absolute',
  },
  // Reused shape styles
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD7E5',
    opacity: 0.3,
    top: 100,
    left: '10%',
  },
  square1: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#D4E4FF',
    opacity: 0.25,
    top: 200,
    right: '15%',
  },
  circle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE4B8',
    opacity: 0.2,
    top: 450,
    left: '60%',
  },
  square2: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#B8E6B8',
    opacity: 0.25,
    top: 600,
    left: '8%',
  },
  circle3: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8D4FF',
    opacity: 0.2,
    top: 500,
    right: '12%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 42,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  inputGroup: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 75,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#FF8C00', // Vibey Orange
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderBottomWidth: 5, // 3D effect
    borderBottomColor: '#CC7000',
  },
  loginButtonText: {
    fontFamily: 'FredokaOne',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  signupLink: {
    marginTop: 20,
  },
  signupLinkText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#999',
  },
  signupLinkHighlight: {
    color: '#FF8C00',
    fontWeight: '700',
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  orText: {
    fontFamily: 'FredokaOne', // Bigger and bolder
    fontSize: 20,
    color: '#CCC',
    marginBottom: 20,
  },
  googleButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#DB4437', // Google Brand Color
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#A83226',
    shadowColor: '#DB4437',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontFamily: 'FredokaOne',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
