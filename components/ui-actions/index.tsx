import type { EnrichedAction } from "@/lib/actions/resolve";
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
 * against lib/actions/schema.ts, and any extra detail (project content,
 * experience entries, timeline) was resolved server-side too, never
 * supplied by the model — see lib/actions/resolve.ts.
 */
export function UIActionRenderer({ action }: { action: EnrichedAction }) {
  switch (action.type) {
    case "SHOW_PROJECTS":
      return <ShowProjectsAction action={action} />;
    case "SHOW_PROJECT":
      return <ShowProjectAction action={action} />;
    case "HIGHLIGHT_SKILL":
      return <HighlightSkillAction action={action} />;
    case "SHOW_EXPERIENCE":
      return <ShowExperienceAction action={action} />;
    case "SHOW_TIMELINE":
      return <ShowTimelineAction action={action} />;
    case "OPEN_GITHUB":
      return <OpenGithubAction action={action} />;
    case "SHOW_CONTACT":
      return <ShowContactAction action={action} />;
    case "SHOW_ARCHITECTURE":
      return <ShowArchitectureAction />;
  }
}
