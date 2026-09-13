import { findSkillMark, SkillMarkIcon } from "./icons";

interface Props {
  name: string;
  /** "chip" for inline use, "tile" for the landing-page belt. */
  variant?: "chip" | "tile";
}

/**
 * A technology with its own logo. Falls back to a plain text chip when the
 * name isn't in the catalogue, so an unrecognised HIGHLIGHT_SKILL still
 * renders something honest rather than the wrong logo.
 */
export function SkillBadge({ name, variant = "chip" }: Props) {
  const mark = findSkillMark(name);
  const label = mark?.name ?? name;

  if (variant === "tile") {
    return (
      <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border bg-surface/80 px-4 py-2.5">
        {mark && <SkillMarkIcon mark={mark} className="h-5 w-5 shrink-0" />}
        <span className="whitespace-nowrap font-mono text-sm text-foreground">{label}</span>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground">
      {mark && <SkillMarkIcon mark={mark} className="h-4 w-4 shrink-0" />}
      {label}
    </span>
  );
}
