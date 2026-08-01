export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/** Days from today (negative = past). */
export function daysFromToday(iso: string): number {
  const t = new Date(todayISO() + "T00:00:00").getTime();
  const d = new Date(iso + "T00:00:00").getTime();
  return Math.round((d - t) / 86_400_000);
}

export type BillStatus = "paid" | "overdue" | "today" | "soon" | "upcoming";

export function billStatus(due: string, paid: boolean): BillStatus {
  if (paid) return "paid";
  const n = daysFromToday(due);
  if (n < 0) return "overdue";
  if (n === 0) return "today";
  if (n <= 3) return "soon";
  return "upcoming";
}

export function isThisMonth(iso: string): boolean {
  const now = new Date();
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
