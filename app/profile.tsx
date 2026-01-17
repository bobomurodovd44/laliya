import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeleteAccountModal from "../components/DeleteAccountModal";
import { PageContainer } from "../components/layout/PageContainer";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import { signOutFromGoogle } from "../lib/auth/google-signin";
import app from "../lib/feathers/feathers-client";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";
import { getUserMaxStageOrder } from "../lib/utils/stage-access";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setUnauthenticated, user } = useAuthStore();

  // Get childMeta from user, with fallback values
  const childMeta = user?.childMeta;
  const childName = childMeta?.fullName || t("profile.child");
  const childAge = childMeta?.age || 0;
  const childGender =
    childMeta?.gender === "male"
      ? t("profile.boy")
      : childMeta?.gender === "female"
      ? t("profile.girl")
      : "";
  const profilePicture =
    user?.profilePicture ||
    "https://i.pinimg.com/736x/36/f7/02/36f702b674bb8061396b3853ccaf80cf.jpg";
  const [maxStageOrder, setMaxStageOrder] = useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Fetch user's max stage order
  useEffect(() => {
    const loadStageAccess = async () => {
      try {
        const maxOrder = await getUserMaxStageOrder(user?.currentStageId);
        setMaxStageOrder(maxOrder);
      } catch (err) {
        // Default to 0 if error
        setMaxStageOrder(0);
      }
    };

    if (user) {
      loadStageAccess();
    } else {
      setMaxStageOrder(0);
    }
  }, [user?.currentStageId]);

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Logout timeout")), 5000);
      });

      // Sign out from Google (don't wait if it fails)
      signOutFromGoogle().catch((error) => {
        console.warn("Google sign-out error (non-critical):", error);
      });

      // Clear Feathers authentication with timeout
      await Promise.race([app.logout(), timeoutPromise]).catch((error) => {
        console.warn("Feathers logout error (non-critical):", error);
      });

      // Always clear local auth state and navigate, even if logout fails
      setUnauthenticated();

      // Use setTimeout to ensure navigation happens after state update
      setTimeout(() => {
        router.replace("/login");
        setIsLoggingOut(false);
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local auth state
      setUnauthenticated();
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };
    
  const handleDeleteAccount = async () => {
    if (isDeletingAccount || !user) return;
    
    setIsDeletingAccount(true);
    try {
      // 1. Delete user from backend (which backgrounds Firebase and S3 cleanup)
      await app.service('users').remove(user._id);
      
      // 2. Clear local auth state
      setUnauthenticated();
      
      // 3. Close modal and navigate to welcome/login
      setShowDeleteModal(false);
      
      // Show success alert
      Alert.alert(
        t("common.success") || "Muvaffaqiyatli",
        t("profile.deleteAccountSuccess")
      );

      router.replace("/welcome");
    } catch (error) {
      console.error("Account deletion error:", error);
      Alert.alert(
        t("common.error"),
        t("profile.deleteAccountError")
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageContainer useFloatingShapes>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <Title size="medium" style={styles.headerTitle}>
          {t("profile.title")}
        </Title>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profilePicture }}
              style={styles.profileImage}
            />
          </View>

          <Title size="large" style={styles.childName}>
            {childName}
          </Title>
          {childAge > 0 && childGender && (
            <Body style={styles.subtitleText}>
              {childAge} {t("profile.yearsOld")} • {childGender}
            </Body>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.badgeStar }]}>
            <Body style={styles.statTitle} weight="bold">
              {t("profile.stars")}
            </Body>
            <View style={styles.statValueContainer}>
              <Octicons
                name="star-fill"
                size={32}
                color={Colors.badgeStar}
                style={{ marginBottom: 4 }}
              />
              <Title size="small" style={styles.statValue}>
                {user?.score?.toLocaleString() || "0"}
              </Title>
            </View>
          </View>

          <View style={[styles.statCard, { borderColor: Colors.badgeLevel }]}>
            <Body style={styles.statTitle} weight="bold">
              {t("profile.level")}
            </Body>
            <View style={styles.statValueContainer}>
              <FontAwesome
                name="trophy"
                size={32}
                color={Colors.badgeLevel}
                style={{ marginBottom: 4 }}
              />
              <Title size="small" style={styles.statValue}>
                {maxStageOrder || 0}
              </Title>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ProfileMenuItem
            iconName="analytics"
            title={t("profile.analytics")}
            onPress={() => router.push("/user-analytics")}
            iconLibrary="ionicons"
          />
          <ProfileMenuItem
            iconName="music"
            title={t("profile.childAnswers")}
            onPress={() => router.push("/child-answers")}
            iconLibrary="fontawesome"
          />
          <ProfileMenuItem
            iconName="log-out-outline"
            title={isLoggingOut ? t("profile.loggingOut") : t("profile.logout")}
            onPress={handleLogout}
            variant="danger"
            disabled={isLoggingOut}
          />
          <ProfileMenuItem
            iconName="trash-outline"
            title={t("profile.deleteAccount")}
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            disabled={isLoggingOut || isDeletingAccount}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <DeleteAccountModal 
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.md,
    borderBottomWidth: Spacing.borderWidth.medium,
    borderBottomColor: Colors.borderDark,
  },
  headerTitle: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.margin.xxxl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.margin.xxxl,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: Spacing.margin.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundDark,
  },
  childName: {
    marginBottom: Spacing.margin.xs,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: Spacing.margin.xxxl,
    gap: Spacing.gap.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.lg,
    borderWidth: Spacing.borderWidth.medium,
    borderBottomWidth: Spacing.borderWidth.xxthick,
    borderColor: Colors.borderDark,
    alignItems: "flex-start",
  },
  statTitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.margin.sm,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.gap.sm,
  },
  statValue: {
    color: Colors.textPrimary,
  },
  divider: {
    height: Spacing.borderWidth.medium,
    backgroundColor: Colors.borderDark,
    marginBottom: Spacing.margin.xl,
    borderRadius: 1,
  },
  section: {
    gap: Spacing.gap.md,
  },
  bottomSpacer: {
    height: Spacing.margin.xxxl,
  },
});
