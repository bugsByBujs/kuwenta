"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Square, Plus, Pencil, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionTitle, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { TimeWheel } from "@/components/TimeWheel";
import { Loading, ErrorState, Empty } from "@/components/ui/states";
import {
  useTimeEntries,
  useSettings,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useUpdateSettings,
} from "@/hooks/use-data";
import { useUi } from "@/stores/ui";
import { peso, dailyRate, dayPay, hoursBetween } from "@/lib/money";
import { payBreakdown } from "@/lib/ph";
import { todayISO, fmtDate } from "@/lib/date";
import { HOLIDAY, type TimeEntry } from "@/lib/schemas";

function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const holidayLabel: Record<(typeof HOLIDAY)[number], string> = {
  none: "Regular",
  regular: "Reg. Holiday ×2",
  special: "Spec. Holiday ×1.3",
};

export default function TimePage() {
  const entriesQ = useTimeEntries();
  const { data: settings } = useSettings();
  const create = useCreateTimeEntry();
  const update = useUpdateTimeEntry();
  const del = useDeleteTimeEntry();
  const updateSettings = useUpdateSettings();
  const { timeEditMode, toggleTimeEdit } = useUi();

  const entries = entriesQ.data ?? [];
  const openEntry = entries.find((e) => !e.out) ?? null;

  const rate = settings ? dailyRate(settings.monthlySalary, settings.workDays) : 0;
  const completed = entries.filter((e) => e.out);
  const earned = completed.reduce((s, e) => s + dayPay(e, rate), 0);

  // live timer — tick drives a re-render every second
  const [tickN, setTick] = useState(0);
  useEffect(() => {
    if (!openEntry) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [openEntry]);

  const elapsed = useMemo(() => {
    if (!openEntry) return "";
    const [ih, im] = openEntry.in.split(":").map(Number);
    const start = new Date();
    start.setHours(ih, im, 0, 0);
    let ms = Date.now() - start.getTime();
    if (ms < 0) ms += 86_400_000;
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEntry, tickN]);

  async function clockIn() {
    await create.mutateAsync({ date: todayISO(), in: nowHM(), out: null, holiday: "none" });
  }
  async function clockOut() {
    if (openEntry) await update.mutateAsync({ id: openEntry.id, patch: { out: nowHM() } });
  }

  // editor sheet
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<{ date: string; in: string; out: string; holiday: TimeEntry["holiday"] }>({
    date: todayISO(),
    in: "09:00",
    out: "18:00",
    holiday: "none",
  });

  function startEdit(e: TimeEntry) {
    setEditing(e);
    setIsNew(false);
    setForm({ date: e.date, in: e.in, out: e.out ?? "18:00", holiday: e.holiday });
  }
  function startNew() {
    setEditing({ id: "new" } as TimeEntry);
    setIsNew(true);
    setForm({ date: todayISO(), in: "09:00", out: "18:00", holiday: "none" });
  }
  async function saveEditor() {
    if (isNew) {
      await create.mutateAsync({ date: form.date, in: form.in, out: form.out, holiday: form.holiday });
    } else if (editing) {
      await update.mutateAsync({
        id: editing.id,
        patch: { date: form.date, in: form.in, out: form.out, holiday: form.holiday },
      });
    }
    setEditing(null);
  }

  return (
    <>
      <ScreenHeader
        title="Time & Pay"
        subtitle="Clock in, track your pay"
        action={
          <Button size="sm" variant={timeEditMode ? "primary" : "subtle"} onClick={toggleTimeEdit}>
            <Pencil size={14} /> {timeEditMode ? "Done" : "Edit"}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4">
        {/* clock */}
        <div className="rounded-[16px] bg-house p-5 text-white" style={{ boxShadow: "var(--shadow-card)" }}>
          {openEntry ? (
            <>
              <div className="text-[1.3rem] text-on-dark-soft">Clocked in since {openEntry.in}</div>
              <div className="tabular mt-1 text-[3.2rem] font-semibold leading-none">{elapsed}</div>
              <Button className="mt-4" variant="danger" size="block" onClick={clockOut} disabled={update.isPending}>
                <Square size={16} /> Clock out
              </Button>
            </>
          ) : (
            <>
              <div className="text-[1.3rem] text-on-dark-soft">Not clocked in</div>
              <div className="tabular mt-1 text-[3.2rem] font-semibold leading-none">{nowHM()}</div>
              <Button className="mt-4 bg-accent" size="block" onClick={clockIn} disabled={create.isPending}>
                <Play size={16} /> Clock in
              </Button>
            </>
          )}
        </div>

        {/* pay setup */}
        {settings && (
          <div className="card p-4">
            <p className="mb-3 text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft">Pay setup</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monthly salary</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  defaultValue={settings.monthlySalary}
                  onBlur={(e) => updateSettings.mutate({ monthlySalary: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Work days</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  defaultValue={settings.workDays}
                  onBlur={(e) => updateSettings.mutate({ workDays: Number(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-[1.4rem] text-ink-soft">Daily rate</span>
              <span className="tabular text-[1.9rem] font-semibold text-brand">{peso(rate)}</span>
            </div>
          </div>
        )}

        {settings && (() => {
          const bd = payBreakdown(settings.monthlySalary, settings.pay);
          const govRow = (k: string, v: string) => (
            <div className="flex justify-between">
              <span className="text-ink-soft">{k}</span>
              <span className="text-[var(--red)]">-{v}</span>
            </div>
          );
          return (
            <div className="card flex flex-col gap-2 p-4 text-[1.3rem]">
              <div className="mb-0.5 text-[1.4rem] font-semibold text-ink">Government &amp; tax (monthly)</div>
              {govRow("SSS", peso(bd.sss))}
              {govRow("PhilHealth", peso(bd.philhealth))}
              {govRow("Pag-IBIG", peso(bd.pagibig))}
              {govRow("Withholding tax", peso(bd.withholdingTax))}
              <div className="flex justify-between border-t border-hairline pt-2">
                <span className="font-semibold text-ink">Net monthly pay</span>
                <span className="font-bold text-brand">{peso(bd.net)}</span>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <Stat label="Days worked" value={completed.length} tone="ink" />
          </div>
          <div className="card p-4">
            <Stat label="Earned" value={peso(earned)} tone="accent" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SectionTitle>Time log</SectionTitle>
          <Button size="sm" variant="secondary" onClick={startNew}>
            <Plus size={14} /> Add
          </Button>
        </div>

        {entriesQ.isLoading ? (
          <Loading />
        ) : entriesQ.error ? (
          <ErrorState error={entriesQ.error} />
        ) : entries.length === 0 ? (
          <Empty>No time entries yet. Clock in or add one.</Empty>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {entries.map((e) => (
              <div key={e.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="text-[1.5rem] font-semibold text-ink">{fmtDate(e.date)}</div>
                  <div className="flex items-center gap-2 text-[1.2rem] text-ink-soft">
                    <span className="tabular">
                      {e.in} – {e.out ?? "…"}
                    </span>
                    {e.holiday !== "none" && (
                      <Badge tone="gold">{e.holiday === "regular" ? "Reg. ×2" : "Spec. ×1.3"}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-[1.6rem] font-semibold text-brand">
                    {e.out ? peso(dayPay(e, rate)) : `${hoursBetween(e.in, nowHM()).toFixed(1)}h`}
                  </span>
                  {timeEditMode && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(e)}
                        className="press grid h-8 w-8 place-items-center rounded-full bg-ceramic text-ink"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => del.mutate(e.id)}
                        className="press grid h-8 w-8 place-items-center rounded-full text-[var(--red)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* editor */}
      <Sheet
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title={isNew ? "Add time entry" : "Edit time entry"}
        footer={
          <Button size="block" onClick={saveEditor} disabled={create.isPending || update.isPending}>
            Save entry
          </Button>
        }
      >
        {editing && (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Time in</Label>
                <TimeWheel value={form.in} onChange={(v) => setForm({ ...form, in: v })} />
              </div>
              <div>
                <Label>Time out</Label>
                <TimeWheel value={form.out} onChange={(v) => setForm({ ...form, out: v })} />
              </div>
            </div>
            <div>
              <Label>Day type</Label>
              <Segmented
                value={form.holiday}
                onChange={(h) => setForm({ ...form, holiday: h })}
                options={HOLIDAY.map((h) => ({ value: h, label: holidayLabel[h] }))}
              />
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
