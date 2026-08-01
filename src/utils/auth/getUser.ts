import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Current authenticated user. Wrapped in React.cache() so repeated calls
 * within one request hit Supabase Auth only once — every Server Action that
 * needs the caller shares the same lookup.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getUserServer() {
  return getUser();
}

/** Resolve the caller or throw — used by write actions before mutating. */
export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
