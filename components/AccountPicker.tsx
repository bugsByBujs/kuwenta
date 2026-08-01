"use client";

import { Select } from "@/components/ui/field";
import { useAccounts } from "@/hooks/use-data";
import type { Account } from "@/lib/schemas";

export function AccountPicker({
  value,
  onChange,
  allowNone,
  noneLabel = "— none —",
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const { data: accounts = [] } = useAccounts();
  return (
    <Select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {allowNone && <option value="">{noneLabel}</option>}
      {accounts.map((a: Account) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </Select>
  );
}
