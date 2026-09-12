import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "HIGHLIGHT_SKILL" }> };

export function HighlightSkillAction({ action }: Props) {
  return (
    <span className="inline-block rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-100">
      {action.skill}
    </span>
  );
}
