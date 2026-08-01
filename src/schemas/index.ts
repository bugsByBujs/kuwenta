import { z } from "zod";

/* ============================================================
   Authoritative Zod schemas. Infer TS types from these — never
   hand-write duplicate interfaces. DB is snake_case; these are
   camelCase (mapped at the lib/data/mappers.ts boundary).
   ============================================================ */

export const CATEGORIES = ["Food", "Transport", "Groceries", "Shopping", "Bills", "Health"] as const;
export const ACCOUNT_TYPES = ["bank", "wallet", "cash"] as const;
export const RECURRING = ["none", "weekly", "monthly"] as const;
export const HOLIDAY = ["none", "regular", "special"] as const;

export const categoryEnum = z.enum(CATEGORIES);
/** Expense rows may also carry the synthetic "Income" category (money in). */
export const expenseCategoryEnum = z.enum([...CATEGORIES, "Income"]);
export const accountTypeEnum = z.enum(ACCOUNT_TYPES);
export const recurringEnum = z.enum(RECURRING);
export const holidayEnum = z.enum(HOLIDAY);

const money = z.number().finite();
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h HH:mm");
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/* ---------- Account ---------- */
export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: accountTypeEnum,
  balance: money,
});
export const accountInput = accountSchema.omit({ id: true, balance: true }).extend({
  balance: money.default(0),
});
export type Account = z.infer<typeof accountSchema>;
export type AccountInput = z.infer<typeof accountInput>;

/* ---------- Expense ---------- */
export const expenseSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  category: expenseCategoryEnum,
  amount: money.positive(),
  date: dateStr,
  accountId: z.string().uuid().nullable(),
});
export const expenseInput = expenseSchema.omit({ id: true });
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseInput = z.infer<typeof expenseInput>;

/* ---------- Debt ---------- */
export const debtSchema = z.object({
  id: z.string().uuid(),
  who: z.string().min(1),
  note: z.string().nullable(),
  balance: money.nonnegative(),
});
export const debtInput = debtSchema.omit({ id: true });
export type Debt = z.infer<typeof debtSchema>;
export type DebtInput = z.infer<typeof debtInput>;

/* ---------- Bill ---------- */
export const billSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  sub: z.string().nullable(),
  amount: money.positive(),
  due: dateStr,
  paid: z.boolean(),
  recurring: recurringEnum,
});
export const billInput = billSchema.omit({ id: true, paid: true }).extend({
  paid: z.boolean().default(false),
});
export type Bill = z.infer<typeof billSchema>;
export type BillInput = z.infer<typeof billInput>;

/* ---------- TimeEntry ---------- */
export const timeEntrySchema = z.object({
  id: z.string().uuid(),
  date: dateStr,
  in: timeStr,
  out: timeStr.nullable(),
  holiday: holidayEnum,
});
export const timeEntryInput = timeEntrySchema.omit({ id: true });
export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type TimeEntryInput = z.infer<typeof timeEntryInput>;

/* ---------- Settings ---------- */
export const deductionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  amount: money.nonnegative(),
});
export type Deduction = z.infer<typeof deductionSchema>;

export const budgetSchema = z.object({
  rentMonthly: money.default(3500),
  laptopMonthly: money.default(1661),
  laundryWeekly: money.default(200),
  loadWeekly: money.default(100),
  dailyFoodRate: money.default(300),
  defaultDaysPerCutoff: z.number().int().positive().default(13),
  efPercent: money.default(0.15),
  wantsPercent: money.default(0.6),
  savingsPercent: money.default(0.4),
  billsAccountId: z.string().uuid().nullable().default(null),
  dailySpendAccountId: z.string().uuid().nullable().default(null),
  miscAccountId: z.string().uuid().nullable().default(null),
  efAccountId: z.string().uuid().nullable().default(null),
  extraAccountId: z.string().uuid().nullable().default(null),
});
export type Budget = z.infer<typeof budgetSchema>;

export const payConfigSchema = z.object({
  scheduleType: z.enum(["fixed", "flexible"]).default("fixed"),
  workDays: z.number().int().positive().default(22),
  hoursPerDay: z.number().positive().default(8),
  sss: z.boolean().default(true),
  philhealth: z.boolean().default(true),
  pagibig: z.boolean().default(true),
  minimumWage: z.boolean().default(false),
});
export type PayConfigSchema = z.infer<typeof payConfigSchema>;

export const settingsSchema = z.object({
  monthlySalary: money.nonnegative(),
  workDays: z.number().int().positive(),
  defaultAccountId: z.string().uuid().nullable(),
  deductions: z.array(deductionSchema),
  budget: budgetSchema,
  pay: payConfigSchema,
});
export type Settings = z.infer<typeof settingsSchema>;

/* ---------- Auth ---------- */
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Use at least 6 characters"),
  fullName: z.string().min(1, "Enter your name"),
  mobile: z.string().min(1, "Enter your mobile number"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Payload for the post-signup setup wizard (accounts + pay + budget). */
export const setupSchema = z.object({
  salary: money.nonnegative(),
  pay: payConfigSchema,
  banks: z.array(accountInput).min(1, "Pick at least one account"),
});
export type SetupInput = z.infer<typeof setupSchema>;

/* ---------- CutoffBudget ---------- */
export const cutoffBudgetSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  dateReceived: dateStr,
  netPay: money.nonnegative(),
  daysInCutoff: z.number().int().positive(),
  linkedPeriodStart: dateStr.nullable(),
  linkedPeriodEnd: dateStr.nullable(),
  committed: z.boolean(),
});
export const cutoffBudgetInput = cutoffBudgetSchema.omit({ id: true, committed: true });
export type CutoffBudget = z.infer<typeof cutoffBudgetSchema>;
export type CutoffBudgetInput = z.infer<typeof cutoffBudgetInput>;
