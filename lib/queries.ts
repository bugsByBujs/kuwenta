import { supabaseBrowser } from "@/lib/supabase/client";
import { budgetSchema, payConfigSchema } from "@/lib/schemas";
import type {
  Account,
  AccountInput,
  Bill,
  BillInput,
  CutoffBudget,
  CutoffBudgetInput,
  Debt,
  DebtInput,
  Expense,
  ExpenseInput,
  Settings,
  TimeEntry,
  TimeEntryInput,
} from "@/lib/schemas";
import type { Database } from "@/lib/database.types";
import { round2 } from "@/lib/money";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

const sb = () => supabaseBrowser();

async function uid(): Promise<string> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/* ============ mappers (snake_case row -> camelCase entity) ============ */
const toAccount = (r: Row<"accounts">): Account => ({
  id: r.id,
  name: r.name,
  type: r.type as Account["type"],
  balance: Number(r.balance),
});
const toExpense = (r: Row<"expenses">): Expense => ({
  id: r.id,
  label: r.label,
  category: r.category as Expense["category"],
  amount: Number(r.amount),
  date: r.date,
  accountId: r.account_id,
});
const toDebt = (r: Row<"debts">): Debt => ({
  id: r.id,
  who: r.who,
  note: r.note,
  balance: Number(r.balance),
});
const toBill = (r: Row<"bills">): Bill => ({
  id: r.id,
  label: r.label,
  sub: r.sub,
  amount: Number(r.amount),
  due: r.due,
  paid: r.paid,
  recurring: r.recurring as Bill["recurring"],
});
const toTimeEntry = (r: Row<"time_entries">): TimeEntry => ({
  id: r.id,
  date: r.date,
  in: r.time_in,
  out: r.time_out,
  holiday: r.holiday as TimeEntry["holiday"],
});
const toCutoff = (r: Row<"cutoff_budgets">): CutoffBudget => ({
  id: r.id,
  label: r.label,
  dateReceived: r.date_received,
  netPay: Number(r.net_pay),
  daysInCutoff: r.days_in_cutoff,
  linkedPeriodStart: r.linked_period_start,
  linkedPeriodEnd: r.linked_period_end,
  committed: r.committed,
});

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ============ accounts ============ */
export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await sb().from("accounts").select("*").order("created_at");
  fail(error);
  return (data ?? []).map(toAccount);
}
export async function createAccount(input: AccountInput): Promise<Account> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("accounts")
    .insert({ user_id, name: input.name, type: input.type, balance: input.balance })
    .select("*")
    .single();
  fail(error);
  return toAccount(data!);
}
export async function updateAccount(id: string, patch: Partial<AccountInput>): Promise<void> {
  const { error } = await sb().from("accounts").update(patch).eq("id", id);
  fail(error);
}
export async function deleteAccount(id: string): Promise<void> {
  const { error } = await sb().from("accounts").delete().eq("id", id);
  fail(error);
}
export async function adjustBalance(accountId: string, delta: number): Promise<void> {
  const { error } = await sb().rpc("adjust_balance", {
    p_account_id: accountId,
    p_delta: round2(delta),
  });
  fail(error);
}

/* ============ expenses (income = category "Income", credits) ============ */
export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await sb()
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map(toExpense);
}
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("expenses")
    .insert({
      user_id,
      label: input.label,
      category: input.category,
      amount: input.amount,
      date: input.date,
      account_id: input.accountId,
    })
    .select("*")
    .single();
  fail(error);
  if (input.accountId) {
    const delta = input.category === "Income" ? input.amount : -input.amount;
    await adjustBalance(input.accountId, delta);
  }
  return toExpense(data!);
}
export async function deleteExpense(e: Expense): Promise<void> {
  const { error } = await sb().from("expenses").delete().eq("id", e.id);
  fail(error);
  if (e.accountId) {
    const delta = e.category === "Income" ? -e.amount : e.amount; // reverse
    await adjustBalance(e.accountId, delta);
  }
}

/* ============ debts ============ */
export async function listDebts(): Promise<Debt[]> {
  const { data, error } = await sb().from("debts").select("*").order("created_at");
  fail(error);
  return (data ?? []).map(toDebt);
}
export async function createDebt(input: DebtInput): Promise<Debt> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("debts")
    .insert({ user_id, who: input.who, note: input.note, balance: input.balance })
    .select("*")
    .single();
  fail(error);
  return toDebt(data!);
}
export async function settleDebt(debt: Debt, fromAccountId: string | null): Promise<void> {
  if (fromAccountId) await adjustBalance(fromAccountId, -debt.balance);
  const { error } = await sb().from("debts").delete().eq("id", debt.id);
  fail(error);
}

