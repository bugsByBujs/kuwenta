"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ITEM = 36; // px per row

function Column({
  count,
  value,
  onChange,
  pad = true,
}: {
  count: number;
  value: number;
  onChange: (v: number) => void;
  pad?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = value * ITEM;
  }, [value]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM);
      const clamped = Math.max(0, Math.min(count - 1, idx));
      if (clamped !== value) onChange(clamped);
      el.scrollTo({ top: clamped * ITEM, behavior: "smooth" });
    }, 90);
  }

  return (
    <div className="relative h-[108px] flex-1 overflow-hidden">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll"
        style={{ paddingTop: ITEM, paddingBottom: ITEM }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex h-9 snap-center items-center justify-center text-[1.9rem] tabular transition-colors",
              i === value ? "font-semibold text-brand" : "text-ink-soft/50"
            )}
            onClick={() => onChange(i)}
          >
            {pad ? String(i).padStart(2, "0") : i}
          </div>
        ))}
      </div>
    </div>
  );
}

/** value/onChange are "HH:mm" strings. */
export function TimeWheel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":").map((n) => parseInt(n || "0", 10));
  const setH = (nh: number) => onChange(`${String(nh).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  const setM = (nm: number) => onChange(`${String(h).padStart(2, "0")}:${String(nm).padStart(2, "0")}`);

  return (
    <div className="relative rounded-[12px] border border-hairline bg-white">
      {/* selection band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-y border-accent/30 bg-green-light/30"
        style={{ height: ITEM }}
      />
      <div className="flex items-center px-6">
        <Column count={24} value={Math.min(h, 23)} onChange={setH} />
        <span className="px-1 text-[1.9rem] font-semibold text-ink-soft">:</span>
        <Column count={60} value={Math.min(m, 59)} onChange={setM} />
      </div>
    </div>
  );
}
