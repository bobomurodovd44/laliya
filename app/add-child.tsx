import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import { Input } from "../components/Input";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, setAuthenticated } = useAuthStore();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ageError, setAgeError] = useState("");

  // Prevent users who already have childMeta from accessing this page
  useEffect(() => {
    if (user) {
      const hasChildMeta =
        user.childMeta &&
        user.childMeta.fullName &&
        user.childMeta.age &&
        user.childMeta.gender;

      if (hasChildMeta) {
        // User already has childMeta, redirect to home
        router.replace("/");
      }
    }
  }, [user, router]);

  // Real-time age validation
  const validateAge = (ageValue: string) => {
    if (!ageValue.trim()) {
      setAgeError("");
      return;
    }

    const ageNum = parseInt(ageValue, 10);
    if (isNaN(ageNum)) {
      setAgeError(t("child.errors.ageMustBeNumber"));
      return;
    }

    if (ageNum < 2 || ageNum > 6) {
      setAgeError(t("child.errors.ageMustBeBetween"));
      return;
    }

    setAgeError("");
  };

  const handleAddChild = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError(t("child.errors.enterChildName"));
      return;
    }

    if (!age.trim()) {
      setError(t("child.errors.enterChildAge"));
      validateAge(age);
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 2 || ageNum > 6) {
      setError(t("child.errors.enterValidAge"));
      validateAge(age);
      return;
    }

    // Clear age error if validation passes
    if (ageError) {
      setAgeError("");
    }

    if (!gender) {
      setError(t("child.errors.selectGender"));
      return;
    }

    if (!user?._id) {
      setError(t("child.errors.userNotFound"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Map gender from 'boy'/'girl' to 'male'/'female'
      const backendGender = gender === "boy" ? "male" : "female";

      // Save childMeta to backend
      const updatedUser = await app.service("users").patch(user._id, {
        childMeta: {
          fullName: name.trim(),
          age: ageNum,
          gender: backendGender,
        },
      });

      // Update auth store with the new user data
      setAuthenticated(updatedUser);

      // Redirect to index page
      router.replace("/");
    } catch (err: any) {
      setError(err.message || t("child.errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer useFloatingShapes>
      <PageHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + 150 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { marginTop: insets.top + 40 }]}>
            <View style={styles.titleContainer}>
              <Title size="large">{t("child.addChild")}</Title>
            </View>

            <View style={styles.inputGroup}>
              <Input
                icon="person-add"
                placeholder={t("child.childName")}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <View style={styles.ageInputContainer}>
                <Input
                  icon="calendar-number"
                  placeholder={t("child.agePlaceholder")}
                  value={age}
                  onChangeText={(text) => {
                    setAge(text);
                    validateAge(text);
                    // Clear general error when user starts typing (check for age-related error keys)
                    if (
                      error &&
                      (error.includes(t("child.errors.enterChildAge")) ||
                        error.includes(t("child.errors.enterValidAge")) ||
                        error.includes("age") ||
                        error.includes("yosh"))
                    ) {
                      setError("");
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={ageError ? styles.inputError : undefined}
                />
                {ageError ? (
                  <Body style={styles.ageErrorText}>{ageError}</Body>
                ) : null}
              </View>

              <View style={styles.genderContainer}>
                <Body style={styles.label} weight="bold">
                  {t("child.selectGender")}
                </Body>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderCard,
                      gender === "boy" && styles.genderCardActive,
                      gender !== "boy" && styles.genderCardDisabled,
                      {
                        borderColor:
                          gender === "boy" ? Colors.info : Colors.textTertiary,
                      },
                    ]}
                    onPress={() => setGender("boy")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.genderIconContainer,
                        {
                          backgroundColor:
                            gender === "boy"
                              ? Colors.info
                              : Colors.backgroundDark,
                        },
                      ]}
                    >
                      <Ionicons
                        name="man"
                        size={32}
                        color={
                          gender === "boy"
                            ? Colors.textWhite
                            : Colors.textTertiary
                        }
                      />
                    </View>
                    <Body
                      style={StyleSheet.flatten([
                        styles.genderText,
                        gender === "boy"
                          ? styles.genderTextActive
                          : styles.genderTextDisabled,
                      ])}
                    >
                      {t("child.boy")}
                    </Body>
                    {gender === "boy" && (
                      <View style={styles.checkmarkBadge}>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.textWhite}
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderCard,
                      gender === "girl" && styles.genderCardActive,
                      gender !== "girl" && styles.genderCardDisabled,
                      {
                        borderColor:
                          gender === "girl" ? "#FF69B4" : Colors.textTertiary,
                      },
                    ]}
                    onPress={() => setGender("girl")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.genderIconContainer,
                        {
                          backgroundColor:
                            gender === "girl"
                              ? "#FF69B4"
                              : Colors.backgroundDark,
                        },
                      ]}
                    >
                      <Ionicons
                        name="woman"
                        size={32}
                        color={
                          gender === "girl"
                            ? Colors.textWhite
                            : Colors.textTertiary
                        }
                      />
                    </View>
                    <Body
                      style={StyleSheet.flatten([
                        styles.genderText,
                        gender === "girl"
                          ? styles.genderTextActive
                          : styles.genderTextDisabled,
                      ])}
                    >
                      {t("child.girl")}
                    </Body>
                    {gender === "girl" && (
                      <View style={styles.checkmarkBadge}>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.textWhite}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Body style={styles.errorText}>{error}</Body>
              </View>
            ) : null}

            <View style={styles.buttonContainer}>
              <DuoButton
                title={loading ? t("child.saving") : t("child.addProfile")}
                onPress={handleAddChild}
                color="orange"
                size="large"
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.padding.xxl,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
  titleContainer: {
    marginBottom: Spacing.margin.xxxl,
    width: "100%",
  },
  inputGroup: {
    width: "100%",
    gap: Spacing.gap.lg,
    marginBottom: Spacing.margin.xxxl,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.margin.md,
    marginLeft: Spacing.margin.xs,
  },
  genderContainer: {
    width: "100%",
    marginTop: Spacing.margin.md,
  },
  genderOptions: {
    flexDirection: "row",
    gap: Spacing.gap.xl,
    justifyContent: "center",
  },
  genderCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.padding.lg,
    alignItems: "center",
    borderWidth: Spacing.borderWidth.thick,
    borderBottomWidth: Spacing.borderWidth.xxxthick,
    ...Spacing.shadow.medium,
    position: "relative",
  },
  genderCardActive: {
    backgroundColor: Colors.backgroundLight,
    transform: [{ scale: 1.02 }],
  },
  genderCardDisabled: {
    shadowColor: "#999999",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  genderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.margin.md,
  },
  genderText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.lg,
    color: Colors.textTertiary,
  },
  genderTextActive: {
    color: Colors.textPrimary,
  },
  genderTextDisabled: {
    color: Colors.textTertiary,
  },
  checkmarkBadge: {
    position: "absolute",
    top: Spacing.margin.md,
    right: Spacing.margin.md,
    backgroundColor: Colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.backgroundLight,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: Spacing.margin.xxxl,
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
  ageInputContainer: {
    width: "100%",
  },
  inputError: {
    borderColor: Colors.error,
  },
  ageErrorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.margin.xs,
    marginLeft: Spacing.margin.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.margin.xs,
    marginLeft: Spacing.margin.xs,
  },
});
