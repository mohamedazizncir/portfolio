import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "SHOW_PROJECT" }> };

export function ShowProjectAction({ action }: Props) {
  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-4 py-3 text-sm">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">
        Project: {action.id}
      </p>
      <p className="mt-1 text-muted">
        Full project details ship in a later phase.
      </p>
    </div>
  );
}
