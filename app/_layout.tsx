import { FredokaOne_400Regular, useFonts } from '@expo-google-fonts/fredoka-one';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    FredokaOne: FredokaOne_400Regular,
    PatrickHand: PatrickHand_400Regular,
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
        headerTitleStyle: {
          fontSize: 28,
          fontWeight: 'bold', // Note: FredokaOne might not support 'bold' weight synthesis well, but we'll leave it or remove it if it looks off.
          fontFamily: 'FredokaOne',
        },
        drawerLabelStyle: {
          fontFamily: 'PatrickHand',
          fontSize: 18,
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
