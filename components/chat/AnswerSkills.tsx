"use client";

import { motion, useReducedMotion } from "framer-motion";
import { findSkillMark, SkillMarkIcon } from "@/components/skills/icons";

interface Props {
  skills: string[];
}

/**
 * The technologies an answer actually mentioned, shown as logo badges under
 * the prose. The list is detected server-side from the retrieved knowledge
 * chunks (lib/skills/catalogue.ts), never from what the model wrote, so a
 * logo can only appear for a technology Aziz has written down himself.
 *
 * Badges slide in from the left in sequence, the mirror of the gallery
 * sliding in from the right, so an answer with both reads as one movement
 * opening outwards rather than two competing animations.
 */
export function AnswerSkills({ skills }: Props) {
  const reduceMotion = useReducedMotion();

  if (skills.length === 0) return null;

  return (
    <ul aria-label="Technologies mentioned" className="mt-3 flex flex-wrap gap-2">
      {skills.map((name, i) => {
        const mark = findSkillMark(name);

        return (
          <motion.li
            key={name}
            initial={{ opacity: 0, x: reduceMotion ? 0 : -18, scale: reduceMotion ? 1 : 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: Math.min(i, 10) * 0.055,
              duration: reduceMotion ? 0 : 0.42,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 transition-colors duration-200 hover:border-accent motion-reduce:transition-none"
          >
            {mark && <SkillMarkIcon mark={mark} className="h-5 w-5 shrink-0" />}
            <span className="font-mono text-sm text-foreground">{mark?.name ?? name}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}
