"use client";

import { useAccounts, useExpenses, useDebts, useSettings, useSettleDebt, useDeleteExpense } from "@/hooks/use-data";
import { useUi } from "@/stores/ui";
import { peso } from "@/lib/money";
import { fmtDate, isThisMonth } from "@/lib/date";

const card: React.CSSProperties = { background: "#fff", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)" };
const h2: React.CSSProperties = { fontSize: "1.6rem", fontWeight: 600, color: "var(--text-black)", marginBottom: 12 };

export default function SpendingPage() {
  const { data: expenses = [] } = useExpenses();
  const { data: debts = [] } = useDebts();
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const settle = useSettleDebt();
  const delExpense = useDeleteExpense();
  const { openSheet } = useUi();

  const monthSpend = expenses.filter((e) => e.category !== "Income" && isThisMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const acctName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—";

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--green-starbucks)" }}>Spending</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => openSheet({ type: "add-debt" })} style={pill("outlined")}>+ Debt</button>
          <button onClick={() => openSheet({ type: "add-expense" })} style={pill("primary")}>+ Expense</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>Month spend</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--red)", marginTop: 4 }}>{peso(monthSpend)}</div>
        </div>
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>Total debt</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--text-black)", marginTop: 4 }}>{peso(totalDebt)}</div>
        </div>
      </div>

      <div style={h2}>Debts</div>
      <div style={{ ...card, padding: "8px 16px", marginBottom: 20 }}>
        {debts.length === 0 && <div style={{ padding: "12px 0", fontSize: "1.3rem", color: "var(--text-black-soft)" }}>No debts. Nice.</div>}
        {debts.map((d) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)" }}>{d.who}</div>
              {d.note && <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>{d.note}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="tabular" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--red)" }}>{peso(d.balance)}</span>
              <button
                onClick={() => settle.mutate({ debt: d, fromAccountId: settings?.defaultAccountId ?? null })}
                style={{ ...pill("outlined"), padding: "6px 14px", fontSize: "1.2rem" }}
              >
                Settle
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={h2}>Expenses</div>
      <div style={{ ...card, padding: "8px 16px" }}>
        {expenses.length === 0 && <div style={{ padding: "12px 0", fontSize: "1.3rem", color: "var(--text-black-soft)" }}>No expenses yet.</div>}
        {expenses.map((e) => {
          const income = e.category === "Income";
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-black)" }}>{e.label}</div>
                <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>
                  {e.category} · {acctName(e.accountId)} · {fmtDate(e.date)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="tabular" style={{ fontSize: "1.4rem", fontWeight: 700, color: income ? "var(--green-accent)" : "var(--red)" }}>
                  {income ? "+" : "-"}{peso(e.amount)}
                </span>
                <button onClick={() => delExpense.mutate(e)} style={{ background: "none", border: "none", color: "var(--text-black-soft)", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pill(variant: "primary" | "outlined"): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: "var(--radius-pill)",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: "1.3rem",
    cursor: "pointer",
    background: variant === "primary" ? "var(--green-accent)" : "#fff",
    color: variant === "primary" ? "#fff" : "var(--green-accent)",
    border: `1px solid var(--green-accent)`,
  };
}
