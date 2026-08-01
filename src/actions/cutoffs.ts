"use server";

/* Cutoff budgets — a payday snapshot. Committing routes the net pay into the
   configured buckets atomically via the commit_cutoff RPC (money-conserving). */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toCutoff, fail } from "@/lib/mappers";
import { cutoffBudgetInput } from "@/schemas";
import type { CutoffBudget, CutoffBudgetInput } from "@/schemas";
import type { Database } from "@/lib/supabase/database.types";

export async function listCutoffBudgets(): Promise<CutoffBudget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cutoff_budgets")
    .select("*")
    .order("date_received", { ascending: false });
  fail(error);
  return (data ?? []).map(toCutoff);
}

export async function createCutoffBudget(input: CutoffBudgetInput): Promise<CutoffBudget> {
  const user = await requireUser();
  const i = cutoffBudgetInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cutoff_budgets")
    .insert({
      user_id: user.id,
      label: i.label,
      date_received: i.dateReceived,
      net_pay: i.netPay,
      days_in_cutoff: i.daysInCutoff,
      linked_period_start: i.linkedPeriodStart,
      linked_period_end: i.linkedPeriodEnd,
    })
    .select("*")
    .single();
  fail(error);
  return toCutoff(data!);
}

export async function commitCutoff(id: string): Promise<CutoffBudget> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("commit_cutoff", { p_cutoff_id: id });
  fail(error);
  return toCutoff(data as Database["public"]["Tables"]["cutoff_budgets"]["Row"]);
}

export async function deleteCutoffBudget(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("cutoff_budgets").delete().eq("id", id);
  fail(error);
}
