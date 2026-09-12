import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "SHOW_PROJECTS" }> };

export function ShowProjectsAction({ action }: Props) {
  const { filters } = action;

  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-4 py-3 text-sm">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">
        Projects
      </p>
      {filters?.category && (
        <p className="mt-1 text-muted">Category: {filters.category}</p>
      )}
      {filters?.tech && <p className="mt-1 text-muted">Tech: {filters.tech}</p>}
      {!filters?.category && !filters?.tech && (
        <p className="mt-1 text-muted">Showing all projects.</p>
      )}
    </div>
  );
}
