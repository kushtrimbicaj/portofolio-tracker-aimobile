import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard';
import { getProjects, deleteProject } from '../services/supabase';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const load = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const rows = await getProjects();
      setProjects(rows);
    } catch (err) {
      console.error('Failed to load projects', err);
      Alert.alert('Load error', 'Could not fetch projects. Check console for details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when screen gains focus (useful after edits/adds)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // set header buttons for adding and stats
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <Appbar.Action icon="chart-bar" onPress={() => navigation.navigate('Stats')} />
          <Appbar.Action icon="plus" onPress={() => navigation.navigate('AddProject')} />
        </View>
      )
    });
  }, [navigation]);

  const handleLongPress = (project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    Alert.alert('Delete project', 'Are you sure you want to delete this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(selectedProject.id);
            setModalVisible(false);
            setSelectedProject(null);
            // Refresh list
            setRefreshing(true);
            await load();
          } catch (err) {
            console.error('Delete failed', err);
            Alert.alert('Delete error', 'Could not delete project. See console for details.');
          }
        }
      }
    ]);
  };

  const handleEdit = () => {
    if (!selectedProject) return;
    setModalVisible(false);
    // navigate to AddProject in edit mode by passing project
    // navigation is not available inside renderItem; rely on navigation from screen via ref
    // but we have access to navigation via props; since this screen is functional component without props,
    // use a small trick: we'll rely on the global navigation via the component's scope by using a ref —
    // simpler: pass navigation from parent by wrapping ProjectsScreen as a screen; we already are in a screen so use a closure.
  };

  if (loading && projects.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProjectCard project={item} onLongPress={handleLongPress} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No projects found.</Text>}
        contentContainerStyle={projects.length === 0 ? styles.emptyContainer : undefined}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: 300, backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Project actions</Text>
            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => {
                // Navigate to edit screen and pass project
                setModalVisible(false);
                navigation.navigate('AddProject', { project: selectedProject });
                setSelectedProject(null);
              }}
            >
              <Text style={{ color: '#007AFF', fontSize: 16 }}>Edit project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ paddingVertical: 10 }} onPress={handleDelete}>
              <Text style={{ color: '#FF3B30', fontSize: 16 }}>Delete project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => {
                setModalVisible(false);
                setSelectedProject(null);
              }}
            >
              <Text style={{ color: '#333', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f2f4f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
