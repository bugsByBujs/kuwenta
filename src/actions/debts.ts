"use server";

/* Debts — create, list, and settle (settling debits the paying account by the
   authoritative balance re-read server-side). */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toDebt, fail } from "@/lib/mappers";
import { adjustBalance } from "@/lib/balance";
import { debtInput } from "@/schemas";
import type { Debt, DebtInput } from "@/schemas";

export async function listDebts(): Promise<Debt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("debts").select("*").order("created_at");
  fail(error);
  return (data ?? []).map(toDebt);
}

export async function createDebt(input: DebtInput): Promise<Debt> {
  const user = await requireUser();
  const i = debtInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .insert({ user_id: user.id, who: i.who, note: i.note, balance: i.balance })
    .select("*")
    .single();
  fail(error);
  return toDebt(data!);
}

export async function settleDebt(debt: Debt, fromAccountId: string | null): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("debts").select("*").eq("id", debt.id).single();
  fail(error);
  const d = toDebt(data!);
  if (fromAccountId) await adjustBalance(supabase, fromAccountId, -d.balance);
  const { error: delErr } = await supabase.from("debts").delete().eq("id", d.id);
  fail(delErr);
}
