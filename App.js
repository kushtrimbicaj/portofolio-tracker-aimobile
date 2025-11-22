import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import AddProjectScreen from './src/screens/AddProjectScreen';
import StatsScreen from './src/screens/StatsScreen';
import AddAssetScreen from './src/screens/AddAssetScreen';
import { initSupabase } from './src/services/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './src/services/supabaseConfig';

const Stack = createStackNavigator();

export default function App() {
  // Attempt to initialize Supabase if credentials were filled in the config file.
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('<')) {
      initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    // Non-fatal: app can still run without Supabase.
    console.warn('Supabase initialization failed:', e.message || e);
  }

  const paperTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#007AFF',
      accent: '#03dac4'
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Portfolio Tracker' }} />
            <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projects' }} />
            <Stack.Screen name="AddProject" component={AddProjectScreen} options={{ title: 'Add Project' }} />
            <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
            <Stack.Screen name="AddAsset" component={AddAssetScreen} options={{ title: 'Add Asset' }} />
            <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Asset Details' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
