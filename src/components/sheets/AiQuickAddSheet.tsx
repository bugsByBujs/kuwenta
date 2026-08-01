"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Select, FieldRow, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { AccountPicker } from "@/components/AccountPicker";
import { useUi } from "@/stores/ui";
import { useAccounts, useSettings, useCreateExpense } from "@/hooks/use-data";
import { parseEntry, type Draft } from "@/lib/ai/parseEntry";
import { CATEGORIES, expenseInput } from "@/schemas";
import { peso } from "@/lib/money";

const EXAMPLES = ["paid 120 coffee with GoTyme", "grab 85 gcash", "sahod 15000 to BPI Savings"];

export function AiQuickAddSheet() {
  const { sheet, closeSheet } = useUi();
  const open = sheet.type === "ai-quickadd";
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const create = useCreateExpense();

  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setDraft(null);
      setThinking(false);
      setProgress(null);
      setErr(null);
    }
  }, [open]);

  async function parse() {
    if (!text.trim()) return;
    setThinking(true);
    setErr(null);
    setProgress(null);
    const d = await parseEntry(
      text,
      { accounts, defaultAccountId: settings?.defaultAccountId ?? accounts[0]?.id ?? null },
      (m) => setProgress(m)
    );
    setDraft(d);
    setThinking(false);
  }

  async function commit() {
    if (!draft) return;
    setErr(null);
    const parsed = expenseInput.safeParse({
      label: draft.label,
      category: draft.category,
      amount: draft.amount ?? 0,
      date: draft.date,
      accountId: draft.accountId || null,
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
      title="Add with AI"
      footer={
        draft ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="block" onClick={() => setDraft(null)}>
              Edit text
            </Button>
            <Button size="block" onClick={commit} disabled={create.isPending}>
              {create.isPending ? "Saving…" : draft.type === "income" ? "Add income" : "Add expense"}
            </Button>
          </div>
        ) : (
          <Button size="block" onClick={parse} disabled={thinking || !text.trim()}>
            {thinking ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Thinking…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Parse entry
              </>
            )}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {!draft && (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. paid 120 coffee with GoTyme"
              autoFocus
            />
            {progress && (
              <p className="text-[1.2rem] text-ink-soft">Loading model: {progress}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  className="press rounded-[var(--radius-pill)] bg-ceramic px-3 py-1.5 text-[1.2rem] text-ink-soft"
                >
                  {ex}
                </button>
              ))}
            </div>
            <p className="text-[1.2rem] text-ink-soft">
              Uses on-device AI when your browser supports WebGPU, and falls back to a smart
              heuristic otherwise. You always confirm before it&apos;s saved.
            </p>
          </>
        )}

        {draft && (
          <div className="card flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-gold" />
              <span className="text-[1.3rem] font-semibold text-ink-soft">
                Here&apos;s what I understood — tweak anything:
              </span>
            </div>
            <Segmented
              value={draft.type}
              onChange={(t) =>
                setDraft({ ...draft, type: t, category: t === "income" ? "Income" : "Food" })
              }
              options={[
                { value: "expense", label: "Expense (–)" },
                { value: "income", label: "Income (+)" },
              ]}
            />
            <FieldRow label="What for">
              <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </FieldRow>
            <FieldRow label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.amount ?? ""}
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              />
            </FieldRow>
            {draft.type === "expense" && (
              <FieldRow label="Category">
                <Select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value as Draft["category"] })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FieldRow>
            )}
            <FieldRow label={draft.type === "income" ? "To account" : "From account"}>
              <AccountPicker
                value={draft.accountId || null}
                onChange={(id) => setDraft({ ...draft, accountId: id ?? "" })}
              />
            </FieldRow>
            <p className="tabular text-[1.3rem] text-ink-soft">
              {draft.type === "income" ? "+" : "–"}
              {peso(draft.amount ?? 0)}
            </p>
          </div>
        )}
        {err && <p className="text-[1.3rem] text-[var(--red)]">{err}</p>}
      </div>
    </Sheet>
  );
}
