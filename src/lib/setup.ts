/* Pure helpers for first-run setup — no I/O, safe to import anywhere. */
import type { Account, Budget } from "@/schemas";

/** Build the default Budget Partition, routing buckets to sensible accounts
   picked from the freshly-created set (banks for bills/EF, cash for daily
   food, wallet for misc). Falls back to the first account for any gap. */
export function buildInitialBudget(created: Account[]): Budget {
  const byType = (t: Account["type"]) => created.filter((a) => a.type === t);
  const banks = byType("bank");
  const wallets = byType("wallet");
  const cash = byType("cash");
  const first = created[0]?.id ?? null;
  return {
    rentMonthly: 3500,
    laptopMonthly: 1661,
    laundryWeekly: 200,
    loadWeekly: 100,
    dailyFoodRate: 300,
    defaultDaysPerCutoff: 13,
    efPercent: 0.15,
    wantsPercent: 0.6,
    savingsPercent: 0.4,
    billsAccountId: banks[0]?.id ?? first,
    dailySpendAccountId: cash[0]?.id ?? first,
    miscAccountId: wallets[0]?.id ?? first,
    efAccountId: banks[1]?.id ?? banks[0]?.id ?? first,
    extraAccountId: banks[0]?.id ?? first,
  };
}

/** The account a new user's pay/routing should default to (wallet first). */
export function defaultAccountFor(created: Account[]): string | null {
  const wallet = created.find((a) => a.type === "wallet");
  return wallet?.id ?? created[0]?.id ?? null;
}
