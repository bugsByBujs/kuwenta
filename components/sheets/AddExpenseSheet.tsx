"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Select, FieldRow } from "@/components/ui/field";
import { AccountPicker } from "@/components/AccountPicker";
import { useUi } from "@/stores/ui";
import { useAccounts, useCreateExpense } from "@/hooks/use-data";
import { CATEGORIES, expenseInput } from "@/lib/schemas";
import { todayISO } from "@/lib/date";

export function AddExpenseSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "add-expense";
  const { data: accounts = [] } = useAccounts();
  const create = useCreateExpense();

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Food");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel("");
      setAmount("");
      setCategory("Food");
      setAccountId(accounts[0]?.id ?? null);
      setDate(todayISO());
      setErr(null);
    }
  }, [open, accounts]);

  async function submit() {
    setErr(null);
    const parsed = expenseInput.safeParse({
      label,
      category,
      amount: Number(amount),
      date,
      accountId,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0].message);
      return;
    }
    await create.mutateAsync(parsed.data);
    closeSheet();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title="Add expense"
      footer={
        <Button size="block" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Add expense"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <FieldRow label="What for">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Coffee" />
        </FieldRow>
        <FieldRow label="Amount">
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </FieldRow>
        <FieldRow label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow label="From account">
          <AccountPicker value={accountId} onChange={setAccountId} allowNone noneLabel="— no account —" />
        </FieldRow>
        <FieldRow label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldRow>
        {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
      </div>
    </Sheet>
  );
}
