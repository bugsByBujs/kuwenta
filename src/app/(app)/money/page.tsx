"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import {
  useAccounts,
  useSettings,
  useTimeEntries,
  useCutoffBudgets,
  useUpdateSettings,
  useDeleteAccount,
} from "@/hooks/use-data";
import { useUi } from "@/stores/ui";
import { peso, budgetSplit, dailyRate, dayPay } from "@/lib/money";
import { EFSparkline } from "@/components/EFSparkline";
import { fmtDateLong } from "@/lib/date";

const card: React.CSSProperties = { background: "#fff", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)" };
const SEG_COLORS = ["var(--green-starbucks)", "var(--green-uplift)", "var(--green-accent)", "var(--green-house)", "var(--hairline)"];

export default function MoneyPage() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const { data: entries = [] } = useTimeEntries();
  const { data: cutoffs = [] } = useCutoffBudgets();
  const updateSettings = useUpdateSettings();
  const delAccount = useDeleteAccount();
  const { openSheet } = useUi();

  const [tab, setTab] = useState<"current" | "history">("current");

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const byType = (t: string) => accounts.filter((a) => a.type === t).reduce((s, a) => s + a.balance, 0);

  const currentNet = useMemo(() => {
    if (!settings) return 0;
    const rate = dailyRate(settings.monthlySalary, settings.workDays);
    const earned = entries.filter((e) => e.out).reduce((s, e) => s + dayPay(e, rate), 0);
    const ded = settings.deductions.reduce((s, d) => s + d.amount, 0);
    return Math.max(0, Math.round((earned - ded) * 100) / 100);
  }, [entries, settings]);

  const split = settings ? budgetSplit(currentNet, settings.budget.defaultDaysPerCutoff, settings.budget) : null;

  const donut = useMemo(() => {
    if (!split || currentNet <= 0) return "var(--ceramic)";
    const parts = [split.bills, split.miscLaundryLoad, split.dailyFood, split.emergencyFund, Math.max(split.remaining, 0)];
    let acc = 0;
    const stops = parts.map((p, i) => {
      const from = (acc / currentNet) * 100;
      acc += p;
      const to = (acc / currentNet) * 100;
      return `${SEG_COLORS[i]} ${from}% ${to}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [split, currentNet]);

  async function logOut() {
    await signOut(); // server action clears the session cookie + redirects
  }

  const pct = (n: number) => (currentNet > 0 ? Math.round((n / currentNet) * 100) : 0) + "%";

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--green-starbucks)", marginBottom: 4 }}>Money</div>
      <div className="tabular" style={{ fontSize: "2.6rem", fontWeight: 700, color: "var(--text-black)", marginBottom: 4 }}>{peso(total)}</div>
      <div style={{ fontSize: "1.3rem", color: "var(--text-black-soft)", marginBottom: 20 }}>
        Banks {peso(byType("bank"))} · E-wallets {peso(byType("wallet"))} · Cash {peso(byType("cash"))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {accounts.map((a) => (
          <div key={a.id} style={{ ...card, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)" }}>{a.name}</div>
                <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", textTransform: "capitalize" }}>{a.type}</div>
              </div>
              <div className="tabular" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-black)" }}>{peso(a.balance)}</div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "1.2rem" }}>
              {settings?.defaultAccountId === a.id ? (
                <span style={{ fontWeight: 700, color: "var(--green-starbucks)" }}>★ Default</span>
              ) : (
                <a href="#" onClick={(e) => { e.preventDefault(); updateSettings.mutate({ defaultAccountId: a.id }); }} style={{ textDecoration: "underline" }}>
                  Set default
                </a>
              )}
              <a href="#" onClick={(e) => { e.preventDefault(); router.push("/settings"); }} style={{ textDecoration: "underline", color: "var(--text-black-soft)" }}>Edit</a>
              <a href="#" onClick={(e) => { e.preventDefault(); if (confirm(`Remove ${a.name}?`)) delAccount.mutate(a.id); }} style={{ textDecoration: "underline", color: "var(--red)" }}>Remove</a>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => openSheet({ type: "add-account" })} style={{ ...outlinedPill, width: "100%", marginBottom: 32, padding: "14px 24px", fontSize: "1.6rem" }}>
        + Add bank or e-wallet
      </button>

      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "2rem", color: "var(--green-starbucks)", marginBottom: 4 }}>
        Every payday, sorted.
      </div>
      <div style={{ fontSize: "1.3rem", color: "var(--text-black-soft)", marginBottom: 16 }}>
        Budget Partition splits each cutoff into bills, food, emergency fund, and free spend — automatically.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("current")} style={tabStyle(tab === "current")}>This cutoff</button>
        <button onClick={() => setTab("history")} style={tabStyle(tab === "history")}>History</button>
      </div>

      {tab === "current" && split && (
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: donut, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "1rem", color: "var(--text-black-soft)" }}>Net pay</div>
                <div className="tabular" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-black)" }}>{peso(currentNet)}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, fontSize: "1.2rem" }}>
              <Legend color={SEG_COLORS[0]} label="Bills" value={pct(split.bills)} />
              <Legend color={SEG_COLORS[1]} label="Misc" value={pct(split.miscLaundryLoad)} />
              <Legend color={SEG_COLORS[2]} label="Food" value={pct(split.dailyFood)} />
              <Legend color={SEG_COLORS[3]} label="EF" value={pct(split.emergencyFund)} />
              <Legend color={SEG_COLORS[4]} label="Free" value={pct(Math.max(split.remaining, 0))} />
            </div>
          </div>
          <button onClick={() => openSheet({ type: "new-cutoff" })} style={{ ...primaryPill, width: "100%", marginTop: 16, padding: "14px 24px", fontSize: "1.6rem" }}>
            + New cutoff
          </button>
        </div>
      )}

      {tab === "history" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {cutoffs.length === 0 && <div style={{ ...card, padding: 16, fontSize: "1.3rem", color: "var(--text-black-soft)" }}>No cutoffs yet.</div>}
            {cutoffs.map((c) => {
              const s = settings ? budgetSplit(c.netPay, c.daysInCutoff, settings.budget) : null;
              const over = s?.status === "over";
              return (
                <div key={c.id} data-tap onClick={() => openSheet({ type: "cutoff-detail", id: c.id })} style={{ ...card, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)" }}>{c.label}</div>
                    <div className="tabular" style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>{peso(c.netPay)} · {fmtDateLong(c.dateReceived)}</div>
                  </div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: over ? "var(--red-tint)" : "var(--green-light)", color: over ? "var(--red)" : "var(--rewards-green)" }}>
                    {over ? "Over budget" : "OK"}
                  </span>
                </div>
              );
            })}
          </div>
          {settings && (
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 10 }}>Emergency fund growth</div>
              <EFSparkline cutoffs={cutoffs} budget={settings.budget} />
            </div>
          )}
        </>
      )}

      <button onClick={() => router.push("/settings")} style={{ ...outlinedPill, width: "100%", marginTop: 8, padding: "12px", fontSize: "1.4rem" }}>
        Budget Partition Settings
      </button>

      <button onClick={logOut} style={{ width: "100%", textAlign: "center", marginTop: 24, background: "none", border: "none", color: "var(--red)", fontSize: "1.4rem", fontWeight: 600, cursor: "pointer", padding: 12 }}>
        Log out
      </button>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span><span style={{ color }}>●</span> {label}</span>
      <span className="tabular" style={{ color: "var(--text-black-soft)" }}>{value}</span>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: 10, borderRadius: "var(--radius-pill)", border: "none",
    background: active ? "var(--green-accent)" : "var(--ceramic)", color: active ? "#fff" : "var(--text-black-soft)",
    fontWeight: 600, fontSize: "1.3rem", cursor: "pointer",
  };
}
const primaryPill: React.CSSProperties = {
  borderRadius: "var(--radius-pill)", fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer",
  textAlign: "center", background: "var(--green-accent)", color: "#fff", border: "1px solid var(--green-accent)", boxSizing: "border-box",
};
const outlinedPill: React.CSSProperties = { ...primaryPill, background: "transparent", color: "var(--green-accent)" };
