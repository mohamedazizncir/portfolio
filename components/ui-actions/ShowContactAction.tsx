import type { EnrichedAction } from "@/lib/actions/resolve";

type Props = { action: Extract<EnrichedAction, { type: "SHOW_CONTACT" }> };

const LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none";

/**
 * The real contact channels from knowledge/contact.md, resolved
 * server-side (lib/actions/resolve.ts) — the model can trigger this card
 * but never supplies what's shown on it.
 */
export function ShowContactAction({ action }: Props) {
  const { email, github, linkedin } = action.contactDetail ?? {};
  const hasAny = email || github || linkedin;

  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-4 py-3 text-sm">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">Contact</p>

      {!hasAny && (
        <p className="mt-1 text-muted">Aziz hasn&rsquo;t added a public contact method here yet.</p>
      )}

      {hasAny && (
        <div className="mt-2 flex flex-wrap gap-2">
          {email && (
            <a href={`mailto:${email}`} className={LINK_CLASS}>
              Email →
            </a>
          )}
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              GitHub →
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              LinkedIn →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
