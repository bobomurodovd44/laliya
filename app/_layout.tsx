import { BalsamiqSans_400Regular } from '@expo-google-fonts/balsamiq-sans';
import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{ 
        headerStyle: { backgroundColor: Colors.primary }, 
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 32,
          fontWeight: 'bold', // Note: FredokaOne might not support 'bold' weight synthesis well, but we'll leave it or remove it if it looks off.
          fontFamily: 'FredokaOne',
        },
        drawerLabelStyle: {
          fontFamily: 'BalsamiqSans',
          fontSize: 24,
        }
      }}>
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Home',
            title: 'Home',
          }}
        />
        <Drawer.Screen
          name="welcome"
          options={{
            drawerLabel: 'Welcome',
            title: 'Welcome',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
