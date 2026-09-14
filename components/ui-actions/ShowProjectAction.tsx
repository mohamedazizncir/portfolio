import type { EnrichedAction } from "@/lib/actions/resolve";
import { AnswerGallery } from "@/components/chat/AnswerGallery";
import { InlineMarkdown } from "@/components/chat/InlineMarkdown";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { findSkillMark } from "@/components/skills/icons";

type Props = { action: Extract<EnrichedAction, { type: "SHOW_PROJECT" }> };

/**
 * Full project detail, resolved server-side from the project's own
 * knowledge/projects/<id>.md file (see lib/actions/resolve.ts) — the model
 * only ever supplies the id, never the content shown here.
 */
export function ShowProjectAction({ action }: Props) {
  const { projectDetail } = action;

  if (!projectDetail) {
    return (
      <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-5 py-4 text-base">
        <p className="font-mono text-sm uppercase tracking-wide text-accent">Project</p>
        <p className="mt-1 text-muted">
          Couldn&rsquo;t find a project matching &ldquo;{action.id}&rdquo;.
        </p>
      </div>
    );
  }

  const { title, body, tags, images } = projectDetail;
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
  // Only the tags that map to a recognisable technology logo — a tag like
  // "hackathon" or "finance" is real metadata but not a technology.
  const techTags = tags.filter((tag) => findSkillMark(tag));

  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-5 py-4 text-base">
      <p className="font-mono text-sm uppercase tracking-wide text-accent">Project</p>
      <h3 className="mt-1 text-lg font-semibold leading-snug text-foreground">{title}</h3>

      {techTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {techTags.map((tag) => (
            <SkillBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      <div className="mt-3 space-y-3 leading-relaxed text-muted">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-wrap">
            <InlineMarkdown text={paragraph} />
          </p>
        ))}
      </div>

      {images.length > 0 && <AnswerGallery images={images} label={title} />}
    </div>
  );
}
