import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../lib/store/auth-store';

SplashScreen.preventAutoHideAsync();

function TabIcon({ iconName, focused }: { iconName: keyof typeof MaterialIcons.glyphMap; focused: boolean }) {
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerActive,
      focused && { transform: [{ scale: 1.05 }] }
    ]}>
      {focused && (
        <>
          <View style={styles.activeBackground} />
          <View style={styles.glowEffect} />
        </>
      )}
      <MaterialIcons 
        name={iconName}
        size={36}
        color={focused ? '#FFFFFF' : '#B8B8B8'}
        style={{ zIndex: 1 }}
      />
    </View>
  );
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  // Global redirect check: if authenticated but missing childMeta, redirect to add-child
  useEffect(() => {
    if (!isInitialized) return;
    
    if (isAuthenticated && user) {
      const currentPath = segments[0] || '';
      const isOnAddChildPage = currentPath === 'add-child';
      
      // Check if user is missing childMeta
      const hasChildMeta = user.childMeta && 
        user.childMeta.fullName && 
        user.childMeta.age && 
        user.childMeta.gender;
      
      // Redirect to add-child if missing childMeta and not already on that page
      if (!hasChildMeta && !isOnAddChildPage) {
        router.replace('/add-child');
      }
    }
  }, [isAuthenticated, isInitialized, user, segments, router]);

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
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 0,
          shadowOpacity: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
        },
        sceneStyle: {
          backgroundColor: 'transparent',
        },
        tabBarActiveTintColor: '#4DA6FF',
        tabBarInactiveTintColor: '#B8B8B8',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarShowLabel: false,
      }}
    >
      {/* Protected routes - only accessible when authenticated */}
      <Tabs.Protected guard={isAuthenticated}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="welcome"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="person" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="task"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="add-child"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="record-audio"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="child-answers"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
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
            tabBarStyle: { display: 'none' },
            sceneStyle: { paddingBottom: 0 },
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: '#4DA6FF',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: '#4DA6FF',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: '#4DA6FF',
    opacity: 0.2,
    zIndex: -1,
  },
});

