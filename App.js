import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { testSupabaseConnection } from './src/testSupabase';

const Stack = createStackNavigator();

// Кастомная тёмная тема для навигации
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    border: '#333333',
    primary: '#4CAF50',
  },
};

export default function App() {
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <ThemeProvider>
        <StatusBar
          backgroundColor="#000000"
          barStyle="light-content"
          translucent={false}
        />
        <NavigationContainer theme={CustomDarkTheme}>
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
                contentStyle: {
                  backgroundColor: '#000000',
                },
              }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                contentStyle: {
                  backgroundColor: '#000000',
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}