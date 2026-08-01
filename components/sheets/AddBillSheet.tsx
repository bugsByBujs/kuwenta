"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, FieldRow, Label } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useUi } from "@/stores/ui";
import { useCreateBill } from "@/hooks/use-data";
import { billInput, RECURRING } from "@/lib/schemas";
import { todayISO } from "@/lib/date";

export function AddBillSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "add-bill";
  const create = useCreateBill();

  const [label, setLabel] = useState("");
  const [sub, setSub] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(todayISO());
  const [recurring, setRecurring] = useState<(typeof RECURRING)[number]>("none");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel("");
      setSub("");
      setAmount("");
      setDue(todayISO());
      setRecurring("none");
      setErr(null);
    }
  }, [open]);

  async function submit() {
    setErr(null);
    const parsed = billInput.safeParse({
      label,
      sub: sub || null,
      amount: Number(amount),
      due,
      recurring,
      paid: false,
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
      title="Add bill"
      footer={
        <Button size="block" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Add bill"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <FieldRow label="Bill name">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Meralco" />
        </FieldRow>
        <FieldRow label="Detail (optional)">
          <Input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="e.g. Electricity" />
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
        <FieldRow label="Due date">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </FieldRow>
        <div>
          <Label>Recurring</Label>
          <Segmented
            value={recurring}
            onChange={setRecurring}
            options={[
              { value: "none", label: "One-time" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </div>
        {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
      </div>
    </Sheet>
  );
}
