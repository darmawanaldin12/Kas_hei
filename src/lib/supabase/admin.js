import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// PERINGATAN: client ini pakai service_role key yang punya akses penuh
// (bypass RLS). HANYA boleh dipakai di server (route handler / server
// action). JANGAN PERNAH diimpor ke client component atau dikirim ke
// browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
