"use client";

import { useState } from "react";
import { useBills, useSettings, usePayBill, useUnpayBill, useDeleteBill, useUpdateBill } from "@/hooks/use-data";
import { useUi } from "@/stores/ui";
import { peso } from "@/lib/money";
import { billStatus, fmtDate } from "@/lib/date";
import type { Bill } from "@/lib/schemas";

const card: React.CSSProperties = { background: "#fff", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)" };
const iconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--input-border)", background: "#fff",
  color: "var(--text-black-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: "var(--green-light)", color: "var(--rewards-green)", label: "Paid" },
  overdue: { bg: "var(--red-tint)", color: "var(--red)", label: "Overdue" },
  today: { bg: "#fdf3d6", color: "#8a6d0b", label: "Due today" },
  soon: { bg: "#fdf3d6", color: "#8a6d0b", label: "Due soon" },
  upcoming: { bg: "var(--ceramic)", color: "var(--text-black-soft)", label: "Upcoming" },
};

export default function BillsPage() {
  const { data: bills = [] } = useBills();
  const { data: settings } = useSettings();
  const pay = usePayBill();
  const unpay = useUnpayBill();
  const del = useDeleteBill();
  const update = useUpdateBill();
  const { billsEditMode, toggleBillsEdit, openSheet } = useUi();

  const [editId, setEditId] = useState<string | null>(null);
  const [ef, setEf] = useState({ label: "", amount: "", due: "" });

  const defaultAcct = settings?.defaultAccountId ?? null;
  const unpaid = bills.filter((b) => !b.paid);
  const totalUnpaid = unpaid.reduce((s, b) => s + b.amount, 0);
  const overdue = bills.filter((b) => billStatus(b.due, b.paid) === "overdue").length;

  function startEdit(b: Bill) {
    setEditId(b.id);
    setEf({ label: b.label, amount: String(b.amount), due: b.due });
  }
  async function saveEdit(b: Bill) {
    await update.mutateAsync({ id: b.id, patch: { label: ef.label, amount: Number(ef.amount), due: ef.due } });
    setEditId(null);
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--green-starbucks)" }}>Bills</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggleBillsEdit} style={{ ...iconBtn, width: 36, height: 36, color: billsEditMode ? "var(--green-accent)" : "var(--text-black-soft)" }}>
            <Pencil />
          </button>
          <button onClick={() => openSheet({ type: "add-bill" })} style={primaryPill}>+ Bill</button>
        </div>
      </div>

      <div style={{ ...card, padding: 14, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>Total unpaid</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--text-black)" }}>{peso(totalUnpaid)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)" }}>Overdue</div>
          <div className="tabular" style={{ fontSize: "1.9rem", fontWeight: 700, color: overdue ? "var(--red)" : "var(--text-black)" }}>{overdue}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bills.length === 0 && <div style={{ ...card, padding: 16, fontSize: "1.3rem", color: "var(--text-black-soft)" }}>No bills yet.</div>}
        {bills.map((b) => {
          const st = STATUS[billStatus(b.due, b.paid)];
          const editing = editId === b.id;
          return (
            <div key={b.id} style={{ ...card, padding: 16 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={ef.label} onChange={(e) => setEf({ ...ef, label: e.target.value })} placeholder="Bill name" style={editInput} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={ef.amount} onChange={(e) => setEf({ ...ef, amount: e.target.value })} inputMode="numeric" placeholder="Amount" style={{ ...editInput, flex: 1 }} />
                    <input value={ef.due} onChange={(e) => setEf({ ...ef, due: e.target.value })} type="date" style={{ ...editInput, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditId(null)} style={{ ...ghostPill, flex: 1 }}>Cancel</button>
                    <button onClick={() => saveEdit(b)} style={{ ...primaryPill, flex: 1 }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-black)" }}>{b.label}</span>
                        {b.recurring !== "none" && (
                          <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", background: "var(--green-light)", color: "var(--rewards-green)", padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>
                            Recurring
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "1.2rem", color: "var(--text-black-soft)", marginTop: 2 }}>
                        {b.sub ? `${b.sub} · ` : ""}due {fmtDate(b.due)}
                      </div>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span className="tabular" style={{ fontSize: "1.7rem", fontWeight: 700, color: "var(--text-black)" }}>{peso(b.amount)}</span>
                    {billsEditMode ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(b)} style={iconBtn}><Pencil /></button>
                        <button onClick={() => del.mutate(b.id)} style={{ ...iconBtn, color: "var(--red)" }}><Trash /></button>
                      </div>
                    ) : b.paid ? (
                      <button onClick={() => unpay.mutate({ bill: b, toAccountId: defaultAcct })} style={{ ...outlinedPill, padding: "6px 18px", fontSize: "1.3rem" }}>Unpay</button>
                    ) : (
                      <button onClick={() => pay.mutate({ bill: b, fromAccountId: defaultAcct })} style={{ ...primaryPill, padding: "6px 18px", fontSize: "1.3rem" }}>Pay</button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const editInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid var(--input-border)",
  borderRadius: "var(--radius-input)", fontSize: "1.4rem", fontFamily: "var(--font-sans)", color: "var(--text-black)",
};
const primaryPill: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-sans)", fontWeight: 600,
  fontSize: "1.3rem", cursor: "pointer", textAlign: "center", background: "var(--green-accent)", color: "#fff", border: "1px solid var(--green-accent)",
};
const outlinedPill: React.CSSProperties = { ...primaryPill, background: "#fff", color: "var(--green-accent)" };
const ghostPill: React.CSSProperties = { ...primaryPill, background: "transparent", color: "var(--text-black-soft)", border: "1px solid var(--input-border)" };

function Pencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
function Trash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" />
    </svg>
  );
}
