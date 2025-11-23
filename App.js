import React, { useState, useEffect } from 'react';
import { StatusBar, View, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme, IconButton as PaperIconButton } from 'react-native-paper';


// Import your screens
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import AddProjectScreen from './src/screens/AddProjectScreen';
import StatsScreen from './src/screens/StatsScreen';
import AddAssetScreen from './src/screens/AddAssetScreen';
import AuthScreen from './src/screens/AuthScreen'; 

// Import Supabase services
import { initSupabase, getSession, signOut, getSupabaseClient } from './src/services/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './src/services/supabaseConfig';

const Stack = createStackNavigator();
const IOS_BLUE = '#007AFF';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Install a global error handler to capture uncaught errors and print stacks to Metro
  React.useEffect(() => {
    try {
      const existing = global.ErrorUtils && global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
      const handler = (error, isFatal) => {
        try {
          console.error('Global uncaught error:', error && (error.stack || error.toString()));
        } catch (e) {
          // ignore
        }
        if (existing) {
          try { existing(error, isFatal); } catch (_) {}
        }
      };
      if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
        global.ErrorUtils.setGlobalHandler(handler);
        return () => {
          try { global.ErrorUtils.setGlobalHandler(existing); } catch (_) {}
        };
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Initialize Supabase and set up the session listener
  useEffect(() => {
    let sb = null;

    try {
      // 1. Initialize the global Supabase client instance
      if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('<')) {
        initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
        // 2. Get the globally stored client to attach the listener
        sb = getSupabaseClient();
      } else {
        console.warn('Supabase credentials not fully configured. Running without auth.');
        setLoadingInitial(false);
        return;
      }
    } catch (e) {
      console.error('Supabase initialization failed:', e.message || e);
      setLoadingInitial(false);
      return;
    }

    // 3. Listen for auth state changes immediately
    const { data: authListener } = sb.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth State Changed:', event); // Debug log
        setSession(currentSession);
        // Once the first session check is complete (via listener or fetch), we stop loading
        if (loadingInitial) { 
          setLoadingInitial(false);
        }
      }
    );

    // 4. Manual fetch for the initial session state (often needed for faster startup)
    // Note: The listener handles subsequent changes, but this gets the initial state.
    const checkInitialSession = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
      } catch (e) {
        console.error('Error fetching initial session:', e);
        setSession(null);
      } finally {
        // If the listener hasn't already set loadingInitial to false, do it now
        if (loadingInitial) {
           setLoadingInitial(false);
        }
      }
    };

    checkInitialSession();

    return () => {
      // Unsubscribe from the listener when the component unmounts
      authListener?.subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  const paperTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: IOS_BLUE,
      accent: '#03dac4'
    }
  };

  if (loadingInitial) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={IOS_BLUE} />
      </View>
    );
  }

  // Define the main app navigation (without AuthScreen)
  const MainAppNavigator = () => (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Portfolio Tracker' }}
      />
      
      <Stack.Screen 
        name="Projects" 
        component={ProjectsScreen} 
        options={({ navigation }) => ({
          title: 'Projects',
          headerLeft: () => null, 
          headerRight: () => (
              <View style={{ flexDirection: 'row', marginRight: 5 }}>
                <PaperIconButton
                    icon="chart-bar"
                    color={IOS_BLUE}
                    size={24}
                    onPress={() => navigation.navigate('Stats')}
                />
                <PaperIconButton
                    icon="plus-circle"
                    color={IOS_BLUE}
                    size={24}
                    onPress={() => navigation.navigate('AddProject')}
                />
              </View>
          ),
        })} 
      />
      
      <Stack.Screen name="AddProject" component={AddProjectScreen} options={{ title: 'Add Project' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      <Stack.Screen name="AddAsset" component={AddAssetScreen} options={{ title: 'Add Asset' }} />
      <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Asset Details' }} />
    </Stack.Navigator>
  );

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          {/* CRITICAL: Conditional rendering based on session state */}
          {session && session.user ? (
            <MainAppNavigator /> // Show main app if logged in
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}> 
              <Stack.Screen name="Auth" component={AuthScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

 