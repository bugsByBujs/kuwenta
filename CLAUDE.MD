# AGENTS.md — Kuwenta

A mobile-first personal finance app for the Philippine context (₱ PHP). Track money across
banks/e-wallets, log expenses & debts, manage recurring bills, compute daily/holiday pay from a
time-in/time-out log, and auto-split each pay cutoff into spending buckets routed to real
accounts. A natural-language assistant turns "paid 120 coffee with GoTyme" into a categorized,
account-deducted transaction.

The working interaction reference is the HTML prototype `Kuwenta.dc.html` in this repo — open it
to see every screen, flow, and edge case the production build should match. (If this file is
being used to build from scratch with no prototype yet, treat every screen section below as the
spec of record instead.)

**This is the MVP version.** Keep the architecture minimal: Supabase is the only data layer.
Offline-first (local DB + sync) is an explicit **future iteration**, not part of this build —
see the note at the end of this file.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js** (App Router) |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS** |
| Components | **shadcn/ui** |
| Client state | **Zustand** — UI/session state only (active tab, open sheet, draft forms) |
| Data / auth / realtime | **Supabase** (Postgres + Auth + Realtime) — the single source of truth |
| Server state / fetching | **TanStack Query** — wraps every Supabase read/write, owns caching + refetch |
| On-device AI | **WebLLM** — parses natural-language entries in the browser |
| Validation | **Zod** — every form + every IO boundary |

### Architectural rules
- **Supabase is the only source of truth.** No local database layer in this iteration. Every read
  goes through a TanStack Query hook that calls Supabase directly; every write is a Supabase mutation
  invalidating the relevant query. The UI shows normal loading/error states like any networked app.
- **One-way validation.** Zod schemas live in `lib/schemas.ts` and are the single definition of
  every entity. Infer TS types from schemas (`z.infer`), never hand-write duplicate interfaces.
- **State split.** Zustand holds UI/session state only. TanStack Query owns all server data
  (accounts, expenses, bills, time entries, cutoff budgets) — nothing domain-related lives in
  Zustand or component state beyond an in-progress draft form.
- **AI is enrichment, never a gate.** WebLLM parses free text into a draft transaction; if the model
  is unavailable or returns junk, fall back to the regex heuristic (see `parseEntry`). The user always
  confirms the parsed result before it's committed.
