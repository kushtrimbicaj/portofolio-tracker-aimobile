const MOCK_ASSETS = [
  {
    id: 'btc-manual',
    coin_id: 'manual-btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 54000,
    quantity: 0.12,
    change: 2.5,
    value: 54000 * 0.12,
    avg_price: 45000,
    last_price: 54000,
  },
  {
    id: 'eth-manual',
    coin_id: 'manual-eth',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3400,
    quantity: 1.5,
    change: -1.2,
    value: 3400 * 1.5,
    avg_price: 3000,
    last_price: 3400,
  },
];

let inMemory = [...MOCK_ASSETS];

export async function fetchPortfolio() {
  // simulate async fetch
  return new Promise((resolve) => setTimeout(() => resolve(inMemory.slice()), 120));
}

export async function addMockPortfolioItem(item) {
  const toAdd = {
    id: item.id ?? `local-${Date.now()}`,
    coin_id: item.coin_id ?? `manual-${(item.symbol || 'asset').toLowerCase()}-${Date.now()}`,
    name: item.name || item.symbol || 'Unknown',
    symbol: (item.symbol || '').toUpperCase(),
    price: item.last_price ?? item.price ?? 0,
    last_price: item.last_price ?? item.price ?? 0,
    quantity: Number(item.quantity) || 0,
    change: item.change ?? 0,
    avg_price: item.avg_price ?? null,
    value: (Number(item.last_price ?? item.price ?? 0) * Number(item.quantity || 0)) || 0,
    raw: item,
  };
  inMemory = [toAdd, ...inMemory];
  return toAdd;
}

export async function removeMockPortfolioItem(idOrSymbol) {
  const key = String(idOrSymbol || '');
  const prev = inMemory.length;
  inMemory = inMemory.filter(a => a.id !== key && a.symbol !== key && a.coin_id !== key);
  return prev !== inMemory.length;
}

export default {
  fetchPortfolio,
  addMockPortfolioItem,
  removeMockPortfolioItem,
};
