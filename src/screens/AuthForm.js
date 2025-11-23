// src/components/AuthForm.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button as PaperButton, ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

const IOS_BLUE = '#007AFF';

export default function AuthForm({ onSubmit, isLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(email, password);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        left={<TextInput.Icon icon="email" />}
        activeOutlineColor={IOS_BLUE}
        disabled={loading}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        left={<TextInput.Icon icon="lock" />}
        activeOutlineColor={IOS_BLUE}
        disabled={loading}
      />

      <PaperButton
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        disabled={loading || !email || !password}
        loading={loading}
        theme={{ colors: { primary: IOS_BLUE } }}
      >
        {isLogin ? "Log In" : "Sign Up"}
      </PaperButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 5,
    marginTop: 10,
    backgroundColor: IOS_BLUE, // Ensure button color is blue
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});