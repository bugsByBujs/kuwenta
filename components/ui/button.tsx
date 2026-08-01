"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "press inline-flex items-center justify-center gap-2 font-semibold select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white",
        dark: "bg-house text-white",
        secondary: "bg-card text-accent border border-accent",
        ghost: "bg-transparent text-accent",
        danger: "bg-[var(--red)] text-white",
        subtle: "bg-ceramic text-ink",
      },
      size: {
        pill: "rounded-[var(--radius-pill)] h-11 px-5 text-[1.5rem]",
        sm: "rounded-[var(--radius-pill)] h-9 px-4 text-[1.3rem]",
        block: "rounded-[var(--radius-pill)] h-12 px-6 text-[1.6rem] w-full",
        icon: "rounded-full h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "pill" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";
