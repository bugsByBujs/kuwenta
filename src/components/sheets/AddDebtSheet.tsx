"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, FieldRow } from "@/components/ui/field";
import { useUi } from "@/stores/ui";
import { useCreateDebt } from "@/hooks/use-data";
import { debtInput } from "@/schemas";

export function AddDebtSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "add-debt";
  const create = useCreateDebt();

  const [who, setWho] = useState("");
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWho("");
      setNote("");
      setBalance("");
      setErr(null);
    }
  }, [open]);

  async function submit() {
    setErr(null);
    const parsed = debtInput.safeParse({
      who,
      note: note || null,
      balance: Number(balance),
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
      title="Add debt"
      footer={
        <Button size="block" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Add debt"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <FieldRow label="Who you owe">
          <Input value={who} onChange={(e) => setWho(e.target.value)} placeholder="e.g. Kuya Jun" />
        </FieldRow>
        <FieldRow label="Amount">
          <Input
            type="number"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </FieldRow>
        <FieldRow label="Note (optional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch" />
        </FieldRow>
        {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
      </div>
    </Sheet>
  );
}
