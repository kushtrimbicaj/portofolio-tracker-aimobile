import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { FAB, Button, Menu, IconButton, Dialog, Portal, RadioButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import usePortfolio from '../hooks/usePortfolio';
import AssetCard from '../components/AssetCard';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { deletePortfolioItem } from '../services/supabase';
import { removeMockPortfolioItem } from '../services/portfolioService';

export default function HomeScreen({ navigation }) {
  const { assets, refresh } = usePortfolio();

  // Sorting/filtering state
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [sortMode, setSortMode] = React.useState('value'); // 'quantity' | 'name' | 'value'
  const [filterCategory, setFilterCategory] = React.useState(null); // null = all
  const [filterGainLoss, setFilterGainLoss] = React.useState('all'); // 'all'|'gain'|'loss'

  // Add header buttons for Add and Sort/Filter
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button compact onPress={() => navigation.navigate('AddAsset')}>Add</Button>
          <IconButton
            icon="filter-variant"
            size={20}
            onPress={() => setFilterVisible(true)}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<IconButton icon="sort" size={20} onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item onPress={() => { setSortMode('value'); setMenuVisible(false); }} title="Sort by highest value" />
            <Menu.Item onPress={() => { setSortMode('quantity'); setMenuVisible(false); }} title="Sort by highest quantity" />
            <Menu.Item onPress={() => { setSortMode('name'); setMenuVisible(false); }} title="Sort by name (A–Z)" />
          </Menu>
        </View>
      ),
    });
  }, [navigation, menuVisible]);

  // Refresh when screen gains focus (useful after returning from AddAsset)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // derive categories present in assets
  const categories = React.useMemo(() => {
    const set = new Set();
    (assets || []).forEach(a => { if (a?.category) set.add(a.category); });
    return Array.from(set);
  }, [assets]);

  // apply filtering and sorting client-side
  const displayedAssets = React.useMemo(() => {
    if (!assets) return [];
    let list = assets.slice();

    // Filter by category
    if (filterCategory) {
      list = list.filter(a => (a?.category || null) === filterCategory);
    }

    // Filter by gain/loss if avg_price and last_price exist
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

    // Sorting
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
      // default: value
      const va = (Number(a?.last_price ?? a?.lastPrice ?? a?.price ?? 0) * Number(a?.quantity ?? 0)) || 0;
      const vb = (Number(b?.last_price ?? b?.lastPrice ?? b?.price ?? 0) * Number(b?.quantity ?? 0)) || 0;
      return vb - va;
    });

    return list;
  }, [assets, sortMode, filterCategory, filterGainLoss]);

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedAssets}
        keyExtractor={(item) => item.id || item.coin_id || item.symbol}
        refreshing={false}
        onRefresh={refresh}
        renderItem={({ item }) => {
          const renderRightActions = () => (
            <RectButton style={styles.rightAction} onPress={() => {
              Alert.alert('Delete asset', `Delete ${item.name} (${item.symbol})?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  try {
                    // prefer raw.id (server id) when available
                    const idToDelete = item.raw?.id ?? item.id;
                    await deletePortfolioItem(idToDelete);
                    refresh();
                  } catch (err) {
                    // fallback to mock delete
                    try {
                      await removeMockPortfolioItem(item.id || item.symbol);
                      refresh();
                    } catch (mErr) {
                      console.error('Failed to delete asset', mErr || err);
                      Alert.alert('Delete failed', 'Could not delete asset');
                    }
                  }
                }}
              ]);
            }}>
              <Text style={{ color: '#fff', paddingHorizontal: 16 }}>Delete</Text>
            </RectButton>
          );

          return (
            <Swipeable renderRightActions={renderRightActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Details', { asset: item })}
                onLongPress={() => navigation.navigate('AddAsset', { item })}
                delayLongPress={300}
              >
                <AssetCard asset={item} />
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No assets yet</Text>}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAsset')}
      />

      {/* Bottom center toggle between Home and Stats */}
      <View style={styles.bottomToggle} pointerEvents="box-none">
        <Button mode={navigation?.route?.name === 'Home' ? 'contained' : 'outlined'} onPress={() => navigation.navigate('Home')} compact>
          Home
        </Button>
        <Button style={{ marginLeft: 12 }} mode={navigation?.route?.name === 'Stats' ? 'contained' : 'outlined'} onPress={() => navigation.navigate('Stats')} compact>
          Stats
        </Button>
      </View>

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Filters</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 8 }}>Category</Text>
            <RadioButton.Group onValueChange={v => setFilterCategory(v === 'all' ? null : v)} value={filterCategory ?? 'all'}>
              <RadioButton.Item label="All" value="all" />
              {categories.map(c => (
                <RadioButton.Item key={c} label={c} value={c} />
              ))}
            </RadioButton.Group>

            <Text style={{ marginTop: 12, marginBottom: 8 }}>Gain / Loss</Text>
            <RadioButton.Group onValueChange={v => setFilterGainLoss(v)} value={filterGainLoss}>
              <RadioButton.Item label="All" value="all" />
              <RadioButton.Item label="Gain" value="gain" />
              <RadioButton.Item label="Loss" value="loss" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setFilterCategory(null); setFilterGainLoss('all'); setFilterVisible(false); }}>Reset</Button>
            <Button onPress={() => setFilterVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  rightAction: {
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginVertical: 6,
    borderRadius: 8,
  },
  bottomToggle: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 18,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 20,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 26,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
});
