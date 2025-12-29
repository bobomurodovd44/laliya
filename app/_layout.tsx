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
      focused && { marginTop: 8 } // Add margin to center when label is hidden
    ]}>
      {focused && (
        <View style={styles.activeBackground} />
      )}
      <Ionicons 
        name={iconName} 
        size={focused ? 30 : 28} 
        color={focused ? '#FFFFFF' : '#999'}
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
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
          paddingHorizontal: 12,
        },
        sceneStyle: {
          paddingBottom: 100,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontFamily: 'BalsamiqSans',
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
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
              fontSize: 12, 
              fontWeight: '700', 
              marginTop: 2, 
              marginBottom: 2, 
              color: focused ? Colors.primary : '#999',
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
          title: 'Welcome',
          tabBarLabel: ({ focused }) => (
            <Text style={{ 
              fontFamily: 'BalsamiqSans', 
              fontSize: 12, 
              fontWeight: '700', 
              marginTop: 2, 
              marginBottom: 2, 
              color: focused ? Colors.primary : '#999',
              opacity: focused ? 0 : 1,
              position: focused ? 'absolute' : 'relative',
            }}>
              Welcome
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="sparkles" focused={focused} />
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
              fontSize: 12, 
              fontWeight: '700', 
              marginTop: 2, 
              marginBottom: 2, 
              color: focused ? Colors.primary : '#999',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: Colors.primary,
  },
});

