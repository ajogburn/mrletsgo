// supabase.js - DO NOT DUPLICATE THIS FILE
const SUPABASE_URL = 'https://zggmjpbgnxqrlootnqvk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G-pRf3TGkHQkOBSic4CxUg_KHVX-HeT';

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ Supabase connected successfully!");
} else {
  console.log("Supabase already initialized");
}