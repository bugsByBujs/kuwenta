/* Shared server-side helpers for money movement. Not Server Actions
   themselves — imported by the business layer (src/actions/*) to keep the
   balance RPC and recurrence math in one place. */
import { round2 } from "@/lib/money";
import { fail } from "@/lib/mappers";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Bill } from "@/schemas";

/** Atomically move an account balance via the adjust_balance RPC. */
export async function adjustBalance(
  supabase: SupabaseServerClient,
  accountId: string,
  delta: number
): Promise<void> {
  const { error } = await supabase.rpc("adjust_balance", {
    p_account_id: accountId,
    p_delta: round2(delta),
  });
  fail(error);
}

/** Roll a recurring bill's due date forward (dir 1) or back (dir -1). */
export function shiftDue(due: string, recurring: Bill["recurring"], dir: 1 | -1): string {
  const d = new Date(due + "T00:00:00");
  if (recurring === "weekly") d.setDate(d.getDate() + 7 * dir);
  else if (recurring === "monthly") d.setMonth(d.getMonth() + dir);
  return d.toISOString().slice(0, 10);
}
