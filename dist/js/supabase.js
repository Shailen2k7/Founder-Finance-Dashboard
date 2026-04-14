/* ============================================
   Supabase Integration Layer
   ============================================ */

import { store } from './store.js';
import { showToast } from './ui.js';

let supabaseClient = null;

// Initialize Supabase client
export async function initSupabase() {
  const url = localStorage.getItem('ffd_supabase_url');
  const key = localStorage.getItem('ffd_supabase_key');

  if (!url || !key) {
    console.log('Supabase not configured — using local storage mode');
    store.set({ supabaseConnected: false });
    await loadFromLocalStorage();
    return false;
  }

  try {
    // Dynamic import of Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabaseClient = createClient(url, key);

    // Test connection
    const { error } = await supabaseClient.from('ffd_entries').select('id', { count: 'exact', head: true });
    if (error) throw error;

    store.set({ supabaseConnected: true });
    console.log('Supabase connected successfully');
    await fetchAllData();
    setupRealtimeSubscription();
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    store.set({ supabaseConnected: false });
    showToast('Database connection failed. Using local storage.', 'warning');
    await loadFromLocalStorage();
    return false;
  }
}

// Configure Supabase credentials
export function configureSupabase(url, key) {
  localStorage.setItem('ffd_supabase_url', url.trim());
  localStorage.setItem('ffd_supabase_key', key.trim());
}

// Fetch all data from Supabase
async function fetchAllData() {
  store.set({ loading: true });
  try {
    const [entriesRes, channelsRes, settingsRes] = await Promise.all([
      supabaseClient.from('ffd_entries').select('*').order('date', { ascending: false }),
      supabaseClient.from('ffd_channels').select('*'),
      supabaseClient.from('ffd_settings').select('*')
    ]);

    if (entriesRes.error) throw entriesRes.error;

    const entries = (entriesRes.data || []).map(normalizeEntry);
    const channels = channelsRes.data || [];
    const settings = {};
    for (const s of (settingsRes.data || [])) settings[s.key] = s.value;

    store.set({ entries, channels, settings, loading: false });
    saveToLocalStorage(); // Keep local backup
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showToast('Failed to load data from database', 'error');
    store.set({ loading: false });
  }
}

// Insert entries into Supabase
export async function insertEntries(entries) {
  if (!supabaseClient) {
    // Local storage mode
    const existing = store.get('entries');
    const maxId = existing.reduce((max, e) => Math.max(max, parseInt(e.id) || 0), 0);
    const newEntries = entries.map((e, i) => ({ ...e, id: maxId + i + 1 }));
    store.set({ entries: [...newEntries, ...existing] });
    saveToLocalStorage();
    return { data: newEntries, error: null };
  }

  try {
    // Get next ID
    const { data: maxRow } = await supabaseClient
      .from('ffd_entries')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    let nextId = (maxRow?.[0]?.id || 0) + 1;

    const rows = entries.map((e, i) => ({
      id: nextId + i,
      date: e.date,
      business: e.business,
      account: e.account || 'default',
      type: e.type,
      category: e.category,
      description: e.description || '',
      amount: parseFloat(e.amount) || 0,
      is_duplicate: e.is_duplicate || false
    }));

    const { data, error } = await supabaseClient
      .from('ffd_entries')
      .insert(rows)
      .select();

    if (error) throw error;

    // Update local state
    const normalized = (data || rows).map(normalizeEntry);
    store.set({ entries: [...normalized, ...store.get('entries')] });
    saveToLocalStorage();
    return { data: normalized, error: null };
  } catch (err) {
    console.error('Insert failed:', err);
    return { data: null, error: err };
  }
}

