import type { Settings, TimeEntry } from "@/schemas";

/** Round to 2 decimals (money everywhere is 2dp PHP). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Format a peso amount — always use this, never raw `₱ + n`. */
export function peso(n: number): string {
  return (
    "₱" +
    (n ?? 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Daily rate = monthly salary / work days, 2dp. */
export function dailyRate(monthlySalary: number, workDays: number): number {
  if (!workDays) return 0;
  return round2(monthlySalary / workDays);
}

export function holidayMult(holiday: TimeEntry["holiday"]): number {
  return holiday === "regular" ? 2 : holiday === "special" ? 1.3 : 1;
}

/** Hours between two HH:mm strings (handles overnight wrap). */
export function hoursBetween(inT: string, outT: string): number {
  const [ih, im] = inT.split(":").map(Number);
  const [oh, om] = outT.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

/** Pay for a single completed time entry. */
export function dayPay(entry: TimeEntry, rate: number): number {
  if (!entry.out) return 0;
  const hours = hoursBetween(entry.in, entry.out);
  const base = hours >= 8 ? rate : (rate / 8) * hours;
  return round2(base * holidayMult(entry.holiday));
}

export type BudgetSplit = {
  bills: number;
  miscLaundryLoad: number;
  dailyFood: number;
  emergencyFund: number;
  totalAllocated: number;
  remaining: number;
  wantsSuggested: number;
  savingsSuggested: number;
  status: "ok" | "over";
};

/** Per-cutoff budget partition — derived, never stored. Mirrors the commit RPC. */
export function budgetSplit(
  netPay: number,
  days: number,
  s: Settings["budget"]
): BudgetSplit {
  const bills = round2((s.rentMonthly + s.laptopMonthly) / 2);
  const miscLaundryLoad = round2((s.laundryWeekly + s.loadWeekly) * 2);
  const dailyFood = round2(s.dailyFoodRate * days);
  const emergencyFund = round2(netPay * s.efPercent);
  const totalAllocated = round2(bills + miscLaundryLoad + dailyFood + emergencyFund);
  const remaining = round2(netPay - totalAllocated);
  const wantsSuggested = round2(Math.max(remaining, 0) * s.wantsPercent);
  const savingsSuggested = round2(Math.max(remaining, 0) * s.savingsPercent);
  const status: "ok" | "over" = remaining < 0 ? "over" : "ok";
  return {
    bills,
    miscLaundryLoad,
    dailyFood,
    emergencyFund,
    totalAllocated,
    remaining,
    wantsSuggested,
    savingsSuggested,
    status,
  };
}
