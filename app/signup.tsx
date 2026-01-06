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
import { signUpWithEmailPassword } from "../lib/auth/firebase-auth";
import { signInWithGoogle } from "../lib/auth/google-signin";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setAuthenticated } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(t("auth.signup.fillAllFields") || t("auth.login.fillAllFields"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.signup.passwordMinLength"));
      return;
    }

    setError("");
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
        role: "user",
      });

      // Step 3: Update auth store with user data
      // The _layout.tsx will handle redirects based on user state
      setAuthenticated(feathersResult.user);

      // Navigate to home - _layout will redirect to add-child if needed
      router.replace("/");
    } catch (err: any) {
      setError(err.message || t("auth.signup.signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      // Step 1: Sign in with Google and get Firebase access token
      // Google Sign-In handles both login and signup automatically
      const googleResult = await signInWithGoogle();

      // Step 2: Authenticate with Feathers backend
      // Extract fullName from Google profile (use email as fallback)
      const fullName = googleResult.user.name || googleResult.user.email.split("@")[0] || "";

      const feathersResult = await authenticateWithFeathers(
        googleResult.accessToken,
        {
          fullName,
          role: "user",
        }
      );

      // Step 3: Update auth store with user data
      // The _layout.tsx will handle redirects based on user state
      setAuthenticated(feathersResult.user);

      // Navigate to home - _layout will redirect to add-child if needed
      router.replace("/");
    } catch (err: any) {
      setError(err.message || t("auth.signup.googleSignInFailed"));
    } finally {
      setLoading(false);
    }
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
          <View style={[styles.formContainer, { marginTop: insets.top + 40 }]}>
            <Title size="xlarge">{t("auth.signup.title")}</Title>
            <Subtitle style={styles.subtitle}>{t("auth.signup.subtitle")}</Subtitle>

            <View style={styles.inputGroup}>
              <Input
                icon="person"
                placeholder={t("auth.signup.fullName")}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError("");
                }}
                autoCapitalize="words"
              />

              <Input
                icon="mail"
                placeholder={t("auth.signup.email")}
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
                placeholder={t("auth.signup.password")}
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
                styles.signupButton,
                loading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Body style={styles.signupButtonText} weight="bold">
                  {t("auth.signup.signupButton").toUpperCase()}
                </Body>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push("/login")}
            >
              <Body style={styles.loginLinkText}>
                {t("auth.signup.haveAccount")}{" "}
                <Body style={styles.loginLinkHighlight}>{t("auth.signup.login")}</Body>
              </Body>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            <Body style={styles.orText} weight="bold">
              {t("auth.login.or")}
            </Body>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignup}
            >
              <Ionicons
                name="logo-google"
                size={24}
                color={Colors.textWhite}
                style={styles.googleIcon}
              />
              <Body style={styles.googleButtonText} weight="bold">
                {t("auth.signup.googleSignup")}
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
    marginBottom: Spacing.margin.xxxxl,
  },
  inputGroup: {
    width: "100%",
    gap: Spacing.gap.lg,
    marginBottom: Spacing.margin.xxxl,
  },
  signupButton: {
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
