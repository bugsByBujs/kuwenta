import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "green" | "gold" | "red" | "amber" | "neutral" | "house";

const tones: Record<Tone, string> = {
  green: "bg-green-light text-brand",
  gold: "bg-gold-lightest text-gold border border-gold-light",
  red: "bg-[var(--red-tint)] text-[var(--red)]",
  amber: "bg-[#fdf3d6] text-[#8a6d0b]",
  neutral: "bg-ceramic text-ink-soft",
  house: "bg-house text-white",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[1.1rem] font-semibold uppercase tracking-[0.06em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
