import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function AssetCard({ asset }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View>
          <Text style={styles.name}>{asset.name}</Text>
          <Text style={styles.symbol}>{asset.symbol}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>${(asset.price || 0).toFixed(2)}</Text>
          <View style={[styles.changePill, { backgroundColor: (asset.change >= 0) ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.08)' }]}> 
            <Text style={[styles.change, { color: asset.change >= 0 ? '#2e7d32' : '#c62828' }]}>{asset.change}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginBottom: 14,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    // Android
    elevation: 3,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '600', color: '#111', fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }) },
  symbol: { fontSize: 13, color: '#8b8f96', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#111' },
  changePill: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  change: { fontSize: 13, fontWeight: '600' },
});
