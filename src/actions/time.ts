"use server";

/* Time entries — the daily in/out log that feeds pay computation. */

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/utils/auth/getUser";
import { toTimeEntry, fail } from "@/lib/mappers";
import { timeEntryInput } from "@/schemas";
import type { TimeEntry, TimeEntryInput } from "@/schemas";
import type { Database } from "@/lib/supabase/database.types";

export async function listTimeEntries(): Promise<TimeEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .order("date", { ascending: false });
  fail(error);
  return (data ?? []).map(toTimeEntry);
}

export async function createTimeEntry(input: TimeEntryInput): Promise<TimeEntry> {
  const user = await requireUser();
  const i = timeEntryInput.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ user_id: user.id, date: i.date, time_in: i.in, time_out: i.out, holiday: i.holiday })
    .select("*")
    .single();
  fail(error);
  return toTimeEntry(data!);
}

export async function updateTimeEntry(id: string, patch: Partial<TimeEntryInput>): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const dbPatch: Database["public"]["Tables"]["time_entries"]["Update"] = {};
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.in !== undefined) dbPatch.time_in = patch.in;
  if (patch.out !== undefined) dbPatch.time_out = patch.out;
  if (patch.holiday !== undefined) dbPatch.holiday = patch.holiday;
  const { error } = await supabase.from("time_entries").update(dbPatch).eq("id", id);
  fail(error);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  fail(error);
}
