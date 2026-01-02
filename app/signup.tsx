import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { PageContainer } from '../components/layout/PageContainer';
import { Body, Title, Subtitle } from '../components/Typography';
import { Colors, Spacing, Typography } from '../constants';
import { signUpWithEmailPassword } from '../lib/auth/firebase-auth';
import { authenticateWithFeathers } from '../lib/auth/feathers-auth';
import { useAuthStore } from '../lib/store/auth-store';

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthenticated } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Step 1: Create user with Firebase
      const { accessToken } = await signUpWithEmailPassword(
        email.trim(),
        password
      );

      // Step 2: Authenticate with Feathers backend
      // For signup, we pass fullName and role to create the user in the backend
      const feathersResult = await authenticateWithFeathers(accessToken, {
        fullName: name.trim(),
        role: 'user',
      });

      // Step 3: Update auth store with user data
      setAuthenticated(feathersResult.user);

      // Step 4: Check if user has childMeta and redirect accordingly
      // New users won't have childMeta, so redirect to add-child
      const hasChildMeta = feathersResult.user?.childMeta && 
        feathersResult.user.childMeta.fullName && 
        feathersResult.user.childMeta.age && 
        feathersResult.user.childMeta.gender;
      
      if (hasChildMeta) {
        // User has childMeta, go to home
        router.replace('/');
      } else {
        // User missing childMeta, redirect to add-child page
        router.replace('/add-child');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Google signup logic
  };

  return (
    <PageContainer useFloatingShapes>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { marginTop: insets.top + 40 }]}>
            <Title size="xlarge">Signup</Title>
            <Subtitle style={styles.subtitle}>Join the fun!</Subtitle>

            <View style={styles.inputGroup}>
              <Input
                icon="person"
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                autoCapitalize="words"
              />

              <Input
                icon="mail"
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                icon="lock-closed"
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                isPassword
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Body style={styles.errorText}>{error}</Body>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Body style={styles.signupButtonText} weight="bold">SIGN UP</Body>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginLink} 
              onPress={() => router.push('/login')}
            >
              <Body style={styles.loginLinkText}>
                Already have an account? <Body style={styles.loginLinkHighlight}>Login</Body>
              </Body>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            <Body style={styles.orText} weight="bold">OR</Body>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
              <Ionicons name="logo-google" size={24} color={Colors.textWhite} style={styles.googleIcon} />
              <Body style={styles.googleButtonText} weight="bold">Continue with Google</Body>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.padding.xxl,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    marginBottom: Spacing.margin.xxxxl,
  },
  inputGroup: {
    width: '100%',
    gap: Spacing.gap.lg,
    marginBottom: Spacing.margin.xxxl,
  },
  signupButton: {
    width: '100%',
    height: Spacing.size.buttonHeight.large,
    backgroundColor: Colors.secondary,
    borderRadius: Spacing.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderBottomWidth: Spacing.borderWidth.xxthick,
    borderBottomColor: Colors.secondaryDark,
    marginBottom: Spacing.margin.xl,
  },
  signupButtonText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    color: Colors.textWhite,
    letterSpacing: Typography.letterSpacing.wide,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    width: '100%',
    marginBottom: Spacing.margin.lg,
    padding: Spacing.padding.md,
    backgroundColor: Colors.errorLight,
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  loginLink: {
    marginBottom: Spacing.margin.xl,
  },
  loginLinkText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },
  loginLinkHighlight: {
    color: Colors.secondary,
    fontWeight: Typography.fontWeight.bold,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  orText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    color: Colors.textLight,
    marginBottom: Spacing.margin.xl,
  },
  googleButton: {
    width: '100%',
    height: Spacing.size.buttonHeight.medium,
    backgroundColor: Colors.buttonGoogle,
    borderRadius: Spacing.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: Spacing.borderWidth.xthick,
    borderBottomColor: Colors.buttonGoogleDark,
    shadowColor: Colors.buttonGoogle,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: {
    marginRight: Spacing.margin.md,
  },
  googleButtonText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.md,
    color: Colors.textWhite,
  },
});
