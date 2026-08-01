"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let browserClient: ReturnType<typeof createClient> | undefined;

/** Singleton browser client for use inside hooks/components. */
export function supabaseBrowser() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
