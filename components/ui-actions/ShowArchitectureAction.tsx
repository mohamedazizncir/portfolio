// Links to the real /architecture page (app/architecture/page.tsx).
export function ShowArchitectureAction() {
  return (
    <a
      href="/architecture"
      className="inline-block rounded-full border border-border bg-surface px-5 py-2.5 text-base text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      See how this works →
    </a>
  );
}
