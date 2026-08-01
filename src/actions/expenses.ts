"use server";

/* Expenses (income = category "Income"). Money moves re-read the authoritative
   row server-side rather than trusting client-sent amounts. */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toExpense, fail } from "@/lib/mappers";
import { adjustBalance } from "@/lib/balance";
import { expenseInput } from "@/schemas";
import type { Expense, ExpenseInput } from "@/schemas";

export async function listExpenses(): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map(toExpense);
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const user = await requireUser();
  const i = expenseInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      label: i.label,
      category: i.category,
      amount: i.amount,
      date: i.date,
      account_id: i.accountId,
    })
    .select("*")
    .single();
  fail(error);
  if (i.accountId) {
    const delta = i.category === "Income" ? i.amount : -i.amount;
    await adjustBalance(supabase, i.accountId, delta);
  }
  return toExpense(data!);
}

export async function deleteExpense(e: Expense): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  // re-read authoritative row; never trust client amount/category
  const { data, error } = await supabase.from("expenses").select("*").eq("id", e.id).single();
  fail(error);
  const exp = toExpense(data!);
  const { error: delErr } = await supabase.from("expenses").delete().eq("id", exp.id);
  fail(delErr);
  if (exp.accountId) {
    const delta = exp.category === "Income" ? -exp.amount : exp.amount; // reverse
    await adjustBalance(supabase, exp.accountId, delta);
  }
}
