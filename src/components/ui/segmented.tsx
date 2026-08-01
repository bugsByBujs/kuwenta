"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-[var(--radius-pill)] bg-ceramic p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "press flex-1 rounded-[var(--radius-pill)] px-3 py-2 text-[1.3rem] font-semibold transition-colors",
            value === o.value ? "bg-accent text-white shadow-sm" : "text-ink-soft"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