// Update an entry
export async function updateEntry(id, updates) {
  if (!supabaseClient) {
    const entries = store.get('entries').map(e =>
      e.id == id ? { ...e, ...updates } : e
    );
    store.set({ entries });
    saveToLocalStorage();
    return { error: null };
  }

  try {
    const { error } = await supabaseClient
      .from('ffd_entries')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    const entries = store.get('entries').map(e =>
      e.id == id ? { ...e, ...updates } : e
    );
    store.set({ entries });
    saveToLocalStorage();
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// Delete an entry
export async function deleteEntry(id) {
  if (!supabaseClient) {
    store.set({ entries: store.get('entries').filter(e => e.id != id) });
    saveToLocalStorage();
    return { error: null };
  }

  try {
    const { error } = await supabaseClient
      .from('ffd_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
    store.set({ entries: store.get('entries').filter(e => e.id != id) });
    saveToLocalStorage();
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// Delete multiple entries by IDs
export async function deleteEntries(ids) {
  if (!supabaseClient) {
    store.set({ entries: store.get('entries').filter(e => !ids.includes(e.id)) });
    saveToLocalStorage();
    return { error: null };
  }

  try {
    const { error } = await supabaseClient
      .from('ffd_entries')
      .delete()
      .in('id', ids);
    if (error) throw error;
    store.set({ entries: store.get('entries').filter(e => !ids.includes(e.id)) });
    saveToLocalStorage();
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// Real-time subscription for live updates
function setupRealtimeSubscription() {
  if (!supabaseClient) return;

  supabaseClient
    .channel('ffd_entries_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ffd_entries' }, (payload) => {
      console.log('Realtime update:', payload.eventType);
      // Refresh all data on any change (simplest approach)
      fetchAllData();
    })
    .subscribe();
}

// Normalize entry from DB format
function normalizeEntry(row) {
  return {
    id: row.id,
    date: row.date,
    business: row.business || '',
    account: row.account || 'default',
    type: row.type || 'Expense',
    category: row.category || 'Uncategorized',
    description: row.description || '',
    amount: parseFloat(row.amount) || 0,
    is_duplicate: row.is_duplicate || false,
    created_at: row.created_at
  };
}

// Local storage fallback
function saveToLocalStorage() {
  try {
    localStorage.setItem('ffd_entries', JSON.stringify(store.get('entries')));
    localStorage.setItem('ffd_channels', JSON.stringify(store.get('channels')));
  } catch (e) {
    console.warn('Local storage save failed:', e);
  }
}

async function loadFromLocalStorage() {
  try {
    const entries = JSON.parse(localStorage.getItem('ffd_entries') || '[]');
    const channels = JSON.parse(localStorage.getItem('ffd_channels') || '[]');
    store.set({ entries, channels, loading: false });
  } catch (e) {
    store.set({ entries: [], channels: [], loading: false });
  }
}

// Channel CRUD
export async function insertChannel(channel) {
  if (!supabaseClient) {
    const channels = store.get('channels');
    const maxId = channels.reduce((max, c) => Math.max(max, parseInt(c.id) || 0), 0);
    const newChannel = { ...channel, id: maxId + 1 };
    store.set({ channels: [...channels, newChannel] });
    saveToLocalStorage();
    return { data: newChannel, error: null };
  }

  try {
    const { data: maxRow } = await supabaseClient
      .from('ffd_channels')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    const nextId = (maxRow?.[0]?.id || 0) + 1;

    const { data, error } = await supabaseClient
      .from('ffd_channels')
      .insert({ ...channel, id: nextId })
      .select()
      .single();
    if (error) throw error;
    store.set({ channels: [...store.get('channels'), data] });
    saveToLocalStorage();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateChannel(id, updates) {
  if (!supabaseClient) {
    const channels = store.get('channels').map(c =>
      c.id == id ? { ...c, ...updates } : c
    );
    store.set({ channels });
    saveToLocalStorage();
    return { error: null };
  }

  try {
    const { error } = await supabaseClient
      .from('ffd_channels')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    const channels = store.get('channels').map(c =>
      c.id == id ? { ...c, ...updates } : c
    );
    store.set({ channels });
    saveToLocalStorage();
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

export async function deleteChannel(id) {
  if (!supabaseClient) {
    store.set({ channels: store.get('channels').filter(c => c.id != id) });
    saveToLocalStorage();
    return { error: null };
  }

  try {
    const { error } = await supabaseClient
      .from('ffd_channels')
      .delete()
      .eq('id', id);
    if (error) throw error;
    store.set({ channels: store.get('channels').filter(c => c.id != id) });
    saveToLocalStorage();
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// Re-fetch everything (manual refresh)
export async function refreshData() {
  if (supabaseClient) {
    await fetchAllData();
  } else {
    await loadFromLocalStorage();
  }
}

export function isConnected() {
  return !!supabaseClient;
}
