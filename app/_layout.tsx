import { BalsamiqSans_400Regular } from "@expo-google-fonts/balsamiq-sans";
import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { Tabs, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CustomHeader } from "../components/CustomHeader";
import { configureGoogleSignIn } from "../lib/auth/google-signin";
import { initializeLanguage, useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";
import { checkUserHasChildMeta } from "../lib/utils/check-childmeta";

SplashScreen.preventAutoHideAsync();

function TabIcon({
  iconName,
  focused,
}: {
  iconName: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerActive,
        focused && { transform: [{ scale: 1.05 }] },
      ]}
    >
      {focused && (
        <>
          <View style={styles.activeBackground} />
          <View style={styles.glowEffect} />
        </>
      )}
      <MaterialIcons
        name={iconName}
        size={36}
        color={focused ? "#FFFFFF" : "#B8B8B8"}
        style={{ zIndex: 1 }}
      />
    </View>
  );
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const currentPathRef = useRef<string>("");

  // Global redirect check: if authenticated but missing childMeta, redirect to add-child
  // ONLY check when user lands on index page (not on every navigation)
  useEffect(() => {
    if (!isInitialized) return;

    const checkChildMeta = async () => {
      if (isAuthenticated && user?._id) {
        const currentPath = segments[0] || "";
        const previousPath = currentPathRef.current;
        currentPathRef.current = currentPath;

        // ONLY check on index page (home page)
        // Skip all other pages including task, add-child, profile, etc.
        if (currentPath !== "index" && currentPath !== "") {
          return;
        }

        // Only check when we just arrived at index (path changed to index)
        // Don't check if we're already on index (prevents re-checking on state updates)
        if (previousPath === "index") {
          return;
        }

        // Check if user has childMeta directly from backend
        const hasChildMeta = await checkUserHasChildMeta(user._id);

        // Redirect to add-child if missing childMeta
        if (!hasChildMeta) {
          router.replace("/add-child");
        }
      }
    };

    checkChildMeta();
  }, [isAuthenticated, isInitialized, user?._id, segments, router]);

  // Don't render tabs until auth is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerTransparent: true,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          elevation: 0,
          shadowOpacity: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 20,
        },
        sceneStyle: {
          backgroundColor: "transparent",
        },
        tabBarActiveTintColor: "#4DA6FF",
        tabBarInactiveTintColor: "#B8B8B8",
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarShowLabel: false,
      }}
    >
      {/* Protected routes - only accessible when authenticated */}
      <Tabs.Protected guard={isAuthenticated}>
        <Tabs.Screen
          name="index"
          options={{
            title: t("home.title"),
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerActive,
                  focused && { transform: [{ scale: 1.05 }] },
                ]}
              >
                {focused && (
                  <>
                    <View style={styles.activeBackground} />
                    <View style={styles.glowEffect} />
                  </>
                )}
                <Octicons
                  name={focused ? "home-fill" : "home"}
                  size={36}
                  color={focused ? "#FFFFFF" : "#B8B8B8"}
                  style={{ zIndex: 1 }}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="welcome"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile.title"),
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerActive,
                  focused && { transform: [{ scale: 1.05 }] },
                ]}
              >
                {focused && (
                  <>
                    <View style={styles.activeBackground} />
                    <View style={styles.glowEffect} />
                  </>
                )}
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={36}
                  color={focused ? "#FFFFFF" : "#B8B8B8"}
                  style={{ zIndex: 1 }}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="task"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="add-child"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="record-audio"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="child-answers"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="stage-answers"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="user-analytics"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
      </Tabs.Protected>

      {/* Public routes - only accessible when NOT authenticated */}
      <Tabs.Protected guard={!isAuthenticated}>
        <Tabs.Screen
          name="login"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    FredokaOne: FredokaOne_400Regular,
    BalsamiqSans: BalsamiqSans_400Regular,
  });
  const { init } = useAuthStore();

  // Initialize i18n localization on mount
  useEffect(() => {
    initializeLanguage();
  }, []);

  // Initialize Google Sign-In configuration on mount
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Initialize auth store on mount
  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "transparent",
    position: "relative",
  },
  iconContainerActive: {
    backgroundColor: "#4DA6FF",
  },
  activeBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: "#4DA6FF",
  },
  glowEffect: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: "#4DA6FF",
    opacity: 0.2,
    zIndex: -1,
  },
});
