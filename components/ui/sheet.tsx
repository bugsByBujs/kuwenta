"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-[fade_.2s_ease]" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col rounded-t-[20px] bg-[var(--surface-page)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)]",
            "data-[state=open]:animate-[sheetin_.36s_cubic-bezier(0.16,1,0.3,1)]"
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-black/15" aria-hidden />
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <Dialog.Title className="text-[1.9rem] font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Close className="press grid h-9 w-9 place-items-center rounded-full bg-ceramic text-ink">
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-2">{children}</div>
          {footer && <div className="border-t border-hairline bg-white/60 px-4 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
