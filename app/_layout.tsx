import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';

SplashScreen.preventAutoHideAsync();

function TabIcon({ iconName, focused }: { iconName: keyof typeof Ionicons.glyphMap; focused: boolean }) {
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
      <Ionicons 
        name={iconName} 
        size={focused ? 28 : 28} 
        color={focused ? '#FFFFFF' : '#B8B8B8'}
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
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    borderRadius: 25,
    backgroundColor: '#4DA6FF',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    backgroundColor: '#4DA6FF',
    opacity: 0.2,
    zIndex: -1,
  },
});

