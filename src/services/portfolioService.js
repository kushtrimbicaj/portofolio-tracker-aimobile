// Mock portfolio service

const MOCK_ASSETS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 60000, quantity: 0.12, change: 2.3 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 3500, quantity: 1.5, change: -1.1 },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', price: 1.25, quantity: 1000, change: 0.5 }
];

export async function fetchPortfolio() {
  // Simulate network latency
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_ASSETS), 400));
}

/**
 * Development helper: add an item to the in-memory mock portfolio.
 * This allows testing the Add Asset flow without Supabase configured.
 */
export async function addMockPortfolioItem(item) {
  const id = item.coin_id || item.id || `local-${Date.now()}`;
  const entry = {
    id,
    name: item.name || item.coin_id || 'Unknown',
    symbol: (item.symbol || '').toUpperCase(),
    price: item.last_price ?? item.avg_price ?? 0,
    quantity: Number(item.quantity) || 0,
    change: 0,
    raw: item,
  };
  MOCK_ASSETS.push(entry);
  return entry;
}

export async function removeMockPortfolioItem(id) {
  const idx = MOCK_ASSETS.findIndex((a) => a.id === id || a.symbol === String(id).toUpperCase());
  if (idx >= 0) {
    const [removed] = MOCK_ASSETS.splice(idx, 1);
    return removed;
  }
  throw new Error('mock item not found');
}