- **Money math.** Store all amounts as numbers in PHP. Round to **2 decimals** everywhere (`round2`
  helper). Never use floats for display without
  `toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- **Money conservation.** Total balance = sum of all account balances, always derived, never stored
  separately. Any feature that moves money between buckets (see Budget Partition below) is a
  *transfer* between accounts — it must never create or destroy balance.

---

## Domain model

All entities carry `id`, `created_at`, `updated_at` (Supabase/Postgres defaults — snake_case in the
DB, mapped to camelCase at the Zod boundary).

### Account
A money source. `{ id, name, type: 'bank' | 'wallet' | 'cash', balance }`
- Total balance = sum of all account balances (derived, never stored separately).
- Exactly one account is the **default** (`defaultAccountId` in settings) — bills, debt settlements,
  and salary flow through it unless overridden.
- Seed examples: GCash, BPI Savings, Maya, GoTyme, Maribank, Cash on hand.

### Expense
`{ id, label, category, amount, date, accountId }`
- Categories: Food, Transport, Groceries, Shopping, Bills, Health.
- Committing an expense **decrements** its account's balance.

### Debt
`{ id, who, note, balance }` — money the user owes. "Settle" deducts from the default account and removes it.

### Bill
`{ id, label, sub, amount, due, paid, recurring: 'none' | 'weekly' | 'monthly' }`
- Status is derived from `due` vs today: paid / overdue / today / soon (≤3d) / upcoming.
- Paying a **one-time** bill marks it `paid`. Paying a **recurring** bill instead advances `due` to the
  next cycle and keeps it unpaid. Both deduct from the default account.
- "Unpay" reverses a payment and refunds the amount.

### TimeEntry
`{ id, date, in: 'HH:mm', out: 'HH:mm' | null, holiday: 'none' | 'regular' | 'special' }`
- 24-hour times. `out: null` = currently clocked in.
- **Pay formula:** `dailyRate = round(monthlySalary / workDays, 2)`.
  `base = hours >= 8 ? dailyRate : dailyRate / 8 * hours`.
  `pay = round(base * holidayMult, 2)` where `holidayMult = regular ? 2 : special ? 1.3 : 1`.
- Period earnings = sum of completed entries' pay. Net pay = period earnings − deductions.
- This period-earnings total is what feeds **CutoffBudget.netPay** by default (see below) — the
  Budget Partition feature reads it rather than making the user retype their paycheck.

### Settings
```ts
{
  monthlySalary: number,
  workDays: number,
  defaultAccountId: string,
  deductions: { id: string, name: string, amount: number }[],

  // Budget Partition config — see CutoffBudget below
  budget: {
    rentMonthly: number;          // default 3500
    laptopMonthly: number;        // default 1661
    laundryWeekly: number;        // default 200
    loadWeekly: number;           // default 100
    dailyFoodRate: number;        // default 300
    defaultDaysPerCutoff: number; // default 13
    efPercent: number;            // default 0.15 — of net pay
    wantsPercent: number;         // default 0.6  — of remainder after Bills+Laundry/Load+Food+EF
    savingsPercent: number;       // default 0.4  — wantsPercent + savingsPercent should sum to 1.0

    // bucket -> account routing, all reference existing Account ids (dropdown picker in UI,
    // never free text / hardcoded bank names in components)
    billsAccountId: string;       // e.g. GoTyme — rent + laptop
    dailySpendAccountId: string;  // e.g. Cash — daily food
    miscAccountId: string;        // e.g. Maya/GCash — laundry + load
    efAccountId: string;          // e.g. Maribank — emergency fund, untouchable
    extraAccountId: string;       // e.g. GoTyme — leftover (wants + savings pool)
  }
}
```

### CutoffBudget
Per-cutoff (semi-monthly pay period) budget split. Same entity conventions as Bill/Debt/TimeEntry.
```ts
CutoffBudget
- id: uuid
- label: string                     // e.g. "Jul 13-29", user-editable
- dateReceived: string              // YYYY-MM-DD
- netPay: number                    // defaults from summed TimeEntry.pay for the period, overridable
- daysInCutoff: number              // defaults from Settings.budget.defaultDaysPerCutoff
- linkedPeriodStart: string | null  // YYYY-MM-DD, the TimeEntry range this was pulled from
- linkedPeriodEnd: string | null
- committed: boolean                // false = preview only, true = account transfers applied
- createdAt, updatedAt
```

Everything else (bills amount, laundry+load, daily food, EF, remaining, wants/savings split) is
**derived, not stored** — compute on read from `CutoffBudget` + `Settings.budget`, the same pattern
Bill uses to derive status (paid/overdue/soon) from `due` vs today.

**Derived calculation — `lib/money.ts`:**
```ts
export function budgetSplit(netPay: number, days: number, s: Settings['budget']) {
  const bills = round2((s.rentMonthly + s.laptopMonthly) / 2);
  const miscLaundryLoad = round2((s.laundryWeekly + s.loadWeekly) * 2);
  const dailyFood = round2(s.dailyFoodRate * days);
  const emergencyFund = round2(netPay * s.efPercent);
  const totalAllocated = round2(bills + miscLaundryLoad + dailyFood + emergencyFund);
  const remaining = round2(netPay - totalAllocated);
  const wantsSuggested = round2(Math.max(remaining, 0) * s.wantsPercent);
  const savingsSuggested = round2(Math.max(remaining, 0) * s.savingsPercent);
  const status: 'ok' | 'over' = remaining < 0 ? 'over' : 'ok';
  return { bills, miscLaundryLoad, dailyFood, emergencyFund, totalAllocated,
           remaining, wantsSuggested, savingsSuggested, status };
}
```

**Committing a cutoff:** previewing a `CutoffBudget` never touches balances. Confirming it
(`committed: true`) writes transfer movements — decrement `defaultAccountId` (or wherever the
salary was logged as income), increment each bucket's routed `accountId` by its computed amount.
This keeps the money-conservation rule intact: nothing is created or destroyed, it's a transfer plan.
Do this as a single Supabase RPC/transaction (Postgres function) so the multi-row balance update is
atomic — not a client-side loop of separate updates.

> Keep these definitions in sync with `lib/schemas.ts`. The Zod schema is authoritative.

---

## Screens

1. **Auth** — register / login (Supabase Auth). Mobile frame, calm warm-neutral + deep-blue.
2. **Home** — "Add with AI" bar; Total money card (→ Money); Total expenses card; quick stats
   (upcoming bills, you owe); accounts strip; **Summary** (money in/out, net worth, savings rate);
   obligations strip; spending-by-category bars; recent activity.
3. **Spending** — add expense / add debt; month spend + total debt; **Debts** section (settle);
   **Expenses** list (each tagged with its source account).
4. **Bills** — total unpaid + overdue count; add bill; **Edit mode** (edit / delete / unpay per row);
   recurring badge; pay (rolls recurring forward).
5. **Time & Pay** — clock in/out with live timer; **Pay setup** (monthly salary ÷ work days = daily
   rate, 2 dp); days worked + earned; **Edit mode** with a 24h **wheel picker** and **DAY TYPE**
   selector (Regular / Reg. Holiday ×2 / Spec. Holiday ×1.3); time log with holiday tags.
6. **Money** — total across accounts (banks / e-wallets / cash split); per-account cards with
   **Set default / Edit / Remove**; add a bank or e-wallet.
   - **Budget Partition section** (new, nested here — don't add a 6th nav icon; this is
     fundamentally "what do I do with money across accounts," which Money already owns):
     - "New Cutoff" action → sheet with Label, Date Received (default today), Net Pay
       (**pre-filled from current Time & Pay period earnings**, editable), Days in Cutoff
       (pre-filled from `Settings.budget.defaultDaysPerCutoff`, editable), live breakdown
       preview as the user types, Confirm to commit
     - **History list**: past `CutoffBudget` entries, status badge (OK / Over budget), tap for detail
     - **Detail view**: full bucket breakdown, each row shows destination account name + amount,
       small donut/stacked-bar visual matching existing card styling
     - **Cumulative EF strip**: small chart/sparkline showing Emergency Fund growth over logged cutoffs
   - **Settings additions**: collapsible "Budget Partition Settings" section with the `budget` fields;
     account pickers (dropdown of existing `Account` records, never free text) for the 5 routing
     fields; soft validation warning (not a hard block) if `wantsPercent + savingsPercent !== 1.0`

Bottom nav: Home · Spending · Bills · Time · Money.

---

## AI quick-add (WebLLM)

Goal: free text → one draft transaction the user confirms.

```ts
// lib/ai/parseEntry.ts
// Returns a draft, never commits. Always resolves (model OR heuristic fallback).
type Draft = {
  type: 'expense' | 'income';
  amount: number | null;
  label: string;
  category: Category | 'Income';
  accountId: string;      // resolved by fuzzy-matching account names ("gotyme" → GoTyme)
  date: string;           // YYYY-MM-DD, default today
};
```

- Prompt WebLLM with the user's account names + the category list; require **JSON-only** output;
  parse defensively (strip code fences, slice to the outer `{…}`).
- If WebLLM is loading/unavailable or `amount` is null → run the **regex heuristic**
  (amount via `/(\d[\d,]*\.?\d*)/`, income keywords, category keyword map, account name match).
- Surface the draft in a confirm card with an editable account picker. Commit only on confirm:
  expense decrements the chosen account; income increments it — a normal Supabase mutation, same
  as if the user filled the form by hand.
- Load the model lazily (first use), show a "Thinking…" state, and cache the engine instance.

---

## Suggested structure

```
app/(app)/{home,spending,bills,time,money}/page.tsx
app/(auth)/{login,register}/page.tsx
components/ui/*          # shadcn
components/{AccountCard,BillRow,TimeWheel,AddSheet,AiQuickAdd}.tsx
components/{BudgetSheet,BudgetHistoryRow,BudgetDetailCard,EFSparkline}.tsx
lib/supabase.ts         # client, typed queries/mutations per table
lib/schemas.ts          # Zod (authoritative types) — Settings incl. `budget`, CutoffBudget, etc.
lib/ai/parseEntry.ts    # WebLLM + heuristic fallback
lib/money.ts            # peso(), round2(), dailyRate(), dayPay(), holidayMult(), budgetSplit()
stores/ui.ts            # Zustand (tab, sheet, drafts — UI state only)
hooks/use-*.ts          # TanStack Query hooks per entity, each wrapping a lib/supabase.ts call
                         # (use-accounts, use-expenses, use-bills, use-time-entries,
                         # use-cutoff-budgets, use-settings)
supabase/
  migrations/*.sql       # table definitions + the commit-cutoff RPC function
```

---

## Conventions
- Currency helper `peso(n)` everywhere — never raw `₱ + n`.
- 44px minimum touch targets; mobile-first; the app lives in a phone-width column.
- Palette: warm neutral background (`#F6F3EE` / `#E7E0D5`), deep-blue accent (`#1E40AF`), ink `#1B1915`.
  Semantic: green income/positive, amber bills, red expenses/debt/overdue.
- Type: Space Grotesk for numbers/headings, Plus Jakarta Sans for body.
- Validate every form with Zod before it hits a Supabase mutation.
- Don't hardcode bank/wallet names in components — always route through `accountId` references
  (`defaultAccountId`, `Settings.budget.*AccountId`, etc.), account pickers pull from `Account` records.
- Every screen that reads domain data shows a loading and an error state — there's no local cache
  to fall back on in this iteration, so a slow/offline connection is visible, not silently masked.
- Don't add features or content not present in this spec (or the prototype, if one exists) without asking.

---

## MVP build order (if building from scratch)

1. Supabase schema + RLS policies (all tables from the domain model) + `lib/schemas.ts` mirroring them
2. Auth + Settings screen (accounts seeded, budget config with defaults pre-filled)
3. Money screen — account cards + balances (core loop: everything else deducts/credits these)
4. Spending + Bills screens — expense/debt/bill CRUD against accounts
5. Time & Pay screen — clock in/out, pay calc, period earnings
6. Budget Partition section inside Money — reads period earnings, live preview, commit-as-transfer
   (this is the one that needs the Postgres RPC for atomic multi-account updates)
7. Home screen — aggregates everything above into the dashboard view
8. AI quick-add — layer on last, since it's enrichment over the manual flows, not a dependency

---

## Future iteration: offline-first

Not in scope now, but the intended next step once the Supabase-only MVP is stable:
- Introduce **Dexie.js** (IndexedDB) as a local source of truth; UI reads/writes Dexie instead of
  Supabase directly.
- Supabase becomes a **sync target**, not a blocking dependency — background sync reconciles Dexie
  ↔ Supabase, stamping a `syncedAt` field added to every entity at that point.
- TanStack Query's role shifts from "the data layer" to "sync status / background refetch only";
  `useLiveQuery` (dexie-react-hooks) becomes the primary read path.
- No user-facing behavior should need to change for this migration — it's a data-layer swap, not a
  feature. Don't design MVP screens in a way that assumes network-only forever (e.g. avoid patterns
  that would need a rewrite, like directly awaiting a Supabase call inside a render path).