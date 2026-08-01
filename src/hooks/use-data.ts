"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as accounts from "@/actions/accounts";
import * as expenses from "@/actions/expenses";
import * as debts from "@/actions/debts";
import * as bills from "@/actions/bills";
import * as time from "@/actions/time";
import * as settings from "@/actions/settings";
import * as cutoffs from "@/actions/cutoffs";
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
} from "@/schemas";

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
export const useAccounts = () =>
  useQuery({ queryKey: keys.accounts, queryFn: accounts.listAccounts });
export function useCreateAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => accounts.createAccount(input),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}
export function useUpdateAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<AccountInput> }) =>
      accounts.updateAccount(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}
export function useDeleteAccount() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accounts.deleteAccount(id),
    onSuccess: () => invalidate(c, keys.accounts),
  });
}

/* ---------- expenses ---------- */
export const useExpenses = () =>
  useQuery({ queryKey: keys.expenses, queryFn: expenses.listExpenses });
export function useCreateExpense() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => expenses.createExpense(input),
    onSuccess: () => invalidate(c, keys.expenses, keys.accounts),
  });
}
export function useDeleteExpense() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (e: Expense) => expenses.deleteExpense(e),
    onSuccess: () => invalidate(c, keys.expenses, keys.accounts),
  });
}

/* ---------- debts ---------- */
export const useDebts = () => useQuery({ queryKey: keys.debts, queryFn: debts.listDebts });
export function useCreateDebt() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: DebtInput) => debts.createDebt(input),
    onSuccess: () => invalidate(c, keys.debts),
  });
}
export function useSettleDebt() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { debt: Debt; fromAccountId: string | null }) =>
      debts.settleDebt(v.debt, v.fromAccountId),
    onSuccess: () => invalidate(c, keys.debts, keys.accounts),
  });
}

/* ---------- bills ---------- */
export const useBills = () => useQuery({ queryKey: keys.bills, queryFn: bills.listBills });
export function useCreateBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: BillInput) => bills.createBill(input),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function useUpdateBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<BillInput> }) => bills.updateBill(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function useDeleteBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bills.deleteBill(id),
    onSuccess: () => invalidate(c, keys.bills),
  });
}
export function usePayBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { bill: Bill; fromAccountId: string | null }) =>
      bills.payBill(v.bill, v.fromAccountId),
    onSuccess: () => invalidate(c, keys.bills, keys.accounts),
  });
}
export function useUnpayBill() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { bill: Bill; toAccountId: string | null }) =>
      bills.unpayBill(v.bill, v.toAccountId),
    onSuccess: () => invalidate(c, keys.bills, keys.accounts),
  });
}

/* ---------- time entries ---------- */
export const useTimeEntries = () =>
  useQuery({ queryKey: keys.time, queryFn: time.listTimeEntries });
export function useCreateTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: TimeEntryInput) => time.createTimeEntry(input),
    onSuccess: () => invalidate(c, keys.time),
  });
}
export function useUpdateTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<TimeEntryInput> }) =>
      time.updateTimeEntry(v.id, v.patch),
    onSuccess: () => invalidate(c, keys.time),
  });
}
export function useDeleteTimeEntry() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => time.deleteTimeEntry(id),
    onSuccess: () => invalidate(c, keys.time),
  });
}

/* ---------- settings ---------- */
export const useSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: settings.getSettings });
export function useUpdateSettings() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => settings.updateSettings(patch),
    onSuccess: () => invalidate(c, keys.settings, keys.accounts),
  });
}

/* ---------- cutoff budgets ---------- */
export const useCutoffBudgets = () =>
  useQuery({ queryKey: keys.cutoffs, queryFn: cutoffs.listCutoffBudgets });
export function useCreateCutoffBudget() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: CutoffBudgetInput) => cutoffs.createCutoffBudget(input),
    onSuccess: () => invalidate(c, keys.cutoffs),
  });
}
export function useCommitCutoff() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cutoffs.commitCutoff(id),
    onSuccess: () => invalidate(c, keys.cutoffs, keys.accounts),
  });
}
export function useDeleteCutoffBudget() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cutoffs.deleteCutoffBudget(id),
    onSuccess: () => invalidate(c, keys.cutoffs),
  });
}
