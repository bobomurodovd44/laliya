import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { PageContainer } from '../components/layout/PageContainer';
import { Body, Title, Subtitle } from '../components/Typography';
import { Colors, Spacing, Typography } from '../constants';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/');
  };

  const handleGoogleLogin = () => {
    // Google login logic
  };

  return (
    <PageContainer useFloatingShapes>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        <View style={[styles.formContainer, { marginTop: insets.top + 60 }]}>
          <Title size="xlarge">Login</Title>
          <Subtitle style={styles.subtitle}>Welcome back, friend!</Subtitle>

          <View style={styles.inputGroup}>
            <Input
              icon="mail"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              icon="lock-closed"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Body style={styles.loginButtonText} weight="bold">LET'S GO!</Body>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupLink} 
            onPress={() => router.push('/signup')}
          >
            <Body style={styles.signupLinkText}>
              Don't have an account? <Body style={styles.signupLinkHighlight}>Sign Up</Body>
            </Body>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Body style={styles.orText} weight="bold">OR</Body>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={24} color={Colors.textWhite} style={styles.googleIcon} />
            <Body style={styles.googleButtonText} weight="bold">Continue with Google</Body>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
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
  loginButton: {
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
  },
  loginButtonText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    color: Colors.textWhite,
    letterSpacing: Typography.letterSpacing.wide,
  },
  signupLink: {
    marginTop: Spacing.margin.xl,
  },
  signupLinkText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },
  signupLinkHighlight: {
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
