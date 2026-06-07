// supabase.js - Shared Supabase client (DO NOT DUPLICATE)
const SUPABASE_URL = 'https://zggmjpbgnxqrlootnqvk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G-pRf3TGkHQkOBSic4CxUg_KHVX-HeT';

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  console.log('✅ Supabase client ready');
}

// Convenience helpers
window.getSupabase = () => window.supabaseClient;

window.getCurrentUser = async () => {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  return user;
};

window.signOut = async () => {
  await window.supabaseClient.auth.signOut();
};