import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Keep the error friendly so devs know what to do.
  // eslint-disable-next-line no-console
  console.error(
    "[Greenfield] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env. " +
      "Copy .env.example to .env and fill them in.",
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: { persistSession: true, autoRefreshToken: true },
});
