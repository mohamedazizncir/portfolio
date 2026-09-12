"use client";

import { useEffect } from "react";
import type { UIAction } from "@/lib/actions/schema";
import { UIActionRenderer } from "@/components/ui-actions";

interface Props {
  actions: UIAction[];
  open: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * One panel, two shapes: a full-width section that grows up from the
 * bottom on mobile (a real bottom sheet, not a squeezed sidebar), and a
 * fixed-width column docked to the right on desktop (md:+). Both driven by
 * the same open/close state and content.
 */
export function ActionPanel({ actions, open, onClose, className }: Props) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <aside
      aria-label="Structured content"
      inert={!open}
      className={`overflow-hidden border-border bg-background transition-all duration-300 ease-out motion-reduce:transition-none border-t md:border-t-0 md:border-l ${
        open
          ? "max-h-[45vh] opacity-100 md:max-h-none md:w-80"
          : "max-h-0 opacity-0 md:w-0 md:opacity-0"
      } ${className ?? ""}`}
    >
      <div className="flex h-full flex-col md:w-80">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
            Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details panel"
            className="rounded-md p-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {actions.map((action, i) => (
            <UIActionRenderer key={i} action={action} />
          ))}
        </div>
      </div>
    </aside>
  );
}
