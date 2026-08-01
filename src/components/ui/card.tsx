import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-4", className)} {...props} />;
}

export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[1.2rem] font-bold uppercase tracking-[0.1em] text-ink-soft", className)}
      {...props}
    />
  );
}

export function Stat({
  label,
  value,
  tone = "ink",
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "ink" | "accent" | "danger" | "on-dark";
  className?: string;
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "danger"
        ? "text-[var(--red)]"
        : tone === "on-dark"
          ? "text-white"
          : "text-ink";
  return (
    <div className={className}>
      <div className="text-[1.2rem] text-ink-soft">{label}</div>
      <div className={cn("tabular text-[2.4rem] font-semibold leading-tight", toneClass)}>
        {value}
      </div>
    </div>
  );
}
