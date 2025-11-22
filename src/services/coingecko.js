const API_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchCoinList() {
  const res = await fetch(`${API_BASE}/coins/list`);
  if (!res.ok) throw new Error('Failed to fetch coin list');
  return res.json();
}

export async function findCoinBySymbol(symbol) {
  if (!symbol) return null;
  const q = symbol.trim();
  // Prefer the search endpoint which returns relevance-ranked results.
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const j = await res.json();
      const coins = j.coins || [];
      if (coins.length) {
        // return the top result
        return coins[0];
      }
    }
  } catch (e) {
    // fallback to list lookup below
    console.warn('CoinGecko search failed, falling back to list', e);
  }

  // Fallback: use coins/list (larger payload) and match by symbol
  const symbolLower = symbol.toLowerCase();
  const list = await fetchCoinList();
  // prefer first exact symbol match
  const exact = list.find((c) => c.symbol.toLowerCase() === symbolLower);
  return exact || null;
}

export async function fetchSimplePrice(coinIds = [], vs = 'usd') {
  const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
  const res = await fetch(`${API_BASE}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${vs}&include_24hr_change=true`);
  if (!res.ok) throw new Error('Failed to fetch simple price');
  return res.json();
}

export async function fetchMarketChart(coinId, days = 30, vs = 'usd') {
  const res = await fetch(`${API_BASE}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${vs}&days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch market chart');
  return res.json();
}

export async function fetchCoinDetails(coinId) {
  if (!coinId) throw new Error('coinId is required');
  const res = await fetch(`${API_BASE}/coins/${encodeURIComponent(coinId)}`);
  if (!res.ok) throw new Error('Failed to fetch coin details');
  return res.json();
}

/**
 * Search for coins by query and return an array of matching coins (id, name, symbol, thumb/large image if available).
 */
export async function searchCoins(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const j = await res.json();
    const coins = (j.coins || []).map((c) => ({ id: c.id, name: c.name, symbol: c.symbol, thumb: c.thumb, large: c.large }));
    return coins;
  } catch (e) {
    console.warn('searchCoins failed', e);
    return [];
  }
}

export default {
  fetchCoinList,
  findCoinBySymbol,
  fetchSimplePrice,
  fetchMarketChart,
  fetchCoinDetails,
};
