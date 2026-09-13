import { SKILL_CATALOGUE } from "@/lib/skills/catalogue";
import { SKILL_MARKS, type SkillMark } from "./marks";

const BY_KEY = new Map<string, SkillMark>();
for (const skill of SKILL_CATALOGUE) {
  const mark = SKILL_MARKS[skill.name];
  if (!mark) continue;
  BY_KEY.set(skill.name.toLowerCase(), mark);
  for (const alias of skill.aliases ?? []) BY_KEY.set(alias.toLowerCase(), mark);
}

/**
 * Resolves a free-text skill name to its brand mark. Returns undefined for
 * anything unrecognised — including the category headings the model
 * sometimes puts in HIGHLIGHT_SKILL, like "Backend and systems" — so the
 * caller can fall back to a plain text chip rather than show a wrong logo.
 */
export function findSkillMark(name: string): SkillMark | undefined {
  return BY_KEY.get(name.trim().toLowerCase());
}

/** Catalogue order, for the landing-page belt. */
export const ALL_SKILL_MARKS: readonly SkillMark[] = SKILL_CATALOGUE.map(
  (skill) => SKILL_MARKS[skill.name]
).filter(Boolean);

interface Props {
  mark: SkillMark;
  className?: string;
}

/** Decorative by definition: the readable label always sits next to it. */
export function SkillMarkIcon({ mark, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      style={{ color: mark.color }}
      className={className}
    >
      <path d={mark.path} />
    </svg>
  );
}
