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
      className="inline-block rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:border-neutral-500"
    >
      Open on GitHub →
    </a>
  );
}
