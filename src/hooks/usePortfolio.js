import { useEffect, useState, useCallback } from 'react';
import { fetchPortfolio } from '../services/portfolioService';
import { getPortfolioItems, getSupabaseClient } from '../services/supabase';
import { fetchSimplePrice } from '../services/coingecko';

/**
 * usePortfolio: tries to load portfolio items from Supabase (if initialized).
 * Falls back to the mock `fetchPortfolio` when Supabase isn't available or an error occurs.
 */
export default function usePortfolio() {
  const [assets, setAssets] = useState([]);

  const load = useCallback(async () => {
    // Try Supabase first
    try {
      // Quick check whether supabase client exists
      const sb = getSupabaseClient();
      if (sb) {
        // Try getting current user id if possible
        let userId = null;
        try {
          if (sb.auth && typeof sb.auth.getUser === 'function') {
            const ures = await sb.auth.getUser();
            userId = ures?.data?.user?.id ?? null;
          }
        } catch (e) {
          // ignore auth lookup errors
        }

  const items = await getPortfolioItems(userId ?? null);
        if (items && items.length > 0) {
          // fetch prices from CoinGecko for all coin_ids
          const coinIds = items.map((it) => it.coin_id).filter(Boolean);
          let prices = {};
          try {
            if (coinIds.length) prices = await fetchSimplePrice(coinIds, 'usd');
          } catch (e) {
            console.warn('Price fetch failed', e);
            prices = {};
          }

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
          return;
        }
      }
    } catch (e) {
      // supabase not initialized or other error — fall back below
      console.warn('Supabase portfolio load failed, falling back to mock', e);
    }

    // Fallback: mock local portfolio
    try {
      const data = await fetchPortfolio();
      setAssets(data);
    } catch (e) {
      console.warn('Failed to load mock portfolio', e);
      setAssets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { assets, refresh: load };
}
