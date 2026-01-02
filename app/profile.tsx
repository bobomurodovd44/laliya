import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../components/layout/PageContainer";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useAuthStore } from "../lib/store/auth-store";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUnauthenticated, user } = useAuthStore();

  // Get childMeta from user, with fallback values
  const childMeta = user?.childMeta;
  const childName = childMeta?.fullName || "Child";
  const childAge = childMeta?.age || 0;
  const childGender =
    childMeta?.gender === "male"
      ? "Boy"
      : childMeta?.gender === "female"
      ? "Girl"
      : "";
  const profilePicture =
    "https://i.pinimg.com/736x/36/f7/02/36f702b674bb8061396b3853ccaf80cf.jpg";
  const level = 3; // TODO: Get from user data when available

  const handleLogout = async () => {
    try {
      // Clear Feathers authentication
      await app.logout();
      // Clear auth store
      setUnauthenticated();
      // Navigate to login (protected routes will handle redirect)
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local auth state
      setUnauthenticated();
      router.replace("/login");
    }
  };

  return (
    <PageContainer useFloatingShapes>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <View style={{ width: 32 }} />
        <Title size="medium" style={styles.headerTitle}>
          Profile
        </Title>
        <TouchableOpacity style={styles.settingsButton} onPress={() => {}}>
          <Ionicons
            name="settings-sharp"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
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
            <TouchableOpacity style={styles.editIconButton} onPress={() => {}}>
              <Ionicons name="pencil" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          <Title size="large" style={styles.childName}>
            {childName}
          </Title>
          {childAge > 0 && childGender && (
            <Body style={styles.subtitleText}>
              {childAge} years old • {childGender}
            </Body>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.badgeStar }]}>
            <Body style={styles.statTitle} weight="bold">
              Stars
            </Body>
            <View style={styles.statValueContainer}>
              <Ionicons
                name="star"
                size={24}
                color={Colors.badgeStar}
                style={{ marginBottom: 4 }}
              />
              <Title size="small" style={styles.statValue}>
                1,240
              </Title>
            </View>
          </View>

          <View style={[styles.statCard, { borderColor: Colors.badgeLevel }]}>
            <Body style={styles.statTitle} weight="bold">
              Level
            </Body>
            <View style={styles.statValueContainer}>
              <Ionicons
                name="trophy"
                size={24}
                color={Colors.badgeLevel}
                style={{ marginBottom: 4 }}
              />
              <Title size="small" style={styles.statValue}>
                {level}
              </Title>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ProfileMenuItem
            iconName="share-social-outline"
            title="Share Profile"
            onPress={() => router.push("/add-child")}
          />
          <ProfileMenuItem
            iconName="log-out-outline"
            title="Logout"
            onPress={handleLogout}
          />
          <ProfileMenuItem
            iconName="trash-outline"
            title="Delete Account"
            variant="danger"
            onPress={() => {}}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: "space-between",
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
  settingsButton: {
    padding: Spacing.padding.xs,
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
  editIconButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.badgeLevel,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: Spacing.borderWidth.thick,
    borderColor: Colors.backgroundLight,
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
