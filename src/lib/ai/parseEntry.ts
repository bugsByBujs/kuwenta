import type { Account } from "@/schemas";
import { CATEGORIES } from "@/schemas";
import { todayISO } from "@/lib/date";

export type Category = (typeof CATEGORIES)[number];

export type Draft = {
  type: "expense" | "income";
  amount: number | null;
  label: string;
  category: Category | "Income";
  accountId: string; // resolved to an account id
  date: string; // YYYY-MM-DD
};

type Ctx = { accounts: Account[]; defaultAccountId: string | null };

const INCOME_RE = /\b(salary|sahod|sweldo|paid me|got paid|received|receive|kita|income|refund|allowance|bonus)\b/i;

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Food: ["coffee", "food", "kain", "lunch", "dinner", "breakfast", "jollibee", "mcdo", "starbucks", "snack", "merienda", "ulam"],
  Transport: ["grab", "jeep", "jeepney", "fare", "gas", "taxi", "bus", "mrt", "lrt", "toll", "angkas", "gasoline"],
  Groceries: ["grocery", "groceries", "market", "palengke", "supermarket", "puregold", "sm", "vegetables"],
  Shopping: ["shopee", "lazada", "clothes", "shoes", "shirt", "gadget", "shopping", "tiktok"],
  Bills: ["bill", "meralco", "internet", "wifi", "load", "rent", "electric", "water", "subscription", "netflix"],
  Health: ["medicine", "gamot", "doctor", "pharmacy", "mercury", "hospital", "vitamins", "checkup"],
};

function guessCategory(text: string): Category {
  const t = text.toLowerCase();
  for (const cat of CATEGORIES) {
    if (CATEGORY_KEYWORDS[cat].some((k) => t.includes(k))) return cat;
  }
  return "Food";
}

function matchAccount(text: string, ctx: Ctx): string {
  const t = text.toLowerCase().replace(/\s+/g, "");
  for (const a of ctx.accounts) {
    const key = a.name.toLowerCase().replace(/\s+/g, "");
    if (key && t.includes(key)) return a.id;
  }
  return ctx.defaultAccountId ?? ctx.accounts[0]?.id ?? "";
}

/** Regex/keyword heuristic — always available, no model needed. */
export function heuristicParse(text: string, ctx: Ctx): Draft {
  const amountMatch = text.match(/(\d[\d,]*\.?\d*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
  const isIncome = INCOME_RE.test(text);
  const accountId = matchAccount(text, ctx);

  let label = text
    .replace(/(\d[\d,]*\.?\d*)/g, "")
    .replace(/\b(with|via|from|using|paid|pay|for|php|peso|pesos|₱)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
  if (ctx.accounts.length) {
    for (const a of ctx.accounts) {
      label = label.replace(new RegExp(a.name, "ig"), "").trim();
    }
  }
  if (!label) label = isIncome ? "Income" : "Expense";
  label = label.charAt(0).toUpperCase() + label.slice(1);

  return {
    type: isIncome ? "income" : "expense",
    amount,
    label,
    category: isIncome ? "Income" : guessCategory(text),
    accountId,
    date: todayISO(),
  };
}

/* --------- Optional WebLLM enhancement (lazy, browser-only) --------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let enginePromise: Promise<any> | null = null;
const MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEngine(onProgress?: (msg: string) => void): Promise<any> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    throw new Error("WebGPU not available");
  }
  if (!enginePromise) {
    enginePromise = (async () => {
      const webllm = await import("@mlc-ai/web-llm");
      return webllm.CreateMLCEngine(MODEL, {
        initProgressCallback: (r: { text: string }) => onProgress?.(r.text),
      });
    })();
  }
  return enginePromise;
}

function stripJson(s: string): string {
  const noFence = s.replace(/```json/gi, "").replace(/```/g, "");
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  return start >= 0 && end > start ? noFence.slice(start, end + 1) : noFence;
}

/**
 * Parse free text into a draft transaction. Tries WebLLM if available,
 * always falls back to the heuristic. Never commits — the user confirms.
 */
export async function parseEntry(
  text: string,
  ctx: Ctx,
  onProgress?: (msg: string) => void
): Promise<Draft> {
  const fallback = heuristicParse(text, ctx);
  try {
    const engine = await getEngine(onProgress);
    const accountNames = ctx.accounts.map((a) => a.name).join(", ");
    const prompt = `You convert a Filipino personal-finance note into JSON. Accounts: [${accountNames}]. Categories: [${CATEGORIES.join(
      ", "
    )}, Income]. Reply with ONLY JSON: {"type":"expense|income","amount":number,"label":"short","category":"one of the categories","account":"one account name or empty"}. Note: "${text}"`;
    const res = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 160,
    });
    const raw = res.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(stripJson(raw));
    const amount =
      typeof parsed.amount === "number" && isFinite(parsed.amount) ? parsed.amount : fallback.amount;
    if (amount == null) return fallback;
    const acctId =
      ctx.accounts.find((a) => a.name.toLowerCase() === String(parsed.account ?? "").toLowerCase())
        ?.id ?? fallback.accountId;
    const type: Draft["type"] = parsed.type === "income" ? "income" : "expense";
    const category: Draft["category"] =
      type === "income"
        ? "Income"
        : (CATEGORIES as readonly string[]).includes(parsed.category)
          ? parsed.category
          : fallback.category;
    return {
      type,
      amount,
      label: typeof parsed.label === "string" && parsed.label ? parsed.label : fallback.label,
      category,
      accountId: acctId,
      date: todayISO(),
    };
  } catch {
    return fallback;
  }
}
