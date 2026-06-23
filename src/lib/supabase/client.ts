/**
 * Supabase browser client (anon key) for client-side auth/session. Safe to use
 * in client components. Reads only what RLS permits for the signed-in user.
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase browser env (URL + ANON_KEY) is not set");
  return createClient(url, key);
}
