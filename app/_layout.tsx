import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerActive
    ]}>
      <Text style={[
        styles.icon,
        focused && styles.iconActive
      ]}>
        {emoji}
      </Text>
    </View>
  );
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { 
          backgroundColor: Colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          fontFamily: 'FredokaOne',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom + 16,
          marginHorizontal: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 30,
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 20,
        },
        sceneStyle: {
          paddingBottom: 90,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontFamily: 'BalsamiqSans',
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
          marginBottom: 4,
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
              fontSize: 11, 
              fontWeight: '700', 
              marginTop: -2, 
              marginBottom: 4, 
              color: '#888',
              opacity: focused ? 0 : 1,
              height: focused ? 0 : undefined,
            }}>
              Home
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="welcome"
        options={{
          title: 'Welcome',
          tabBarLabel: ({ focused }) => (
            <Text style={{ 
              fontFamily: 'BalsamiqSans', 
              fontSize: 11, 
              fontWeight: '700', 
              marginTop: -2, 
              marginBottom: 4, 
              color: '#888',
              opacity: focused ? 0 : 1,
              height: focused ? 0 : undefined,
            }}>
              Welcome
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎉" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ focused }) => (
            <Text style={{ 
              fontFamily: 'BalsamiqSans', 
              fontSize: 11, 
              fontWeight: '700', 
              marginTop: -2, 
              marginBottom: 4, 
              color: '#888',
              opacity: focused ? 0 : 1,
              height: focused ? 0 : undefined,
            }}>
              Profile
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  icon: {
    fontSize: 26,
  },
  iconActive: {
    fontSize: 26,
  },
});

