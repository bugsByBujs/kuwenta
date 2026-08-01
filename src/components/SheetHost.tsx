"use client";

import { AddExpenseSheet } from "@/components/sheets/AddExpenseSheet";
import { AddDebtSheet } from "@/components/sheets/AddDebtSheet";
import { AddBillSheet } from "@/components/sheets/AddBillSheet";
import { AddAccountSheet } from "@/components/sheets/AddAccountSheet";
import { AiQuickAddSheet } from "@/components/sheets/AiQuickAddSheet";
import { NewCutoffSheet } from "@/components/sheets/NewCutoffSheet";
import { CutoffDetailSheet } from "@/components/sheets/CutoffDetailSheet";

/** Renders every global sheet; each shows itself when its type is active. */
export function SheetHost() {
  return (
    <>
      <AddExpenseSheet />
      <AddDebtSheet />
      <AddBillSheet />
      <AddAccountSheet />
      <AiQuickAddSheet />
      <NewCutoffSheet />
      <CutoffDetailSheet />
    </>
  );
}
