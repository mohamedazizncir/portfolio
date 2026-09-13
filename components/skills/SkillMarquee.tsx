"use client";

import { ALL_SKILL_MARKS } from "./icons";
import { SkillBadge } from "./SkillBadge";

/**
 * Two identical tracks scrolling left as one continuous loop: when the
 * first has travelled exactly its own width, the second sits where it
 * started, so the seam is invisible and the belt never resets visibly.
 *
 * The whole thing is aria-hidden and paired with a visually hidden list,
 * because a screen reader should get the skills once, in order, not an
 * endlessly duplicated ticker. It pauses on hover and on keyboard focus
 * anywhere inside the page region, and prefers-reduced-motion stops it
 * outright via the global rule in globals.css.
 */
export function SkillMarquee() {
  const track = [...ALL_SKILL_MARKS];

  return (
    <div className="relative w-full">
      {/* Soft edges so tiles fade out instead of being cut off mid-logo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-20"
      />

      <div className="marquee group flex w-full overflow-hidden" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="marquee-track flex shrink-0 items-center gap-3 pr-3">
            {track.map((skill) => (
              <SkillBadge key={`${copy}-${skill.name}`} name={skill.name} variant="tile" />
            ))}
          </div>
        ))}
      </div>

      <ul className="sr-only">
        {ALL_SKILL_MARKS.map((skill) => (
          <li key={skill.name}>{skill.name}</li>
        ))}
      </ul>
    </div>
  );
}
