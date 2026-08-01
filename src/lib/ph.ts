import { round2 } from "@/lib/money";

/* ============================================================
   Philippine payroll deductions (2024 rules, approximated to
   what the prototype's setup + Time & Pay screens display).
   All inputs/outputs are monthly pesos.
   ============================================================ */

export type PayConfig = {
  scheduleType: "fixed" | "flexible";
  workDays: number; // fixed schedule: work days per month
  hoursPerDay: number; // for flexible hourly rate derivation
  sss: boolean;
  philhealth: boolean;
  pagibig: boolean;
  minimumWage: boolean; // MWE = income-tax exempt
};

export const DEFAULT_PAY: PayConfig = {
  scheduleType: "fixed",
  workDays: 22,
  hoursPerDay: 8,
  sss: true,
  philhealth: true,
  pagibig: true,
  minimumWage: false,
};

/** SSS employee share — 5% of salary credit (₱5,000–₱35,000). Matches prototype. */
export function sssContribution(salary: number, on: boolean): number {
  if (!on) return 0;
  const base = Math.min(Math.max(salary, 5000), 35000);
  return round2(base * 0.05);
}

/** PhilHealth employee share — 2.5% of salary base ₱10k–₱100k. */
export function philhealthContribution(salary: number, on: boolean): number {
  if (!on) return 0;
  const base = Math.min(Math.max(salary, 10000), 100000);
  return round2(base * 0.025);
}

/** Pag-IBIG employee share — 2% of salary, capped at ₱200 (₱10k base). */
export function pagibigContribution(salary: number, on: boolean): number {
  if (!on) return 0;
  return round2(Math.min(salary, 10000) * 0.02);
}

/** BIR TRAIN monthly withholding tax on taxable income. MWEs are exempt. */
export function withholdingTax(taxable: number, minimumWage: boolean): number {
  if (minimumWage || taxable <= 20833) return 0;
  if (taxable <= 33333) return round2((taxable - 20833) * 0.15);
  if (taxable <= 66667) return round2(1875 + (taxable - 33333) * 0.2);
  if (taxable <= 166667) return round2(8541.8 + (taxable - 66667) * 0.25);
  if (taxable <= 666667) return round2(33541.8 + (taxable - 166667) * 0.3);
  return round2(183541.8 + (taxable - 666667) * 0.35);
}

export type PayBreakdown = {
  gross: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  withholdingTax: number;
  totalDeductions: number;
  net: number;
};

export function payBreakdown(salary: number, cfg: PayConfig): PayBreakdown {
  const gross = Math.max(0, salary || 0);
  const sss = sssContribution(gross, cfg.sss);
  const philhealth = philhealthContribution(gross, cfg.philhealth);
  const pagibig = pagibigContribution(gross, cfg.pagibig);
  const taxable = round2(gross - sss - philhealth - pagibig);
  const tax = withholdingTax(taxable, cfg.minimumWage);
  const totalDeductions = round2(sss + philhealth + pagibig + tax);
  const net = round2(gross - totalDeductions);
  return { gross, sss, philhealth, pagibig, withholdingTax: tax, totalDeductions, net };
}

/** Flexible schedule: hourly rate from monthly net over work days × hours. */
export function hourlyRate(net: number, cfg: PayConfig): number {
  const days = cfg.workDays || 22;
  const hrs = cfg.hoursPerDay || 8;
  return round2(net / (days * hrs));
}
