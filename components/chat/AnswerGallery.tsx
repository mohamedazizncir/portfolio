"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  /** Used only to label the gallery for assistive technology. */
  label?: string;
}

/**
 * Images that belong to an answer, shown inline underneath it rather than
 * behind a click in the details panel.
 *
 * The strip is a horizontal snap carousel: cards slide in from the right
 * one after another as the answer streams, then stay scrollable by drag,
 * wheel, arrow buttons, or Tab. Selecting one opens a lightbox.
 *
 * Every path here was resolved server-side from knowledge-file frontmatter
 * (see lib/rag/images.ts) — the model never supplies one — so these are
 * always same-origin paths under public/.
 */
export function AnswerGallery({ images, label }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();

  const isOpen = openIndex !== null;

  const close = useCallback(() => {
    setOpenIndex((current) => {
      if (current !== null) triggerRefs.current[current]?.focus();
      return null;
    });
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? current : (current + delta + images.length) % images.length
      );
    },
    [images.length]
  );

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, step]);

  // Show an arrow only on the side that actually has more to reveal.
  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setOverflow({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, images.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const amount = (card?.clientWidth ?? 280) + 12;
    el.scrollBy({ left: direction * amount, behavior: reduceMotion ? "auto" : "smooth" });
  }

  if (images.length === 0) return null;

  return (
    <>
      <div className="relative mt-4 w-full min-w-0">
        <ul
          ref={scrollerRef}
          onScroll={measure}
          aria-label={label ? `Images for ${label}` : "Images for this answer"}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1"
        >
          {images.map((src, i) => (
            <motion.li
              key={src}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 56, scale: reduceMotion ? 1 : 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: Math.min(i, 8) * 0.09,
                duration: reduceMotion ? 0 : 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-[260px] shrink-0 snap-start sm:w-[340px]"
            >
              <button
                type="button"
                ref={(node) => {
                  triggerRefs.current[i] = node;
                }}
                onClick={() => setOpenIndex(i)}
                aria-label={`Open image ${i + 1} of ${images.length}`}
                className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-200 hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
              >
                <span className="relative block aspect-[4/3] w-full">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 260px, 340px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                />
              </button>
            </motion.li>
          ))}
        </ul>

        {(["left", "right"] as const).map((side) =>
          overflow[side] ? (
            <button
              key={side}
              type="button"
              tabIndex={-1}
              onClick={() => scrollByCard(side === "left" ? -1 : 1)}
              aria-hidden="true"
              className={`absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-muted backdrop-blur transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none sm:flex ${
                side === "left" ? "left-1" : "right-1"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                className="h-4 w-4"
              >
                <path
                  d={side === "left" ? "M12 4L6 10l6 6" : "M8 4l6 6-6 6"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${openIndex + 1} of ${images.length}`}
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm"
          >
            <div className="flex shrink-0 items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wide text-muted">
                {openIndex + 1} / {images.length}
              </p>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={close}
                aria-label="Close image viewer"
                className="rounded-md p-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex min-h-0 flex-1 items-center justify-center py-3"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={images[openIndex]}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : -32 }}
                  transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[openIndex]}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </motion.span>
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex shrink-0 items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="rounded-full border border-border bg-surface px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
                >
                  &lsaquo; Prev
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="rounded-full border border-border bg-surface px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
                >
                  Next &rsaquo;
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
