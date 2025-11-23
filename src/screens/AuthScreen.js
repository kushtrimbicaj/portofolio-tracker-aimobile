import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; // <-- ADD ActivityIndicator here
import { LinearGradient } from 'expo-linear-gradient';
import { Button as PaperButton } from 'react-native-paper'; // <-- REMOVE ActivityIndicator from here
import AuthForm from '../components/AuthForm';
import { signIn, signUp } from '../services/supabase';

const IOS_BLUE = '#007AFF';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (email, password) => {
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // If sign-in is successful, Supabase's auth listener in App.js will handle navigation
      } else {
        await signUp(email, password);
        Alert.alert("Success!", "Registration successful! Please check your email to verify your account.");
        setIsLogin(true); // Switch back to login after successful registration
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      Alert.alert("Auth Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#A7C7ED', '#DFE6EE']} // A gradient that feels fresh and inviting
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {isLogin ? "Welcome Back!" : "Join Us!"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Sign in to access your portfolio" : "Create an account to get started"}
          </Text>

          <AuthForm onSubmit={handleAuth} isLogin={isLogin} loading={loading} />

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} disabled={loading}>
              <Text style={styles.toggleButtonText}>
                {isLogin ? " Sign Up" : " Log In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  toggleText: {
    color: '#777',
    fontSize: 15,
  },
  toggleButtonText: {
    color: IOS_BLUE,
    fontSize: 15,
    fontWeight: '600',
  },
});