import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <ThemeProvider>
        <StatusBar
          backgroundColor="#000000"
          barStyle="light-content"
          translucent={false}
        />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: {
                backgroundColor: '#000000',
              },
            }}
          >
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{
                contentStyle: { backgroundColor: '#000000' },
              }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                contentStyle: { backgroundColor: '#000000' },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}