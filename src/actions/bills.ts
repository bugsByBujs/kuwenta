"use server";

/* Bills — CRUD plus pay/unpay. Paying debits (unpaying refunds) the chosen
   account by the authoritative bill amount; recurring bills roll their due
   date instead of flipping paid. */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toBill, fail } from "@/lib/mappers";
import { adjustBalance, shiftDue } from "@/lib/balance";
import { billInput } from "@/schemas";
import type { Bill, BillInput } from "@/schemas";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export async function listBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bills").select("*").order("due");
  fail(error);
  return (data ?? []).map(toBill);
}

export async function createBill(input: BillInput): Promise<Bill> {
  const user = await requireUser();
  const i = billInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .insert({
      user_id: user.id,
      label: i.label,
      sub: i.sub,
      amount: i.amount,
      due: i.due,
      paid: i.paid,
      recurring: i.recurring,
    })
    .select("*")
    .single();
  fail(error);
  return toBill(data!);
}

export async function updateBill(id: string, patch: Partial<BillInput>): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("bills").update(patch).eq("id", id);
  fail(error);
}

export async function deleteBill(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  fail(error);
}

async function requireBill(supabase: SupabaseServerClient, id: string): Promise<Bill> {
  const { data, error } = await supabase.from("bills").select("*").eq("id", id).single();
  fail(error);
  return toBill(data!);
}

export async function payBill(bill: Bill, fromAccountId: string | null): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const b = await requireBill(supabase, bill.id); // authoritative amount/recurring/due
  if (fromAccountId) await adjustBalance(supabase, fromAccountId, -b.amount);
  if (b.recurring === "none") {
    const { error } = await supabase.from("bills").update({ paid: true }).eq("id", b.id);
    fail(error);
  } else {
    const { error } = await supabase
      .from("bills")
      .update({ due: shiftDue(b.due, b.recurring, 1), paid: false })
      .eq("id", b.id);
    fail(error);
  }
}

export async function unpayBill(bill: Bill, toAccountId: string | null): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const b = await requireBill(supabase, bill.id);
  if (toAccountId) await adjustBalance(supabase, toAccountId, b.amount); // refund
  if (b.recurring === "none") {
    const { error } = await supabase.from("bills").update({ paid: false }).eq("id", b.id);
    fail(error);
  } else {
    const { error } = await supabase
      .from("bills")
      .update({ due: shiftDue(b.due, b.recurring, -1), paid: false })
      .eq("id", b.id);
    fail(error);
  }
}
