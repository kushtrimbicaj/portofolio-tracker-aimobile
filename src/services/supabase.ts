import { createClient, SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Project } from '../types/project';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client. Call this once on app startup with your URL and anon key.
 * Throws if keys are missing.
 */
export function initSupabase(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required to initialize Supabase client.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: { params: { eventsPerSecond: 10 } }
  });

  return supabaseClient;
}

function getClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized. Call initSupabase(url, key) first.');
  }
  return supabaseClient;
}

// The `Project` type is defined in src/types/project.ts

/** Fetch all projects from the `projects` table. */
export async function getProjects(): Promise<Project[]> {
  const sb = getClient();
  try {
  const { data, error } = await sb.from('projects').select('*');
    if (error) {
      console.error('getProjects supabase error', error);
      throw error;
    }
    return data ?? [];
  } catch (err) {
    console.error('getProjects unexpected error', err);
    throw err;
  }
}

/** Insert a new project, returns the inserted row. */
export async function createProject(payload: Partial<Project>): Promise<Project> {
  const sb = getClient();
  try {
  const { data, error } = await sb.from('projects').insert(payload).select().single();
    if (error) {
      console.error('createProject supabase error', error);
      throw error;
    }
    return data as Project;
  } catch (err) {
    console.error('createProject unexpected error', err);
    throw err;
  }
}

/** Update an existing project by id, returns the updated row. */
export async function updateProject(id: string | number, updates: Partial<Project>): Promise<Project> {
  const sb = getClient();
  try {
  const { data, error } = await sb.from('projects').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('updateProject supabase error', error);
      throw error;
    }
    return data as Project;
  } catch (err) {
    console.error('updateProject unexpected error', err);
    throw err;
  }
}

/** Delete a project by id. */
export async function deleteProject(id: string | number): Promise<void> {
  const sb = getClient();
  try {
    const { error } = await sb.from('projects').delete().eq('id', id);
    if (error) {
      console.error('deleteProject supabase error', error);
      throw error;
    }
  } catch (err) {
    console.error('deleteProject unexpected error', err);
    throw err;
  }
}

/**
 * Subscribe to realtime changes on the `projects` table. The callback receives the realtime payload.
 * Returns an unsubscribe function to stop listening.
 */
export function subscribeToProjects(
  callback: (payload: RealtimePostgresChangesPayload<Project>) => void
): () => Promise<void> {
  const sb = getClient();
  try {
    const channel = sb
      .channel('public:projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload: RealtimePostgresChangesPayload<Project>) => {
          try {
            callback(payload);
          } catch (cbErr) {
            console.error('subscribe callback error', cbErr);
          }
        }
      )
      .subscribe();

    return async () => {
      try {
        // removeChannel is the recommended way to clean up
        await sb.removeChannel(channel);
      } catch (unsubErr) {
        console.error('unsubscribe error', unsubErr);
      }
    };
  } catch (err) {
    console.error('subscribeToProjects error', err);
    throw err;
  }
}

/** Expose supabase client for auth or other direct usage */
export function getSupabaseClient() {
  return getClient();
}

// Portfolio item helpers (assumes table 'portfolio_items' exists with user_id, coin_id, symbol, quantity, avg_price)
export async function getPortfolioItemsByUser(userId: string): Promise<any[]> {
  const sb = getClient();
  try {
    const { data, error } = await sb.from('portfolio_items').select('*').eq('user_id', userId);
    if (error) {
      console.error('getPortfolioItemsByUser supabase error', error);
      throw error;
    }
    return data ?? [];
  } catch (err) {
    console.error('getPortfolioItemsByUser unexpected error', err);
    throw err;
  }
}

/**
 * Fetch portfolio items: if userId provided, return that user's items; otherwise return public items (user_id IS NULL).
 */
export async function getPortfolioItems(userId?: string | null): Promise<any[]> {
  const sb = getClient();
  try {
    let query = sb.from('portfolio_items').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    const { data, error } = await query;
    if (error) {
      console.error('getPortfolioItems supabase error', error);
      throw error;
    }
    return data ?? [];
  } catch (err) {
    console.error('getPortfolioItems unexpected error', err);
    throw err;
  }
}

export async function addPortfolioItem(item: any): Promise<any> {
  const sb = getClient();
  // Attempt insert, but be tolerant of unknown/missing columns in the DB schema.
  // If Supabase returns a schema-cache error like "Could not find the 'image' column...",
  // strip that field from the payload and retry a few times.
  const maxAttempts = 3;
  let payload = { ...(item || {}) };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data, error } = await sb.from('portfolio_items').insert(payload).select().single();
      if (error) {
        console.error('addPortfolioItem supabase error', error);
        // Try to parse missing-column message and remove that property then retry
        const msg = error?.message || '';
        const m = msg.match(/Could not find the '(.+?)' column/);
        if (m && m[1] && Object.prototype.hasOwnProperty.call(payload, m[1])) {
          const col = m[1];
          // remove and retry
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete payload[col];
          console.warn(`Removed unknown column '${col}' from payload and will retry insert (attempt ${attempt + 1})`);
          continue;
        }
        throw error;
      }
      return data;
    } catch (err) {
      // Some errors may not be in the { data, error } form. Inspect message and try the same strategy.
      const msg = err && (((err as any).message) || String(err));
      const m = ('' + msg).match(/Could not find the '(.+?)' column/);
      if (m && m[1] && Object.prototype.hasOwnProperty.call(payload, m[1])) {
        const col = m[1];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete payload[col];
        console.warn(`Removed unknown column '${col}' from payload after catch and will retry insert (attempt ${attempt + 1})`);
        continue;
      }
      console.error('addPortfolioItem unexpected error', err);
      throw err;
    }
  }

  throw new Error('addPortfolioItem failed after retries due to schema mismatch');
}

export async function updatePortfolioItem(id: number | string, updates: any): Promise<any> {
  const sb = getClient();
  try {
    const { data, error } = await sb.from('portfolio_items').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('updatePortfolioItem supabase error', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('updatePortfolioItem unexpected error', err);
    throw err;
  }
}

export async function deletePortfolioItem(id: number | string): Promise<void> {
  const sb = getClient();
  try {
    const { error } = await sb.from('portfolio_items').delete().eq('id', id);
    if (error) {
      console.error('deletePortfolioItem supabase error', error);
      throw error;
    }
  } catch (err) {
    console.error('deletePortfolioItem unexpected error', err);
    throw err;
  }
}
