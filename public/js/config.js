/**
 * Maltibazar BD — Public Supabase Client Configuration
 *
 * SECURITY NOTICE:
 * - Only put your PUBLIC Supabase Project URL and PUBLIC Anon Key here.
 * - NEVER place your Supabase service_role (secret) key anywhere in frontend code.
 * - All order reads, updates, deletions, and admin access are protected by
 *   Supabase Row Level Security (RLS) policies in supabase/schema.sql.
 */
window.MALTIBAZAR_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
};
