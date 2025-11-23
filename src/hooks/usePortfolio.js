import { useEffect, useState, useCallback } from 'react';
import { getPortfolioItems, getSupabaseClient } from '../services/supabase';
import { fetchSimplePrice } from '../services/coingecko';
// REMOVED: import { fetchPortfolio } from '../services/portfolioService'; 
// (Ensure you delete this line or the bundler will error if portfolioService.js is deleted)

/**
 * usePortfolio: loads portfolio items from Supabase, enriching them with CoinGecko prices.
 */
export default function usePortfolio() {
  const [assets, setAssets] = useState([]);

  const load = useCallback(async () => {
    // Start by trying to load from Supabase
    try {
      // 1. Check if Supabase client exists
      const sb = getSupabaseClient();
      if (!sb) {
        console.warn('Supabase client not initialized.');
        setAssets([]);
        return;
      }

      // 2. Try getting current user ID
      let userId = null;
      try {
        if (sb.auth && typeof sb.auth.getUser === 'function') {
          const ures = await sb.auth.getUser();
          userId = ures?.data?.user?.id ?? null;
        }
      } catch (e) {
        console.warn('Auth lookup failed, proceeding without user ID.', e);
      }

      // 3. Fetch portfolio items from Supabase
      const items = await getPortfolioItems(userId ?? null);
      
      if (!items || items.length === 0) {
        setAssets([]);
        return;
      }

      // 4. Fetch prices from CoinGecko for all coin_ids
      const coinIds = items.map((it) => it.coin_id).filter(Boolean);
      let prices = {};
      try {
        if (coinIds.length) prices = await fetchSimplePrice(coinIds, 'usd');
      } catch (e) {
        console.warn('Price fetch failed', e);
        prices = {};
      }

      // 5. Enriched the items with live price data
      const enriched = items.map((it) => {
        const priceObj = prices[it.coin_id] || {};
        const price = priceObj.usd ?? it.last_price ?? 0;
        const change = priceObj.usd_24h_change ?? 0;
        const quantity = Number(it.quantity) || 0;
        return {
          id: String(it.id ?? it.coin_id),
          name: it.name ?? it.coin_id,
          symbol: (it.symbol || '').toUpperCase(),
          price,
          quantity,
          change,
          value: price * quantity,
          raw: it,
        };
      });
      
      setAssets(enriched);
      
    } catch (e) {
      // Catch any unexpected Supabase errors and clear assets
      console.error('Supabase portfolio load failed. Displaying empty portfolio.', e);
      setAssets([]);
    }

    // REMOVED: The entire mock fallback block was here.

  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { assets, refresh: load };
}