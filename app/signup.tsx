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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { PageContainer } from '../components/layout/PageContainer';
import { Body, Title, Subtitle } from '../components/Typography';
import { Colors, Spacing, Typography } from '../constants';

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    router.replace('/');
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
                onChangeText={setName}
                autoCapitalize="words"
              />

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

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Body style={styles.signupButtonText} weight="bold">SIGN UP</Body>
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
