import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

function TabIcon({ iconName, focused }: { iconName: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerActive,
      focused && { marginTop: 8, transform: [{ scale: 1.05 }] }
    ]}>
      {focused && (
        <>
          <View style={styles.activeBackground} />
          <View style={styles.glowEffect} />
        </>
      )}
      <Ionicons 
        name={iconName} 
        size={focused ? 32 : 26} 
        color={focused ? '#FFFFFF' : '#7C7C7C'}
        style={{ zIndex: 1 }}
      />
    </View>
  );
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerTransparent: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom + 12,
          marginHorizontal: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: 'rgba(0, 0, 0, 0.06)',
          elevation: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.20,
          shadowRadius: 24,
          height: 78,
          paddingBottom: 10,
          paddingTop: 10,
          paddingHorizontal: 16,
        },
        sceneStyle: {
          paddingBottom: 100,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#7C7C7C',
        tabBarLabelStyle: {
          fontFamily: 'BalsamiqSans',
          fontSize: 13,
          fontWeight: '700',
          marginTop: 3,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: ({ focused }) => (
            <Text style={{ 
              fontFamily: 'BalsamiqSans', 
              fontSize: 13, 
              fontWeight: '700', 
              marginTop: 3, 
              marginBottom: 2, 
              color: focused ? Colors.primary : '#7C7C7C',
              opacity: focused ? 0 : 1,
              position: focused ? 'absolute' : 'relative',
            }}>
              Home
            </Text>
          ),
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
          tabBarLabel: ({ focused }) => (
            <Text style={{ 
              fontFamily: 'BalsamiqSans', 
              fontSize: 13, 
              fontWeight: '700', 
              marginTop: 3, 
              marginBottom: 2, 
              color: focused ? Colors.primary : '#7C7C7C',
              opacity: focused ? 0 : 1,
              position: focused ? 'absolute' : 'relative',
            }}>
              Profile
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    FredokaOne: FredokaOne_400Regular,
    BalsamiqSans: BalsamiqSans_400Regular,
  });

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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  glowEffect: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 33,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    zIndex: -1,
  },
});

