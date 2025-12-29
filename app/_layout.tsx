import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';

SplashScreen.preventAutoHideAsync();

function TabIcon({ iconSource, focused }: { iconSource: ImageSourcePropType; focused: boolean }) {
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
      <Image 
        source={iconSource}
        style={{ 
          width: 40, 
          height: 40, 
          zIndex: 1,
        }}
        resizeMode="contain"
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon iconSource={require('../assets/home.png')} focused={focused} />
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
            <TabIcon iconSource={require('../assets/profile.png')} focused={focused} />
          ),
        }}
      />
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    borderRadius: 22.5,
    backgroundColor: '#4DA6FF',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24.5,
    backgroundColor: '#4DA6FF',
    opacity: 0.2,
    zIndex: -1,
  },
});

