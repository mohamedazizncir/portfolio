/**
 * No contact channel (email, GitHub, LinkedIn) exists in the knowledge
 * base yet, so this stays a plain notice rather than a fabricated link —
 * the same rule the images and skill logos follow: nothing shown here that
 * Aziz hasn't actually provided. Once a real contact method is added to
 * the knowledge base, this renders it the same way SHOW_PROJECT renders
 * project detail.
 */
export function ShowContactAction() {
  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-4 py-3 text-sm">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">
        Contact
      </p>
      <p className="mt-1 text-muted">
        Aziz hasn&rsquo;t added a public contact method here yet.
      </p>
    </div>
  );
}
