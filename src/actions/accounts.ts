"use server";

/* Accounts — business layer. Reads are RLS-scoped; writes authenticate the
   caller, validate input, and mutate through the SSR Supabase client. */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toAccount, fail } from "@/lib/mappers";
import { accountInput } from "@/schemas";
import type { Account, AccountInput } from "@/schemas";

export async function listAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("accounts").select("*").order("created_at");
  fail(error);
  return (data ?? []).map(toAccount);
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const user = await requireUser();
  const i = accountInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({ user_id: user.id, name: i.name, type: i.type, balance: i.balance })
    .select("*")
    .single();
  fail(error);
  return toAccount(data!);
}

export async function createAccounts(inputs: AccountInput[]): Promise<Account[]> {
  const user = await requireUser();
  if (inputs.length === 0) return [];
  const rows = inputs.map((raw) => {
    const i = accountInput.parse(raw);
    return { user_id: user.id, name: i.name, type: i.type, balance: i.balance };
  });
  const supabase = await createClient();
  const { data, error } = await supabase.from("accounts").insert(rows).select("*");
  fail(error);
  return (data ?? []).map(toAccount);
}

export async function updateAccount(id: string, patch: Partial<AccountInput>): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(patch).eq("id", id);
  fail(error);
}

export async function deleteAccount(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  fail(error);
}
