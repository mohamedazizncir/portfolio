import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "OPEN_GITHUB" }> };

// The URL here has already passed the ALLOWED_GITHUB_URLS allowlist check
// server-side (see lib/actions/schema.ts) before this component ever renders.
export function OpenGithubAction({ action }: Props) {
  return (
    <a
      href={action.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      Open on GitHub →
    </a>
  );
}
