"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, FieldRow, Label } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useUi } from "@/stores/ui";
import { useCreateAccount } from "@/hooks/use-data";
import { accountInput, ACCOUNT_TYPES } from "@/schemas";

export function AddAccountSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "add-account";
  const create = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>("wallet");
  const [balance, setBalance] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setType("wallet");
      setBalance("");
      setErr(null);
    }
  }, [open]);

  async function submit() {
    setErr(null);
    const parsed = accountInput.safeParse({
      name,
      type,
      balance: balance === "" ? 0 : Number(balance),
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
      title="Add account"
      footer={
        <Button size="block" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Add account"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <FieldRow label="Account name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GoTyme" />
        </FieldRow>
        <div>
          <Label>Type</Label>
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: "bank", label: "Bank" },
              { value: "wallet", label: "E-wallet" },
              { value: "cash", label: "Cash" },
            ]}
          />
        </div>
        <FieldRow label="Starting balance">
          <Input
            type="number"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </FieldRow>
        {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
      </div>
    </Sheet>
  );
}
