import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { IconButton as PaperIconButton } from 'react-native-paper'; 
import { useFocusEffect } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard'; 
import { getProjects, deleteProject } from '../services/supabase'; 
import { LinearGradient } from 'expo-linear-gradient'; 

// iOS accent color
const IOS_BLUE = '#007AFF';

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

  // Load projects on mount
  useEffect(() => {
    load();
  }, [load]);

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // 🚀 FIX: Use useLayoutEffect to ensure header buttons render immediately
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
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
      // Assuming headerLeft is handled in App.js now, but included here for completeness
      // headerLeft: () => null, 
    });
  }, [navigation]);

  const handleLongPress = (project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    Alert.alert('Delete project', `Are you sure you want to delete "${selectedProject.name || 'this project'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(selectedProject.id);
            setModalVisible(false);
            setSelectedProject(null);
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
    navigation.navigate('AddProject', { project: selectedProject });
    setSelectedProject(null);
  };

  if (loading && projects.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={IOS_BLUE} />
        <Text style={{ marginTop: 12 }}>Loading projects...</Text>
      </View>
    );
  }

  return (
    // Background: Apple Silver Frost Gradient
    <LinearGradient
      colors={['#FDFBFB', '#EBEDEE']}
      style={styles.gradientContainer}
    >
      <FlatList
        data={projects}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProjectCard project={item} onLongPress={() => handleLongPress(item)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={IOS_BLUE} />}
        ListEmptyComponent={<Text style={styles.empty}>No projects found. Tap the plus button to create one.</Text>}
        contentContainerStyle={[
          styles.flatListContent,
          projects.length === 0 ? styles.emptyContainer : undefined
        ]}
      />

      {/* Modal for Edit/Delete actions on long press */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)} // Dismiss modal on outside tap
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Project Actions</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleEdit}>
              <Text style={styles.modalOptionText}>Edit Project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Text style={styles.modalOptionDestructive}>Delete Project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => {
                setModalVisible(false);
                setSelectedProject(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  flatListContent: {
    padding: 15,
    paddingTop: 10,
    minHeight: '100%', // Ensures ListEmptyComponent is centered
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // --- Header Styles ---
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    color: IOS_BLUE,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOptionDestructive: {
    color: '#FF3B30', // iOS Red for delete
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalCancel: {
    borderBottomWidth: 0,
    marginTop: 5,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  }
});