"use client";

import { peso, round2 } from "@/lib/money";
import type { CutoffBudget, Settings } from "@/lib/schemas";

/** Cumulative Emergency Fund growth over committed cutoffs. */
export function EFSparkline({
  cutoffs,
  budget,
}: {
  cutoffs: CutoffBudget[];
  budget: Settings["budget"];
}) {
  const committed = cutoffs
    .filter((c) => c.committed)
    .slice()
    .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived));

  let running = 0;
  const points = committed.map((c) => {
    running = round2(running + c.netPay * budget.efPercent);
    return running;
  });

  const total = points.at(-1) ?? 0;

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[1.3rem] text-ink-soft">Emergency Fund so far</span>
        <span className="tabular text-[1.6rem] font-semibold text-gold">{peso(total)}</span>
      </div>
    );
  }

  const w = 260;
  const h = 48;
  const max = Math.max(...points);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * (h - 6) - 3]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[1.3rem] text-ink-soft">Emergency Fund growth</span>
        <span className="tabular text-[1.6rem] font-semibold text-gold">{peso(total)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" height={48}>
        <path d={area} fill="var(--gold)" opacity={0.12} />
        <path d={line} fill="none" stroke="var(--gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