/* ============ bills ============ */
export async function listBills(): Promise<Bill[]> {
  const { data, error } = await sb().from("bills").select("*").order("due");
  fail(error);
  return (data ?? []).map(toBill);
}
export async function createBill(input: BillInput): Promise<Bill> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("bills")
    .insert({
      user_id,
      label: input.label,
      sub: input.sub,
      amount: input.amount,
      due: input.due,
      paid: input.paid,
      recurring: input.recurring,
    })
    .select("*")
    .single();
  fail(error);
  return toBill(data!);
}
export async function updateBill(id: string, patch: Partial<BillInput>): Promise<void> {
  const { error } = await sb().from("bills").update(patch).eq("id", id);
  fail(error);
}
export async function deleteBill(id: string): Promise<void> {
  const { error } = await sb().from("bills").delete().eq("id", id);
  fail(error);
}
function shiftDue(due: string, recurring: Bill["recurring"], dir: 1 | -1): string {
  const d = new Date(due + "T00:00:00");
  if (recurring === "weekly") d.setDate(d.getDate() + 7 * dir);
  else if (recurring === "monthly") d.setMonth(d.getMonth() + dir);
  return d.toISOString().slice(0, 10);
}
export async function payBill(bill: Bill, fromAccountId: string | null): Promise<void> {
  if (fromAccountId) await adjustBalance(fromAccountId, -bill.amount);
  if (bill.recurring === "none") {
    await updateBill(bill.id, { paid: true });
  } else {
    // recurring: roll forward, stays unpaid for the next cycle
    await sb()
      .from("bills")
      .update({ due: shiftDue(bill.due, bill.recurring, 1), paid: false })
      .eq("id", bill.id);
  }
}
export async function unpayBill(bill: Bill, toAccountId: string | null): Promise<void> {
  if (toAccountId) await adjustBalance(toAccountId, bill.amount); // refund
  if (bill.recurring === "none") {
    await updateBill(bill.id, { paid: false });
  } else {
    await sb()
      .from("bills")
      .update({ due: shiftDue(bill.due, bill.recurring, -1), paid: false })
      .eq("id", bill.id);
  }
}

/* ============ time entries ============ */
export async function listTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await sb()
    .from("time_entries")
    .select("*")
    .order("date", { ascending: false });
  fail(error);
  return (data ?? []).map(toTimeEntry);
}
export async function createTimeEntry(input: TimeEntryInput): Promise<TimeEntry> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("time_entries")
    .insert({
      user_id,
      date: input.date,
      time_in: input.in,
      time_out: input.out,
      holiday: input.holiday,
    })
    .select("*")
    .single();
  fail(error);
  return toTimeEntry(data!);
}
export async function updateTimeEntry(id: string, patch: Partial<TimeEntryInput>): Promise<void> {
  const dbPatch: Database["public"]["Tables"]["time_entries"]["Update"] = {};
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.in !== undefined) dbPatch.time_in = patch.in;
  if (patch.out !== undefined) dbPatch.time_out = patch.out;
  if (patch.holiday !== undefined) dbPatch.holiday = patch.holiday;
  const { error } = await sb().from("time_entries").update(dbPatch).eq("id", id);
  fail(error);
}
export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await sb().from("time_entries").delete().eq("id", id);
  fail(error);
}

/* ============ settings ============ */
export async function getSettings(): Promise<Settings> {
  const { data, error } = await sb().from("settings").select("*").single();
  fail(error);
  return {
    monthlySalary: Number(data!.monthly_salary),
    workDays: data!.work_days,
    defaultAccountId: data!.default_account_id,
    deductions: Array.isArray(data!.deductions) ? (data!.deductions as Settings["deductions"]) : [],
    budget: budgetSchema.parse(data!.budget ?? {}),
    pay: payConfigSchema.parse(data!.pay ?? {}),
  };
}
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const user_id = await uid();
  const dbPatch: Database["public"]["Tables"]["settings"]["Update"] = {};
  if (patch.monthlySalary !== undefined) dbPatch.monthly_salary = patch.monthlySalary;
  if (patch.workDays !== undefined) dbPatch.work_days = patch.workDays;
  if (patch.defaultAccountId !== undefined) dbPatch.default_account_id = patch.defaultAccountId;
  if (patch.deductions !== undefined) dbPatch.deductions = patch.deductions;
  if (patch.budget !== undefined) dbPatch.budget = patch.budget;
  if (patch.pay !== undefined) dbPatch.pay = patch.pay;
  const { error } = await sb()
    .from("settings")
    .upsert({ user_id, ...dbPatch }, { onConflict: "user_id" });
  fail(error);
}

/** Bulk-create accounts (used by the setup wizard's bank picker). */
export async function createAccounts(inputs: AccountInput[]): Promise<Account[]> {
  const user_id = await uid();
  if (inputs.length === 0) return [];
  const { data, error } = await sb()
    .from("accounts")
    .insert(inputs.map((i) => ({ user_id, name: i.name, type: i.type, balance: i.balance })))
    .select("*");
  fail(error);
  return (data ?? []).map(toAccount);
}

/* ============ cutoff budgets ============ */
export async function listCutoffBudgets(): Promise<CutoffBudget[]> {
  const { data, error } = await sb()
    .from("cutoff_budgets")
    .select("*")
    .order("date_received", { ascending: false });
  fail(error);
  return (data ?? []).map(toCutoff);
}
export async function createCutoffBudget(input: CutoffBudgetInput): Promise<CutoffBudget> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("cutoff_budgets")
    .insert({
      user_id,
      label: input.label,
      date_received: input.dateReceived,
      net_pay: input.netPay,
      days_in_cutoff: input.daysInCutoff,
      linked_period_start: input.linkedPeriodStart,
      linked_period_end: input.linkedPeriodEnd,
    })
    .select("*")
    .single();
  fail(error);
  return toCutoff(data!);
}
export async function commitCutoff(id: string): Promise<CutoffBudget> {
  const { data, error } = await sb().rpc("commit_cutoff", { p_cutoff_id: id });
  fail(error);
  return toCutoff(data as Row<"cutoff_budgets">);
}
export async function deleteCutoffBudget(id: string): Promise<void> {
  const { error } = await sb().from("cutoff_budgets").delete().eq("id", id);
  fail(error);
}
