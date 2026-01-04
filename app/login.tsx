import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "../components/Input";
import { PageContainer } from "../components/layout/PageContainer";
import { Body, Subtitle, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import { authenticateWithFeathers } from "../lib/auth/feathers-auth";
import { signInWithEmailPassword } from "../lib/auth/firebase-auth";
import { useAuthStore } from "../lib/store/auth-store";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Step 1: Sign in with Firebase
      const { accessToken } = await signInWithEmailPassword(
        email.trim(),
        password
      );

      // Step 2: Authenticate with Feathers backend
      // For login, user already exists, so we pass minimal userData
      // The backend should use the Firebase token to identify the user
      const feathersResult = await authenticateWithFeathers(accessToken, {
        fullName: "",
        role: "user",
      });

      // Step 3: Update auth store with user data
      setAuthenticated(feathersResult.user);

      // Navigate to home - _layout will redirect to add-child if needed
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google login logic
  };

  return (
    <PageContainer useFloatingShapes>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { marginTop: insets.top + 60 }]}>
            <Title size="xlarge">Login</Title>
            <Subtitle style={styles.subtitle}>Welcome back, friend!</Subtitle>

            <View style={styles.inputGroup}>
              <Input
                icon="mail"
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
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
                  setError("");
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
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Body style={styles.loginButtonText} weight="bold">
                  LET'S GO!
                </Body>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push("/signup")}
            >
              <Body style={styles.signupLinkText}>
                Don't have an account?{" "}
                <Body style={styles.signupLinkHighlight}>Sign Up</Body>
              </Body>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            <Body style={styles.orText} weight="bold">
              OR
            </Body>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <Ionicons
                name="logo-google"
                size={24}
                color={Colors.textWhite}
                style={styles.googleIcon}
              />
              <Body style={styles.googleButtonText} weight="bold">
                Continue with Google
              </Body>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.padding.xxl,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
  subtitle: {
    marginBottom: Spacing.margin.xxxl,
  },
  inputGroup: {
    width: "100%",
    gap: Spacing.gap.lg,
    marginBottom: Spacing.margin.xxxl,
  },
  loginButton: {
    width: "100%",
    height: Spacing.size.buttonHeight.large,
    backgroundColor: Colors.secondary,
    borderRadius: Spacing.radius.lg,
    justifyContent: "center",
    alignItems: "center",
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    width: "100%",
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
    textAlign: "center",
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
    width: "100%",
    alignItems: "center",
  },
  orText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    color: Colors.textLight,
    marginBottom: Spacing.margin.xl,
  },
  googleButton: {
    width: "100%",
    height: Spacing.size.buttonHeight.medium,
    backgroundColor: Colors.buttonGoogle,
    borderRadius: Spacing.radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
