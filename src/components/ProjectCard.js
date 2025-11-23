import React from 'react';
import { StyleSheet, Linking, Alert } from 'react-native';
import { Card, Button, Title, Paragraph } from 'react-native-paper';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';


export default function ProjectCard({ project, onLongPress }) {
  const openUrl = async (url) => {
    try {
      if (!url) {
        Alert.alert('Invalid URL', 'No URL provided for this project.');
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open url', err);
      Alert.alert('Could not open URL', String(err));
    }
  };

  return (
    <Card mode="elevated" style={styles.card} onLongPress={() => onLongPress && onLongPress(project)}>
      <Card.Content>
        <Title numberOfLines={1}><Text numberOfLines={1}>{project.title}</Text></Title>
        <Paragraph numberOfLines={1} style={{ color: '#666' }}><Text numberOfLines={1} style={{ color: '#666' }}>{project.url}</Text></Paragraph>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          compact
          onPress={() => openUrl(project.url)}
          icon={() => <MaterialIcons name="open-in-new" size={18} color="#fff" />}
        >
          <Text>Open</Text>
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 10,
  },
  actions: { justifyContent: 'flex-end', paddingRight: 8, paddingBottom: 8 },
});
