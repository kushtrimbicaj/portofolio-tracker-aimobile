import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DetailsScreen({ route }) {
  const { asset } = route.params || {};

  if (!asset) {
    return (
      <View style={styles.container}>
        <Text>No asset selected.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{asset.name} ({asset.symbol})</Text>
      <Text style={styles.price}>Price: ${asset.price.toFixed(2)}</Text>
      <Text>Quantity: {asset.quantity}</Text>
      <Text>Value: ${(asset.price * asset.quantity).toFixed(2)}</Text>
      <Text style={{ marginTop: 12, color: asset.change >= 0 ? 'green' : 'red' }}>
        24h: {asset.change}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  price: { fontSize: 18, marginBottom: 6 },
});
