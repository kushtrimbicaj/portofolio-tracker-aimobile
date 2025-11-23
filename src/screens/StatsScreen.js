import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import usePortfolio from '../hooks/usePortfolio';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { assets } = usePortfolio();

  // Build pie chart data from assets: value = last_price * quantity
  const total = (assets || []).reduce((s, a) => s + Number(a.value || 0), 0);
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#03a9f4', '#cddc39'];
  const data = (assets || []).map((a, i) => {
    const value = Number(a.value || 0);
    return {
      name: a.name || a.symbol || `Asset ${i + 1}`,
      population: value,
      color: colors[i % colors.length],
      legendFontColor: '#6b6f76',
      legendFontSize: 12,
    };
  }).filter(d => d.population > 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Title style={styles.title}><Text>Portfolio Allocation</Text></Title>
      </View>

      <View style={styles.card}>
        {data.length === 0 ? (
          <Text style={styles.empty}>No data available to render a chart.</Text>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={data}
              width={Math.min(screenWidth - 40, 360)}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />

            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#f2f4f7' },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  empty: { color: '#8b8f96', marginTop: 8 },
  total: { marginTop: 12, fontSize: 16, fontWeight: '600', color: '#111' },
});
