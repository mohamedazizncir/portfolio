"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EnrichedAction } from "@/lib/actions/resolve";
import type { TimelineEntry } from "@/lib/actions/timeline";

type Props = { action: Extract<EnrichedAction, { type: "SHOW_TIMELINE" }> };

const KIND_LABEL: Record<TimelineEntry["kind"], string> = {
  education: "Education",
  experience: "Experience",
};

/**
 * A chronological view built from knowledge/education.md and
 * knowledge/experience.md's real dates (lib/actions/timeline.ts) — not a
 * hand-authored duplicate, so it can't drift from those files.
 */
export function ShowTimelineAction({ action }: Props) {
  const reduceMotion = useReducedMotion();
  const timeline = action.timeline;

  if (!timeline || (timeline.dated.length === 0 && timeline.undated.length === 0)) {
    return (
      <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-5 py-4 text-base">
        <p className="font-mono text-sm uppercase tracking-wide text-accent">Timeline</p>
        <p className="mt-1 text-muted">Nothing on file yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 text-base">
      <p className="font-mono text-sm uppercase tracking-wide text-accent">Timeline</p>

      <ol className="mt-3 flex flex-col gap-4 border-l border-border pl-4">
        {timeline.dated.map((entry, i) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.06, duration: reduceMotion ? 0 : 0.35 }}
            className="relative"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[1.09rem] top-2 h-2 w-2 rounded-full bg-accent"
            />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {entry.dateLabel && (
                <span className="font-mono text-sm text-accent">{entry.dateLabel}</span>
              )}
              <span className="font-mono text-xs uppercase tracking-wide text-muted">
                {KIND_LABEL[entry.kind]}
              </span>
            </div>
            <p className="mt-0.5 text-foreground">{entry.title}</p>
          </motion.li>
        ))}
      </ol>

      {timeline.undated.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">
            Also worth knowing
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {timeline.undated.map((entry) => (
              <li key={entry.id} className="text-muted">
                {entry.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
