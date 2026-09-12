import type { UIAction } from "@/lib/actions/schema";
import { ShowProjectsAction } from "./ShowProjectsAction";
import { ShowProjectAction } from "./ShowProjectAction";
import { HighlightSkillAction } from "./HighlightSkillAction";
import { ShowExperienceAction } from "./ShowExperienceAction";
import { ShowTimelineAction } from "./ShowTimelineAction";
import { OpenGithubAction } from "./OpenGithubAction";
import { ShowContactAction } from "./ShowContactAction";
import { ShowArchitectureAction } from "./ShowArchitectureAction";

/**
 * Fixed switch over action.type — no eval, no dynamic component lookup.
 * Every action reaching this point has already been validated server-side
 * against lib/actions/schema.ts.
 */
export function UIActionRenderer({ action }: { action: UIAction }) {
  switch (action.type) {
    case "SHOW_PROJECTS":
      return <ShowProjectsAction action={action} />;
    case "SHOW_PROJECT":
      return <ShowProjectAction action={action} />;
    case "HIGHLIGHT_SKILL":
      return <HighlightSkillAction action={action} />;
    case "SHOW_EXPERIENCE":
      return <ShowExperienceAction />;
    case "SHOW_TIMELINE":
      return <ShowTimelineAction />;
    case "OPEN_GITHUB":
      return <OpenGithubAction action={action} />;
    case "SHOW_CONTACT":
      return <ShowContactAction />;
    case "SHOW_ARCHITECTURE":
      return <ShowArchitectureAction />;
  }
}
