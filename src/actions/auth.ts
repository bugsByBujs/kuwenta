"use server";

/* ============================================================
   Authentication — business layer. Login/registration/sign-out run
   on the server against the SSR Supabase client, so the session is
   written to httpOnly cookies by the server; the browser never
   handles tokens. Email/password actions return { error } for inline
   UI feedback; sign-out redirects.
   ============================================================ */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/utils/auth/getUser";
import { toAccount } from "@/lib/mappers";
import { buildInitialBudget, defaultAccountFor } from "@/lib/setup";
import { signInSchema, signUpSchema, setupSchema } from "@/schemas";
import type { SignInInput, SignUpInput, SetupInput } from "@/schemas";

type Result = { error: string | null };

export async function signIn(input: SignInInput): Promise<Result> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  return { error: error?.message ?? null };
}

export async function signUp(input: SignUpInput): Promise<Result> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, password, fullName, mobile } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, mobile } },
  });
  if (error) return { error: error.message };

  // auto-confirm trigger lets us establish a session immediately so the
  // setup step (which needs RLS auth) can run.
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  return { error: signInErr?.message ?? null };
}

/** Minimal current-user info for the UI (e.g. the home greeting). */
export async function currentUser(): Promise<{ name: string | null; email: string | null }> {
  const user = await getUser();
  if (!user) return { name: null, email: null };
  const name =
    (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null;
  return { name: name ?? null, email: user.email ?? null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Returns the provider URL for the client to navigate to. */
export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/home`,
      skipBrowserRedirect: true,
    },
  });
  if (error) return { error: error.message };
  return { url: data.url };
}

/** Post-signup wizard: create the chosen accounts, then seed pay + budget. */
export async function completeSetup(input: SetupInput): Promise<Result> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid setup" };
  const { salary, pay, banks } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: accountRows, error: accErr } = await supabase
    .from("accounts")
    .insert(banks.map((b) => ({ user_id: user.id, name: b.name, type: b.type, balance: b.balance })))
    .select("*");
  if (accErr) return { error: accErr.message };

  const created = (accountRows ?? []).map(toAccount);
  const { error: setErr } = await supabase.from("settings").upsert(
    {
      user_id: user.id,
      monthly_salary: salary,
      work_days: pay.workDays,
      default_account_id: defaultAccountFor(created),
      budget: buildInitialBudget(created),
      pay,
    },
    { onConflict: "user_id" }
  );
  if (setErr) return { error: setErr.message };

  return { error: null };
}
