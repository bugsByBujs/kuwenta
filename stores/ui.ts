"use client";

import { create } from "zustand";

/** UI/session state only — never domain data (that lives in TanStack Query). */
export type SheetKind =
  | { type: "none" }
  | { type: "add-expense" }
  | { type: "add-debt" }
  | { type: "add-bill" }
  | { type: "add-account" }
  | { type: "new-cutoff" }
  | { type: "ai-quickadd" }
  | { type: "cutoff-detail"; id: string };

type UiState = {
  sheet: SheetKind;
  openSheet: (s: SheetKind) => void;
  closeSheet: () => void;
  billsEditMode: boolean;
  toggleBillsEdit: () => void;
  timeEditMode: boolean;
  toggleTimeEdit: () => void;
};

export const useUi = create<UiState>((set) => ({
  sheet: { type: "none" },
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: { type: "none" } }),
  billsEditMode: false,
  toggleBillsEdit: () => set((s) => ({ billsEditMode: !s.billsEditMode })),
  timeEditMode: false,
  toggleTimeEdit: () => set((s) => ({ timeEditMode: !s.timeEditMode })),
}));
