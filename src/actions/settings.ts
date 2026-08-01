"use server";

/* User settings — salary, work days, deductions, budget partition, pay config.
   Stored one row per user (upsert on user_id). */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { fail } from "@/lib/mappers";
import { budgetSchema, payConfigSchema } from "@/schemas";
import type { Settings } from "@/schemas";
import type { Database } from "@/lib/supabase/database.types";

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").single();
  fail(error);
  return {
    monthlySalary: Number(data!.monthly_salary),
    workDays: data!.work_days,
    defaultAccountId: data!.default_account_id,
    deductions: Array.isArray(data!.deductions) ? (data!.deductions as Settings["deductions"]) : [],
    budget: budgetSchema.parse(data!.budget ?? {}),
    pay: payConfigSchema.parse(data!.pay ?? {}),
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const dbPatch: Database["public"]["Tables"]["settings"]["Update"] = {};
  if (patch.monthlySalary !== undefined) dbPatch.monthly_salary = patch.monthlySalary;
  if (patch.workDays !== undefined) dbPatch.work_days = patch.workDays;
  if (patch.defaultAccountId !== undefined) dbPatch.default_account_id = patch.defaultAccountId;
  if (patch.deductions !== undefined) dbPatch.deductions = patch.deductions;
  if (patch.budget !== undefined) dbPatch.budget = patch.budget;
  if (patch.pay !== undefined) dbPatch.pay = patch.pay;
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: user.id, ...dbPatch }, { onConflict: "user_id" });
  fail(error);
}
