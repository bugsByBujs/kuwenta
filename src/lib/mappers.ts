/* Shared DB row → domain-entity mappers (snake_case → camelCase) and the
   Row type helper. Pure functions with no client/server coupling, so both the
   server read layer (lib/data/reads.ts) and the server write layer
   (lib/data/actions.ts) can import them. */
import type { Database } from "@/lib/supabase/database.types";
import type { Account, Bill, CutoffBudget, Debt, Expense, TimeEntry } from "@/schemas";

export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export const toAccount = (r: Row<"accounts">): Account => ({
  id: r.id,
  name: r.name,
  type: r.type as Account["type"],
  balance: Number(r.balance),
});

export const toExpense = (r: Row<"expenses">): Expense => ({
  id: r.id,
  label: r.label,
  category: r.category as Expense["category"],
  amount: Number(r.amount),
  date: r.date,
  accountId: r.account_id,
});

export const toDebt = (r: Row<"debts">): Debt => ({
  id: r.id,
  who: r.who,
  note: r.note,
  balance: Number(r.balance),
});

export const toBill = (r: Row<"bills">): Bill => ({
  id: r.id,
  label: r.label,
  sub: r.sub,
  amount: Number(r.amount),
  due: r.due,
  paid: r.paid,
  recurring: r.recurring as Bill["recurring"],
});

export const toTimeEntry = (r: Row<"time_entries">): TimeEntry => ({
  id: r.id,
  date: r.date,
  in: r.time_in,
  out: r.time_out,
  holiday: r.holiday as TimeEntry["holiday"],
});

export const toCutoff = (r: Row<"cutoff_budgets">): CutoffBudget => ({
  id: r.id,
  label: r.label,
  dateReceived: r.date_received,
  netPay: Number(r.net_pay),
  daysInCutoff: r.days_in_cutoff,
  linkedPeriodStart: r.linked_period_start,
  linkedPeriodEnd: r.linked_period_end,
  committed: r.committed,
});

/** Throw a mutation/read error so callers (or TanStack) surface it. */
export function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
