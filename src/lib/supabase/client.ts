import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Reads the public URL and publishable key
// from environment variables — see .env.local.example for setup.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
