"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentUser } from "@/actions/auth";
import { useAccounts, useExpenses, useBills, useDebts } from "@/hooks/use-data";
import { useUi } from "@/stores/ui";
import { peso } from "@/lib/money";
import { isThisMonth, fmtDate } from "@/lib/date";
import { CATEGORIES } from "@/schemas";

const AVATAR_COLORS = ["#00754a", "#1e3932", "#2b5148", "#cba258", "#006241", "#33433d"];

export default function HomePage() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: expenses = [] } = useExpenses();
  const { data: bills = [] } = useBills();
  const { data: debts = [] } = useDebts();
  const { openSheet } = useUi();

  const [name, setName] = useState("there");
  const [hideBalance, setHideBalance] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    currentUser().then(({ name }) => {
      if (name) setName(name.split(" ")[0]);
    });
  }, []);

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const monthExp = expenses.filter((e) => e.category !== "Income" && isThisMonth(e.date));
  const monthOut = monthExp.reduce((s, e) => s + e.amount, 0);
  const monthIn = expenses
    .filter((e) => e.category === "Income" && isThisMonth(e.date))
    .reduce((s, e) => s + e.amount, 0);
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const unpaidCount = bills.filter((b) => !b.paid).length;
  const savingsRate = monthIn > 0 ? Math.max(0, Math.round(((monthIn - monthOut) / monthIn) * 100)) : 0;

  const byCat = CATEGORIES.map((c) => ({
    name: c,
    total: monthExp.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.total > 0);
  const catMax = Math.max(1, ...byCat.map((x) => x.total));

  const acctName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—";
  const balanceDisplay = hideBalance ? "₱ ••••••" : peso(total);

  const quick = [
    { label: "Expense", href: "/spending", icon: <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /> },
    { label: "Pay bill", href: "/bills", icon: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" /><path d="M9 7h6M9 11h6" /></> },
    { label: "Clock in", href: "/time", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></> },
    { label: "Budget", href: "/money", icon: <><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M17 12h3" /></> },
  ];

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
  };

  return (
    <div className="stagger">
      {/* header */}
      <div style={{ background: "var(--green-house)", padding: "20px 24px 64px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "1.4rem", color: "var(--white-a70)" }}>Hello!</div>
            <div style={{ fontSize: "2rem", fontWeight: 600 }}>Kumusta, {name}!</div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--white-a20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </div>
        </div>
        {showBanner && (
          <div
            style={{
              marginTop: 16,
              background: "var(--white-a10)",
              borderRadius: "var(--radius-input)",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "1.3rem", color: "var(--white-a90)", flex: 1 }}>
              Add Kuwenta to your home screen for quick access.
            </span>
            <button
              onClick={() => setShowBanner(false)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: "1.6rem", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
        <button
          onClick={() => openSheet({ type: "ai-quickadd" })}
          style={{
            marginTop: 16,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--white-a10)",
            borderRadius: "var(--radius-pill)",
            padding: "10px 16px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
          </svg>
          <span style={{ fontSize: "1.4rem", color: "var(--white-a70)" }}>Try: &quot;paid 120 coffee sa GoTyme&quot;</span>
        </button>
      </div>

      {/* balance card */}
      <div style={{ ...card, margin: "-48px 20px 0", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.3rem", color: "var(--text-black-soft)" }}>Total balance across all accounts</div>
            <div className="tabular" style={{ fontSize: "2.8rem", fontWeight: 700, color: "var(--text-black)", marginTop: 4 }}>
              {balanceDisplay}
            </div>
          </div>
          <button
            onClick={() => setHideBalance((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-black-soft)", marginTop: 6 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 18 }}>
          {quick.map((q) => (
            <button
              key={q.label}
              onClick={() => router.push(q.href)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--green-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {q.icon}
                </svg>
              </div>
              <span style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 20 }}>
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>This month&apos;s spending</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--red)", marginTop: 4 }}>{peso(monthOut)}</div>
        </div>
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>Upcoming bills · You owe</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--text-black)", marginTop: 4 }}>
            {unpaidCount} · {peso(totalDebt)}
          </div>
        </div>
      </div>

      {/* accounts */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 12 }}>Your accounts</div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {accounts.length === 0 && <div style={{ fontSize: "1.3rem", color: "var(--text-black-soft)" }}>No accounts yet.</div>}
          {accounts.map((a) => (
            <div key={a.id} style={{ ...card, minWidth: 140, padding: 14, flexShrink: 0 }}>
              <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", textTransform: "capitalize" }}>{a.type}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)", margin: "4px 0" }}>{a.name}</div>
              <div className="tabular" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--green-starbucks)" }}>{peso(a.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* summary */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 12 }}>Summary</div>
        <div style={{ ...card, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Metric label="Money in" value={peso(monthIn)} color="var(--green-accent)" />
          <Metric label="Money out" value={peso(monthOut)} color="var(--red)" />
          <Metric label="Net worth" value={peso(total - totalDebt)} color="var(--text-black)" />
          <Metric label="Savings rate" value={`${savingsRate}%`} color="var(--text-black)" />
        </div>
      </div>

      {/* spending by category */}
      {byCat.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 12 }}>Spending by category</div>
          <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {byCat.map((c) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-black)" }}>{c.name}</span>
                  <span className="tabular" style={{ color: "var(--text-black-soft)" }}>{peso(c.total)}</span>
                </div>
                <div style={{ height: 8, background: "var(--ceramic)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--green-accent)", width: `${(c.total / catMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* recent activity */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 12 }}>Recent activity</div>
        <div style={{ ...card, padding: "8px 16px" }}>
          {expenses.length === 0 && <div style={{ padding: "12px 0", fontSize: "1.3rem", color: "var(--text-black-soft)" }}>Nothing yet.</div>}
          {expenses.slice(0, 5).map((e, i) => {
            const income = e.category === "Income";
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: income ? "var(--green-accent)" : AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    flexShrink: 0,
                  }}
                >
                  {(e.label[0] || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)" }}>{e.label}</div>
                  <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>
                    {e.category} · {acctName(e.accountId)} · {fmtDate(e.date)}
                  </div>
                </div>
                <div className="tabular" style={{ fontSize: "1.4rem", fontWeight: 700, color: income ? "var(--green-accent)" : "var(--text-black)" }}>
                  {income ? "+" : "-"}
                  {peso(e.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>{label}</div>
      <div className="tabular" style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
