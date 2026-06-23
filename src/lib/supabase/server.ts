/**
 * Supabase admin client (service-role) for server-side DB/storage tasks that
 * bypass RLS — e.g. provisioning a tenant, storing a signed agreement. NEVER
 * import this into a client component; the service-role key must stay server-side.
 *
 * Phase 1 will add the per-request, RLS-respecting auth client (@supabase/ssr)
 * for reading tenant-scoped data.
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env (URL + SERVICE_ROLE_KEY) is not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
