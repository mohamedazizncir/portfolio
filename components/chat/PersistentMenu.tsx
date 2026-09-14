"use client";

import { useEffect, useRef, useState } from "react";
import { QUICK_LINKS } from "./questions";

interface Props {
  onSelect: (question: string) => void;
  disabled?: boolean;
  /**
   * True once the conversation has been scrolled away from the top. The
   * button is fixed-positioned directly over the top of the message
   * column, so once real content scrolls underneath it, it recedes to a
   * small, translucent state rather than sitting fully opaque on top of
   * whatever text happens to scroll into that corner. Hover or focus (or
   * opening the menu) always restores it to full strength, so it never
   * gets harder to actually use — only less visually intrusive while the
   * visitor is reading. Unused on the landing screen, where nothing
   * scrolls underneath it.
   */
  recede?: boolean;
}

/**
 * A small persistent icon, not a navbar. Opening it still routes through
 * onSelect (the same sendMessage() used for typed questions and suggested
 * chips), so there's one chat pipeline, not a separate content system.
 */
export function PersistentMenu({ onSelect, disabled, recede }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(question: string) {
    setOpen(false);
    onSelect(question);
  }

  return (
    <div ref={containerRef} className="fixed left-4 top-4 z-30">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="quick-links-menu"
        aria-label="Quick links: Projects, Skills, Contact"
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground backdrop-blur-sm transition-[color,border-color,opacity,transform] duration-200 ease-out hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
          recede && !open
            ? "scale-90 opacity-40 hover:scale-100 hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100"
            : "scale-100 opacity-100"
        }`}
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
          <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
        </svg>
      </button>

      <div
        id="quick-links-menu"
        inert={!open}
        className={`absolute left-0 top-full mt-2 w-44 origin-top-left overflow-hidden rounded-xl border border-border bg-surface shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-0.5 p-1">
          {QUICK_LINKS.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => handleSelect(item.question)}
                disabled={disabled}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
