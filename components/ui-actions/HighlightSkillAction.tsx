import type { UIAction } from "@/lib/actions/schema";
import { SkillBadge } from "@/components/skills/SkillBadge";

type Props = { action: Extract<UIAction, { type: "HIGHLIGHT_SKILL" }> };

export function HighlightSkillAction({ action }: Props) {
  return <SkillBadge name={action.skill} />;
}
