import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { FAB, Button, Menu, IconButton, Dialog, Portal, RadioButton, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import usePortfolio from '../hooks/usePortfolio';
import AssetCard from '../components/AssetCard';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { deletePortfolioItem, getSupabaseClient, signOut } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const IOS_BLUE = '#007AFF';

export default function HomeScreen({ navigation }) {
  const { assets, refresh } = usePortfolio();

  const [menuVisible, setMenuVisible] = React.useState(false);
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [sortMode, setSortMode] = React.useState('value');
  const [filterCategory, setFilterCategory] = React.useState(null);
  const [filterGainLoss, setFilterGainLoss] = React.useState('all');

  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');

  const performSignOut = async () => {
    try {
      await signOut();
      setSnackbarMsg('Signed out');
      setSnackbarVisible(true);
      try { navigation.reset && navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }); } catch (_) { try { navigation.navigate('Auth'); } catch (_) {} }
    } catch (err) {
      setSnackbarMsg('Sign out failed');
      setSnackbarVisible(true);
      console.error('signOut error:', err);
    }
  };

  const handleLogout = async () => {
    await performSignOut();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <IconButton
            icon="logout"
            size={24}
            color={IOS_BLUE}
            onPress={handleLogout}
            accessibilityLabel="logout-button"
            testID="logout-button"
          />
          <IconButton
            icon="filter-variant"
            size={24}
            color={IOS_BLUE}
            onPress={() => setFilterVisible(true)}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<IconButton icon="sort" size={24} color={IOS_BLUE} onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item onPress={() => { setSortMode('value'); setMenuVisible(false); }} title="Sort by highest value" />
            <Menu.Item onPress={() => { setSortMode('quantity'); setMenuVisible(false); }} title="Sort by highest quantity" />
            <Menu.Item onPress={() => { setSortMode('name'); setMenuVisible(false); }} title="Sort by name (A–Z)" />
          </Menu>
        </View>
      ),
    });
  }, [navigation, menuVisible, handleLogout]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const categories = React.useMemo(() => {
    const set = new Set();
    (assets || []).forEach(a => { if (a?.category) set.add(a.category); });
    return Array.from(set);
  }, [assets]);

  const displayedAssets = React.useMemo(() => {
    if (!assets) return [];
    let list = assets.slice();

    if (filterCategory) {
      list = list.filter(a => (a?.category || null) === filterCategory);
    }

    if (filterGainLoss && filterGainLoss !== 'all') {
      list = list.filter(a => {
        const avg = Number(a?.avg_price ?? a?.avgPrice ?? NaN);
        const last = Number(a?.last_price ?? a?.lastPrice ?? a?.price ?? NaN);
        const qty = Number(a?.quantity ?? 0);
        if (isNaN(avg) || isNaN(last)) return false;
        const gain = (last - avg) * qty;
        if (filterGainLoss === 'gain') return gain > 0;
        if (filterGainLoss === 'loss') return gain < 0;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortMode === 'quantity') {
        const qa = Number(a?.quantity ?? 0);
        const qb = Number(b?.quantity ?? 0);
        return qb - qa;
      }
      if (sortMode === 'name') {
        const na = (a?.name || '').toString().toLowerCase();
        const nb = (b?.name || '').toString().toLowerCase();
        return na.localeCompare(nb);
      }
      const va = (Number(a?.last_price ?? a?.lastPrice ?? a?.price ?? 0) * Number(a?.quantity ?? 0)) || 0;
      const vb = (Number(b?.last_price ?? b?.lastPrice ?? b?.price ?? 0) * Number(b?.quantity ?? 0)) || 0;
      return vb - va;
    });

    return list;
  }, [assets, sortMode, filterCategory, filterGainLoss]);

  const renderRightActions = (item) => () => (
    <RectButton style={styles.rightAction} onPress={() => {
      Alert.alert('Delete asset', `Delete ${item.name} (${item.symbol})?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const idToDelete = item.raw?.id ?? item.id;
              await deletePortfolioItem(idToDelete);
              refresh();
            } catch (err) {
              console.error('Failed to delete asset from Supabase:', err);
              Alert.alert('Delete failed', 'Could not delete asset from the server. Please check your connection or permissions.');
            }
          }
        },
      ]);
    }}>
      <Text style={styles.rightActionText}>Delete</Text>
    </RectButton>
  );

  return (
    <LinearGradient colors={['#FDFBFB', '#EBEDEE']} style={styles.gradientContainer}>
      <View style={styles.contentWrapper}>
        <FlatList
          data={displayedAssets}
          keyExtractor={(item) => item.id || item.coin_id || item.symbol}
          refreshing={false}
          onRefresh={refresh}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={renderRightActions(item)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Details', { asset: item })}
                onLongPress={() => navigation.navigate('AddAsset', { item })}
                delayLongPress={300}
              >
                <AssetCard asset={item} />
              </TouchableOpacity>
            </Swipeable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No assets yet. Tap the '+' button to begin.</Text>}
        />
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>

      <FAB
        icon="plus"
        color="#fff"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAsset')}
      />

      <View style={styles.bottomToggle} pointerEvents="box-none">
        <Button
          mode={navigation?.route?.name === 'Home' ? 'contained' : 'text'}
          onPress={() => navigation.navigate('Home')}
          style={navigation?.route?.name === 'Home' ? styles.toggleButtonContained : styles.toggleButtonOutlined}
          labelStyle={navigation?.route?.name === 'Home' ? styles.toggleButtonLabelContained : styles.toggleButtonLabelOutlined}
          icon={navigation?.route?.name === 'Home' ? "briefcase" : "briefcase-outline"}
        >
          Portfolio
        </Button>
        <Button
          mode={navigation?.route?.name === 'Stats' ? 'contained' : 'text'}
          onPress={() => navigation.navigate('Stats')}
          style={[styles.toggleButtonSpacing, navigation?.route?.name === 'Stats' ? styles.toggleButtonContained : styles.toggleButtonOutlined]}
          labelStyle={navigation?.route?.name === 'Stats' ? styles.toggleButtonLabelContained : styles.toggleButtonLabelOutlined}
          icon={navigation?.route?.name === 'Stats' ? "chart-areaspline" : "chart-areaspline-variant"}
        >
          Analytics
        </Button>
      </View>

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Filter Assets</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogHeader}>Category</Text>
            <RadioButton.Group onValueChange={v => setFilterCategory(v === 'all' ? null : v)} value={filterCategory ?? 'all'}>
              <RadioButton.Item label="All Categories" value="all" color={IOS_BLUE} />
              {categories.map(c => (
                <RadioButton.Item key={c} label={c} value={c} color={IOS_BLUE} />
              ))}
            </RadioButton.Group>

            <Text style={[styles.dialogHeader, { marginTop: 20 }]}>Gain/Loss</Text>
            <RadioButton.Group onValueChange={setFilterGainLoss} value={filterGainLoss}>
              <RadioButton.Item label="All" value="all" color={IOS_BLUE} />
              <RadioButton.Item label="Assets with a Gain" value="gain" color={IOS_BLUE} />
              <RadioButton.Item label="Assets with a Loss" value="loss" color={IOS_BLUE} />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setFilterCategory(null); setFilterGainLoss('all'); }}>
              Clear
            </Button>
            <Button onPress={() => setFilterVisible(false)} color={IOS_BLUE}>
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  contentWrapper: { flex: 1, paddingHorizontal: Platform.OS === 'ios' ? 15 : 0 },
  flatListContent: { paddingTop: 10, paddingBottom: 150 },
  empty: { textAlign: 'center', marginTop: 50, color: '#666', paddingHorizontal: 30 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 80, backgroundColor: IOS_BLUE, borderRadius: 28, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  rightAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'flex-end', flex: 1, marginVertical: 8, borderRadius: 10, maxWidth: 80, marginRight: 15 },
  rightActionText: { color: 'white', paddingHorizontal: 15, fontWeight: '600', fontSize: 16 },
  bottomToggle: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: '50%', transform: [{ translateX: -120 }], flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 15, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  toggleButtonContained: { backgroundColor: IOS_BLUE, borderRadius: 10, minWidth: 110, paddingVertical: 2 },
  toggleButtonOutlined: { backgroundColor: 'transparent', borderRadius: 10, minWidth: 110, paddingVertical: 2 },
  toggleButtonLabelContained: { color: '#fff', fontWeight: '600' },
  toggleButtonLabelOutlined: { color: IOS_BLUE, fontWeight: '500' },
  toggleButtonSpacing: { marginLeft: 5 },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  dialogHeader: { fontWeight: 'bold', fontSize: 16, marginTop: 10, marginBottom: 5, color: '#333' },
});
