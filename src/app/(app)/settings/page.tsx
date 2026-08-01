"use client";

import { useState } from "react";
import { ChevronLeft, LogOut, Plus, Trash2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldRow } from "@/components/ui/field";
import { AccountPicker } from "@/components/AccountPicker";
import { Loading, ErrorState } from "@/components/ui/states";
import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { signOut } from "@/actions/auth";
import type { Budget, Deduction } from "@/schemas";
import { cn } from "@/lib/utils";

const BUDGET_FIELDS: { key: keyof Budget; label: string; step?: string }[] = [
  { key: "rentMonthly", label: "Rent (monthly)" },
  { key: "laptopMonthly", label: "Laptop (monthly)" },
  { key: "laundryWeekly", label: "Laundry (weekly)" },
  { key: "loadWeekly", label: "Load (weekly)" },
  { key: "dailyFoodRate", label: "Daily food rate" },
  { key: "defaultDaysPerCutoff", label: "Days per cutoff" },
  { key: "efPercent", label: "EF % (of net pay)", step: "0.01" },
  { key: "wantsPercent", label: "Wants %", step: "0.01" },
  { key: "savingsPercent", label: "Savings %", step: "0.01" },
];

const ROUTES: { key: keyof Budget; label: string }[] = [
  { key: "billsAccountId", label: "Bills → account" },
  { key: "dailySpendAccountId", label: "Daily food → account" },
  { key: "miscAccountId", label: "Laundry + Load → account" },
  { key: "efAccountId", label: "Emergency Fund → account" },
  { key: "extraAccountId", label: "Leftover (wants+savings) → account" },
];

export default function SettingsPage() {
  const { data: settings, isLoading, error } = useSettings();
  const update = useUpdateSettings();
  const [openBudget, setOpenBudget] = useState(true);

  if (isLoading) return <Loading />;
  if (error || !settings) return <div className="p-4"><ErrorState error={error} /></div>;

  const budget = settings.budget;
  const setBudget = (patch: Partial<Budget>) => update.mutate({ budget: { ...budget, ...patch } });

  const percentSum = budget.wantsPercent + budget.savingsPercent;

  const addDeduction = () => {
    const d: Deduction = { id: crypto.randomUUID(), name: "New deduction", amount: 0 };
    update.mutate({ deductions: [...settings.deductions, d] });
  };
  const updateDeduction = (id: string, patch: Partial<Deduction>) =>
    update.mutate({
      deductions: settings.deductions.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  const removeDeduction = (id: string) =>
    update.mutate({ deductions: settings.deductions.filter((d) => d.id !== id) });

  return (
    <>
      <header className="flex items-center justify-between px-4 pb-2 pt-6">
        <div className="flex items-center gap-2">
          <Link href="/money" className="press grid h-10 w-10 place-items-center rounded-full bg-ceramic text-ink">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-[2.8rem] leading-none">Settings</h1>
        </div>
        <Button size="sm" variant="ghost" className="text-[var(--red)]" onClick={signOut}>
          <LogOut size={14} /> Sign out
        </Button>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-6">
        {/* pay setup */}
        <div className="card p-4">
          <p className="mb-3 text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">Pay setup</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Monthly salary">
              <Input
                type="number"
                defaultValue={settings.monthlySalary}
                onBlur={(e) => update.mutate({ monthlySalary: Number(e.target.value) })}
              />
            </FieldRow>
            <FieldRow label="Work days">
              <Input
                type="number"
                defaultValue={settings.workDays}
                onBlur={(e) => update.mutate({ workDays: Number(e.target.value) || 1 })}
              />
            </FieldRow>
          </div>
          <div className="mt-3">
            <Label>Default account</Label>
            <AccountPicker
              value={settings.defaultAccountId}
              onChange={(id) => update.mutate({ defaultAccountId: id })}
            />
          </div>
        </div>

        {/* deductions */}
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">Deductions</p>
            <Button size="sm" variant="secondary" onClick={addDeduction}>
              <Plus size={14} /> Add
            </Button>
          </div>
          {settings.deductions.length === 0 ? (
            <p className="text-[1.3rem] text-ink-soft">No deductions.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.deductions.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <Input
                    defaultValue={d.name}
                    onBlur={(e) => updateDeduction(d.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    defaultValue={d.amount}
                    onBlur={(e) => updateDeduction(d.id, { amount: Number(e.target.value) })}
                    className="w-28"
                  />
                  <button onClick={() => removeDeduction(d.id)} className="press grid h-9 w-9 place-items-center rounded-full text-[var(--red)]">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* budget partition settings */}
        <div className="card p-4">
          <button
            onClick={() => setOpenBudget((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
              Budget partition settings
            </span>
            <ChevronDown size={18} className={cn("transition-transform", openBudget && "rotate-180")} />
          </button>

          {openBudget && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {BUDGET_FIELDS.map((f) => (
                  <FieldRow key={f.key} label={f.label}>
                    <Input
                      type="number"
                      step={f.step}
                      defaultValue={budget[f.key] as number}
                      onBlur={(e) => setBudget({ [f.key]: Number(e.target.value) } as Partial<Budget>)}
                    />
                  </FieldRow>
                ))}
              </div>

              {Math.abs(percentSum - 1) > 0.001 && (
                <p className="rounded-[8px] bg-[#fdf3d6] p-2 text-[1.2rem] text-[#8a6d0b]">
                  Heads up: wants % + savings % = {percentSum.toFixed(2)} (should sum to 1.00).
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-hairline pt-4">
                <p className="text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
                  Bucket routing
                </p>
                {ROUTES.map((r) => (
                  <FieldRow key={r.key} label={r.label}>
                    <AccountPicker
                      value={(budget[r.key] as string | null) ?? null}
                      onChange={(id) => setBudget({ [r.key]: id } as Partial<Budget>)}
                      allowNone
                      noneLabel="— pick account —"
                    />
                  </FieldRow>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
