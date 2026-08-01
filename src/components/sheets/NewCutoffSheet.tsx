"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, FieldRow } from "@/components/ui/field";
import { BudgetBreakdown } from "@/components/BudgetBreakdown";
import { useUi } from "@/stores/ui";
import {
  useAccounts,
  useSettings,
  useTimeEntries,
  useCreateCutoffBudget,
  useCommitCutoff,
} from "@/hooks/use-data";
import { cutoffBudgetInput } from "@/schemas";
import { dailyRate, dayPay } from "@/lib/money";
import { todayISO, fmtDate } from "@/lib/date";

export function NewCutoffSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "new-cutoff";
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const { data: entries = [] } = useTimeEntries();
  const create = useCreateCutoffBudget();
  const commit = useCommitCutoff();

  // period earnings prefill from Time & Pay
  const periodNet = useMemo(() => {
    if (!settings) return 0;
    const rate = dailyRate(settings.monthlySalary, settings.workDays);
    const earned = entries
      .filter((e) => e.out)
      .reduce((sum, e) => sum + dayPay(e, rate), 0);
    const deductions = settings.deductions.reduce((s, d) => s + d.amount, 0);
    return Math.max(0, Math.round((earned - deductions) * 100) / 100);
  }, [entries, settings]);

  const [label, setLabel] = useState("");
  const [dateReceived, setDateReceived] = useState(todayISO());
  const [netPay, setNetPay] = useState("0");
  const [days, setDays] = useState("13");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && settings) {
      setDateReceived(todayISO());
      setLabel(`Cutoff ${fmtDate(todayISO())}`);
      setNetPay(String(periodNet || settings.monthlySalary / 2 || 0));
      setDays(String(settings.budget.defaultDaysPerCutoff));
      setErr(null);
    }
  }, [open, settings, periodNet]);

  async function confirm() {
    if (!settings) return;
    setErr(null);
    const parsed = cutoffBudgetInput.safeParse({
      label,
      dateReceived,
      netPay: Number(netPay),
      daysInCutoff: Number(days),
      linkedPeriodStart: null,
      linkedPeriodEnd: null,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0].message);
      return;
    }
    const created = await create.mutateAsync(parsed.data);
    await commit.mutateAsync(created.id); // apply transfers atomically
    closeSheet();
  }

  const busy = create.isPending || commit.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title="New cutoff"
      footer={
        <Button size="block" onClick={confirm} disabled={busy || !settings}>
          {busy ? "Applying…" : "Confirm & apply transfers"}
        </Button>
      }
    >
      {settings && (
        <div className="flex flex-col gap-4 py-2">
          <FieldRow label="Label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Date received">
              <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
            </FieldRow>
            <FieldRow label="Days in cutoff">
              <Input type="number" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </FieldRow>
          </div>
          <FieldRow label="Net pay (from Time & Pay, editable)">
            <Input type="number" inputMode="decimal" value={netPay} onChange={(e) => setNetPay(e.target.value)} />
          </FieldRow>

          <div className="card p-4">
            <p className="mb-3 text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
              Live breakdown
            </p>
            <BudgetBreakdown
              netPay={Number(netPay) || 0}
              days={Number(days) || 0}
              budget={settings.budget}
              accounts={accounts}
            />
          </div>
          <p className="text-[1.2rem] text-ink-soft">
            Confirming moves the full net pay out of your default account and into each bucket&apos;s
            routed account — a transfer, so no money is created or destroyed.
          </p>
          {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
        </div>
      )}
    </Sheet>
  );
}
