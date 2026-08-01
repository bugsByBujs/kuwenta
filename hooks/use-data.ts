"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as q from "@/lib/queries";
import type {
  AccountInput,
  BillInput,
  CutoffBudgetInput,
  DebtInput,
  ExpenseInput,
  Settings,
  TimeEntryInput,
  Bill,
  Debt,
  Expense,
} from "@/lib/schemas";

export const keys = {
  accounts: ["accounts"] as const,
  expenses: ["expenses"] as const,
  debts: ["debts"] as const,
  bills: ["bills"] as const,
  time: ["time_entries"] as const,
  settings: ["settings"] as const,
  cutoffs: ["cutoff_budgets"] as const,
};

const invalidate = (c: QueryClient, ...ks: readonly (readonly string[])[]) =>
  ks.forEach((k) => c.invalidateQueries({ queryKey: k }));

/* ---------- accounts ---------- */
export const useAccounts = () => useQuery({ queryKey: keys.accounts, queryFn: q.listAccounts });
export function useCreateAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => q.createAccount(input),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}
export function useUpdateAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<AccountInput> }) => q.updateAccount(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}
export function useDeleteAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => q.deleteAccount(id),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}

/* ---------- expenses ---------- */
export const useExpenses = () => useQuery({ queryKey: keys.expenses, queryFn: q.listExpenses });
export function useCreateExpense() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => q.createExpense(input),
    onSuccess: () => invalidate(c, keys.expenses, keys.accounts),
  });
}
export function useDeleteExpense() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (e: Expense) => q.deleteExpense(e),
    onSuccess: () => invalidate(c, keys.expenses, keys.accounts),
  });
}

/* ---------- debts ---------- */
export const useDebts = () => useQuery({ queryKey: keys.debts, queryFn: q.listDebts });
export function useCreateDebt() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: DebtInput) => q.createDebt(input),
    onSuccess: () => invalidate(c, keys.debts),
  });
}
export function useSettleDebt() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { debt: Debt; fromAccountId: string | null }) =>
      q.settleDebt(v.debt, v.fromAccountId),
    onSuccess: () => invalidate(c, keys.debts, keys.accounts),
  });
}

/* ---------- bills ---------- */
export const useBills = () => useQuery({ queryKey: keys.bills, queryFn: q.listBills });
export function useCreateBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: BillInput) => q.createBill(input),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function useUpdateBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<BillInput> }) => q.updateBill(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function useDeleteBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => q.deleteBill(id),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function usePayBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { bill: Bill; fromAccountId: string | null }) =>
      q.payBill(v.bill, v.fromAccountId),
    onSuccess: () => invalidate(c, keys.bills, keys.accounts),
  });
}
export function useUnpayBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { bill: Bill; toAccountId: string | null }) =>
      q.unpayBill(v.bill, v.toAccountId),
    onSuccess: () => invalidate(c, keys.bills, keys.accounts),
  });
}

/* ---------- time entries ---------- */
export const useTimeEntries = () => useQuery({ queryKey: keys.time, queryFn: q.listTimeEntries });
export function useCreateTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: TimeEntryInput) => q.createTimeEntry(input),
    onSuccess: () => invalidate(c, keys.time),
  });
}
export function useUpdateTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<TimeEntryInput> }) =>
      q.updateTimeEntry(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.time),
  });
}
export function useDeleteTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => q.deleteTimeEntry(id),
    onSuccess: () => invalidate(c, keys.time),
  });
}

/* ---------- settings ---------- */
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: q.getSettings });
export function useUpdateSettings() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => q.updateSettings(patch),
    onSuccess: () => invalidate(c, keys.settings, keys.accounts),
  });
}

/* ---------- cutoff budgets ---------- */
export const useCutoffBudgets = () =>
  useQuery({ queryKey: keys.cutoffs, queryFn: q.listCutoffBudgets });
export function useCreateCutoffBudget() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: CutoffBudgetInput) => q.createCutoffBudget(input),
    onSuccess: () => invalidate(c, keys.cutoffs),
  });
}
export function useCommitCutoff() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => q.commitCutoff(id),
    onSuccess: () => invalidate(c, keys.cutoffs, keys.accounts),
  });
}
export function useDeleteCutoffBudget() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => q.deleteCutoffBudget(id),
    onSuccess: () => invalidate(c, keys.cutoffs),
  });
}
