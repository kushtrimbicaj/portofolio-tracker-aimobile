import { createClient, SupabaseClient, RealtimePostgresChangesPayload, Session } from '@supabase/supabase-js';
import { Project } from '../types/project'; // Assumed type import
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabaseClient: SupabaseClient | null = null;

// The current user's session is used to secure data access
let currentSession: Session | null = null;

/**
 * Initialize the Supabase client. Call this once on app startup with your URL and anon key.
 * Throws if keys are missing.
 */
export function initSupabase(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  if (supabaseClient) return supabaseClient; // Prevent re-initialization

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required to initialize Supabase client.');
  }

  // 🚨 CRITICAL FIX: Add the auth block with AsyncStorage
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage, // MUST be here
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 10 } }
  });

  // Set up the listener for session changes
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // This listener is how your application knows the session has changed (logged in/out)
    console.log('Auth State Change Event:', _event); 
    currentSession = session;
  });

  return supabaseClient;
}

function getClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized. Call initSupabase(url, key) first.');
  }
  return supabaseClient;
}

/**
 * Helper to get the current authenticated user's ID.
 * Throws an error if no user is signed in.
 */
async function getAuthId(): Promise<string> {
  const sb = getClient();
  // Fetch user data from the session cache or refresh if needed
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    throw new Error('Authentication required. User is not signed in.');
  }
  return user.id;
}

// --- AUTHENTICATION FUNCTIONS ---

export async function signIn(email: string, password: string): Promise<void> {
    const sb = getClient(); 
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    console.log('User signed in successfully');
}

export async function signUp(email: string, password: string): Promise<any> {
    const sb = getClient();
    // Assuming getClient() retrieves the initialized Supabase instance
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    console.log('User signed up successfully:', data);
    return data;
}

export async function signOut(): Promise<void> {
  const sb = getClient();
  console.log('signOut: calling supabase.auth.signOut()');
  try {
    const { error } = await sb.auth.signOut();
    if (error) {
      console.error('signOut: supabase returned error', error);
      throw error;
    }
    console.log('signOut: completed successfully');
  } catch (e) {
    console.error('signOut: unexpected error', e);
    throw e;
  }
}

export async function getSession(): Promise<Session | null> {
    const sb = getClient();
    // Use the cached session if available, otherwise fetch
    if (currentSession) return currentSession;
    
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) throw error;
    currentSession = session;
    return session;
}

// --- PROJECT DATA ACCESS (Secured by User ID) ---

/** Fetch all projects from the `projects` table for the current user. */
export async function getProjects(): Promise<Project[]> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const { data, error } = await sb.from('projects').select('*').eq('user_id', userId);
    if (error) {
      console.error('getProjects supabase error', error);
      throw error;
    }
    return data ?? [];
  } catch (err) {
    if (err instanceof Error && err.message.includes('Authentication required')) {
      // Allow caller to handle non-authenticated state gracefully
      return []; 
    }
    console.error('getProjects unexpected error', err);
    throw err;
  }
}

/** Insert a new project, returns the inserted row, ensures user_id is set. */
export async function createProject(payload: Partial<Project>): Promise<Project> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const payloadWithId = { ...payload, user_id: userId };
    const { data, error } = await sb.from('projects').insert(payloadWithId).select().single();
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

/** Update an existing project by id, ensures the current user owns the project. */
export async function updateProject(id: string | number, updates: Partial<Project>): Promise<Project> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const { data, error } = await sb.from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // RLS check
      .select()
      .single();
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

/** Delete a project by id, ensures the current user owns the project. */
export async function deleteProject(id: string | number): Promise<void> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const { error } = await sb.from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // RLS check
    if (error) {
      console.error('deleteProject supabase error', error);
      throw error;
    }
  } catch (err) {
    console.error('deleteProject unexpected error', err);
    throw err;
  }
}

// --- PORTFOLIO DATA ACCESS (Secured by User ID) ---

/**
 * Fetch portfolio items: if userId provided, return that user's items; otherwise return public items (user_id IS NULL).
 * Note: When called without userId, it fetches public (unauthenticated) items.
 */
export async function getPortfolioItems(userId?: string | null): Promise<any[]> {
  const sb = getClient();
  try {
    let finalUserId: string | null | undefined = userId;
    
    // If no userId is explicitly passed, try to use the authenticated user's ID
    if (finalUserId === undefined) {
        try {
          finalUserId = await getAuthId();
        } catch (e) {
          // If getAuthId throws (no user signed in), treat as null/public query
          finalUserId = null;
        }
    }

    let query = sb.from('portfolio_items').select('*');
    
    if (finalUserId) {
      query = query.eq('user_id', finalUserId);
    } else {
      query = query.is('user_id', null); // Fetch public items
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

/** Insert a new portfolio item, ensures user_id is set. */
export async function addPortfolioItem(item: any): Promise<any> {
  const sb = getClient();
  const maxAttempts = 3;
  let payload = { ...(item || {}) };
  
  try {
    const userId = await getAuthId();
    payload = { ...payload, user_id: userId };
  } catch (e) {
    // If auth fails, allow adding as a public item (user_id will be missing/null)
    console.warn('Attempting to add portfolio item without user_id (public item)');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data, error } = await sb.from('portfolio_items').insert(payload).select().single();
      if (error) {
        console.error('addPortfolioItem supabase error', error);
        // Retry logic for schema mismatch (removed for brevity, see original for full logic)
        const msg = error?.message || '';
        const m = msg.match(/Could not find the '(.+?)' column/);
        if (m && m[1] && Object.prototype.hasOwnProperty.call(payload, m[1])) {
          const col = m[1];
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete payload[col];
          console.warn(`Removed unknown column '${col}' from payload and will retry insert (attempt ${attempt + 1})`);
          continue;
        }
        throw error;
      }
      return data;
    } catch (err) {
      // Retry logic for schema mismatch in catch block
      const msg = (err && (('' + (err as any).message) || String(err))) || '';
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

/** Update an existing portfolio item by id, ensures the current user owns the item. */
export async function updatePortfolioItem(id: number | string, updates: any): Promise<any> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const { data, error } = await sb.from('portfolio_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // RLS check
      .select()
      .single();
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

/** Delete a portfolio item by id, ensures the current user owns the item. */
export async function deletePortfolioItem(id: number | string): Promise<void> {
  const sb = getClient();
  try {
    const userId = await getAuthId();
    const { error } = await sb.from('portfolio_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // RLS check
    if (error) {
      console.error('deletePortfolioItem supabase error', error);
      throw error;
    }
  } catch (err) {
    console.error('deletePortfolioItem unexpected error', err);
    throw err;
  }
}

// --- REALTIME SUBSCRIPTION ---

/**
 * Subscribe to realtime changes on the `projects` table for the current user. 
 * The callback receives the realtime payload.
 * Returns an unsubscribe function to stop listening.
 */
export function subscribeToProjects(
  callback: (payload: RealtimePostgresChangesPayload<Project>) => void
): () => Promise<void> {
  const sb = getClient();
  
  // NOTE: Realtime RLS only works if you subscribe using a JWT (which Supabase client handles automatically).
  // The policy on the 'projects' table must ensure the user only sees their own changes.
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
export function getSupabaseClient(): SupabaseClient {
  return getClient(); // Use getClient to ensure initialization check
}

/** Legacy function - replaced by getPortfolioItems */
export async function getPortfolioItemsByUser(userId: string): Promise<any[]> {
  return getPortfolioItems(userId);
}