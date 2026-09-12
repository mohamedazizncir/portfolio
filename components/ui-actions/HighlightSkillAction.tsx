import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "HIGHLIGHT_SKILL" }> };

export function HighlightSkillAction({ action }: Props) {
  return (
    <span className="inline-block rounded-full border border-accent/40 bg-surface px-3 py-1 text-sm text-foreground">
      {action.skill}
    </span>
  );
}
