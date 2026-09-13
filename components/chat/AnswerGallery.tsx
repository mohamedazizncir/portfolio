"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  /** Filled in as the answer streams, used only to label the gallery. */
  label?: string;
}

/**
 * Images that belong to an answer, shown inline underneath it rather than
 * behind a click in the details panel. Cards stagger in as the response
 * streams; selecting one opens a lightbox.
 *
 * Every path here was resolved server-side from knowledge-file frontmatter
 * (see lib/rag/images.ts) — the model never supplies one — so these are
 * always same-origin paths under public/.
 */
export function AnswerGallery({ images, label }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  if (images.length === 0) return null;

  const single = images.length === 1;

  return (
    <>
      <ul
        aria-label={label ? `Images for ${label}` : "Images for this answer"}
        className={`mt-3 grid w-full gap-2 ${
          single ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {images.map((src, i) => (
          <li key={src} className="min-w-0">
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current[i] = node;
              }}
              onClick={() => setOpenIndex(i)}
              aria-label={`Open image ${i + 1} of ${images.length}`}
              style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
              className="gallery-card-in group relative block w-full overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
            >
              <span
                className={`relative block w-full ${single ? "aspect-[16/10]" : "aspect-[4/3]"}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${openIndex + 1} of ${images.length}`}
          onClick={close}
          className="lightbox-in fixed inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm"
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
            <Image
              key={images[openIndex]}
              src={images[openIndex]}
              alt=""
              fill
              sizes="100vw"
              className="lightbox-figure-in object-contain"
              priority
            />
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
                ‹ Prev
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="rounded-full border border-border bg-surface px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
