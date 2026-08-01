import { Loader2 } from "lucide-react";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-ink-soft">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-[1.4rem]">{label}</span>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="rounded-[12px] border border-[var(--red)]/30 bg-[var(--red-tint)] p-4 text-[1.4rem] text-[var(--red)]">
      {msg}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-hairline bg-white/50 p-6 text-center text-[1.4rem] text-ink-soft">
      {children}
    </div>
  );
}
