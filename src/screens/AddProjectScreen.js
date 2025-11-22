import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { createProject, updateProject } from '../services/supabase';

export default function AddProjectScreen({ navigation, route }) {
  const editing = route?.params?.project;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [saving, setSaving] = useState(false);

  const validateUrl = (u) => {
    if (!u) return false;
    return u.startsWith('http://') || u.startsWith('https://');
  };

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title.');
      return;
    }
    if (!validateUrl(url.trim())) {
      Alert.alert('Validation', 'URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      const payload = { title: title.trim(), url: url.trim() };
      if (editing && editing.id) {
        await updateProject(editing.id, payload);
      } else {
        await createProject(payload);
      }
      // Navigate back to Projects screen. Use navigate to ensure we land on the list.
      navigation.navigate('Projects');
    } catch (err) {
      console.error('Failed to save project', err);
      Alert.alert('Save error', 'Could not save project. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Title>{editing ? 'Edit project' : 'Add project'}</Title>

        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Project title"
          mode="outlined"
          style={{ marginTop: 12 }}
        />

        <TextInput
          label="URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          mode="outlined"
          style={{ marginTop: 12 }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          mode="contained"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          style={{ marginTop: 20 }}
        >
          Save
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 14, color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fafafa'
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 }
});
