import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full h-12 rounded-[var(--radius-input)] border border-input-border bg-white px-3 text-[1.6rem] text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-ink-soft";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-[1.2rem] font-semibold uppercase tracking-[0.08em] text-ink-soft", className)}
      {...props}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(base, className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "h-auto min-h-20 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(base, "appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-9", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23006241' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldRow({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}
