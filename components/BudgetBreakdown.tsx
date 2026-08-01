"use client";

import { budgetSplit } from "@/lib/money";
import { peso } from "@/lib/money";
import type { Account, Settings } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";

function acctName(accounts: Account[], id: string | null): string {
  return accounts.find((a) => a.id === id)?.name ?? "— unset —";
}

export function BudgetBreakdown({
  netPay,
  days,
  budget,
  accounts,
}: {
  netPay: number;
  days: number;
  budget: Settings["budget"];
  accounts: Account[];
}) {
  const s = budgetSplit(netPay, days, budget);
  const rows = [
    { label: "Bills (rent + laptop)", amount: s.bills, acct: budget.billsAccountId, tone: "amber" as const },
    { label: "Daily food", amount: s.dailyFood, acct: budget.dailySpendAccountId, tone: "green" as const },
    { label: "Laundry + Load", amount: s.miscLaundryLoad, acct: budget.miscAccountId, tone: "neutral" as const },
    { label: "Emergency Fund", amount: s.emergencyFund, acct: budget.efAccountId, tone: "gold" as const },
    { label: "Remaining (wants + savings)", amount: s.remaining, acct: budget.extraAccountId, tone: "house" as const },
  ];
  const total = netPay;

  return (
    <div className="flex flex-col gap-3">
      {/* stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-[var(--radius-pill)] bg-ceramic">
        {rows.map((r, i) => {
          const pct = total > 0 ? (Math.max(r.amount, 0) / total) * 100 : 0;
          const colors = ["#cba258", "#00754a", "#2b5148", "#1e3932", "#006241"];
          return <div key={i} style={{ width: `${pct}%`, background: colors[i] }} />;
        })}
      </div>

      <div className="flex flex-col divide-y divide-hairline">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <div className="text-[1.5rem] text-ink">{r.label}</div>
              <div className="mt-0.5 text-[1.2rem] text-ink-soft">→ {acctName(accounts, r.acct)}</div>
            </div>
            <div
              className="tabular shrink-0 text-[1.6rem] font-semibold"
              style={{ color: r.amount < 0 ? "var(--red)" : "var(--text-black)" }}
            >
              {peso(r.amount)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[1.5rem] font-semibold">Net pay</span>
          {s.status === "over" ? <Badge tone="red">Over budget</Badge> : <Badge tone="green">OK</Badge>}
        </div>
        <span className="tabular text-[1.9rem] font-semibold text-brand">{peso(netPay)}</span>
      </div>
    </div>
  );
}
