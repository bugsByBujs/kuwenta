"use client";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetBreakdown } from "@/components/BudgetBreakdown";
import { useUi } from "@/stores/ui";
import { useAccounts, useSettings, useCutoffBudgets, useDeleteCutoffBudget } from "@/hooks/use-data";
import { fmtDateLong } from "@/lib/date";

export function CutoffDetailSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "cutoff-detail";
  const id = sheet.type === "cutoff-detail" ? sheet.id : null;
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const { data: cutoffs = [] } = useCutoffBudgets();
  const del = useDeleteCutoffBudget();

  const cutoff = cutoffs.find((c) => c.id === id);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title={cutoff?.label ?? "Cutoff"}
      footer={
        cutoff && (
          <Button
            variant="ghost"
            size="block"
            className="text-[var(--red)]"
            onClick={async () => {
              await del.mutateAsync(cutoff.id);
              closeSheet();
            }}
          >
            Delete record
          </Button>
        )
      }
    >
      {cutoff && settings && (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[1.4rem] text-ink-soft">{fmtDateLong(cutoff.dateReceived)}</span>
            {cutoff.committed ? <Badge tone="green">Applied</Badge> : <Badge tone="neutral">Preview</Badge>}
          </div>
          <div className="card p-4">
            <BudgetBreakdown
              netPay={cutoff.netPay}
              days={cutoff.daysInCutoff}
              budget={settings.budget}
              accounts={accounts}
            />
          </div>
          <p className="text-[1.2rem] text-ink-soft">
            {cutoff.daysInCutoff} days in this cutoff. Deleting the record does not reverse the
            transfers already applied to your accounts.
          </p>
        </div>
      )}
    </Sheet>
  );
}
