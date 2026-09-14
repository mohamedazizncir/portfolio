"use client";

import type { UIAction } from "@/lib/actions/schema";
import { ProjectList, projectMatches, useProjectExplorer } from "@/components/chat/ProjectExplorer";

type Props = { action: Extract<UIAction, { type: "SHOW_PROJECTS" }> };

/**
 * The projects matching the model's filter, drawn from the real project
 * catalogue the panel already holds (see ProjectExplorer) — the model only
 * supplies the filter terms, never which projects exist. Each one opens in
 * place in the panel.
 */
export function ShowProjectsAction({ action }: Props) {
  const { projects } = useProjectExplorer();
  const { category, tech } = action.filters ?? {};
  const matches = projects.filter(
    (project) => projectMatches(project, category) && projectMatches(project, tech)
  );
  const filterLabel = [category, tech].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-5 py-4 text-base">
      <p className="font-mono text-sm uppercase tracking-wide text-accent">Projects</p>
      <p className="mt-1 text-muted">{filterLabel || "Showing all projects."}</p>

      {matches.length === 0 ? (
        <p className="mt-2 text-muted">No project on file matches that yet.</p>
      ) : (
        <div className="mt-3">
          <ProjectList projects={matches} />
        </div>
      )}
    </div>
  );
}
