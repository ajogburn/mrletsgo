// supabase.js
const SUPABASE_URL = 'https://zggmjpbgnxqrlootnqvk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G-pRf3TGkHQkOBSic4CxUg_KHVX-HeT';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;

console.log("✅ Supabase connected successfully!");