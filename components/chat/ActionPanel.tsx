"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { EnrichedAction, ProjectEntry } from "@/lib/actions/resolve";
import { UIActionRenderer } from "@/components/ui-actions";
import { ShowProjectAction } from "@/components/ui-actions/ShowProjectAction";
import { ProjectExplorerContext, ProjectList } from "@/components/chat/ProjectExplorer";

interface Props {
  actions: EnrichedAction[];
  projects: ProjectEntry[];
  /** A project picked from the browser, shown in place of the answer's cards. */
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAsk: (question: string) => void;
  askDisabled?: boolean;
  open: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * One panel, two shapes: a full-width section that grows up from the
 * bottom on mobile (a real bottom sheet, not a squeezed sidebar), and a
 * column docked to the right on desktop (md:+) that widens with the
 * viewport. Both driven by the same open/close state and content.
 *
 * The top holds whatever the latest answer attached, or a project the
 * visitor opened from the browser underneath; the browser lists every
 * project in the knowledge base so any of them is one click away, without
 * spending a chat request.
 */
export function ActionPanel({
  actions,
  projects,
  selectedProjectId,
  onSelectProject,
  onAsk,
  askDisabled,
  open,
  onClose,
  className,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Opening a project, or a new answer arriving, replaces the top of the
  // panel — bring it into view instead of leaving the visitor down the list.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [selectedProjectId, actions, reduceMotion]);

  const selected = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId)
    : undefined;

  // An unfiltered SHOW_PROJECTS card would only repeat the full list that
  // already sits at the bottom of the panel.
  const answerActions = actions.filter(
    (action) =>
      !(action.type === "SHOW_PROJECTS" && !action.filters?.category && !action.filters?.tech)
  );

  const explorer = useMemo(
    () => ({
      projects,
      activeIds: selected
        ? [selected.id]
        : actions.flatMap((action) => (action.type === "SHOW_PROJECT" ? [action.id] : [])),
      openProject: (id: string) => onSelectProject(id),
    }),
    [projects, selected, actions, onSelectProject]
  );

  const hasTopContent = Boolean(selected) || answerActions.length > 0;

  return (
    <aside
      aria-label="Structured content"
      inert={!open}
      className={`overflow-hidden border-border bg-background transition-all duration-300 ease-out motion-reduce:transition-none border-t md:border-t-0 md:border-l ${
        open
          ? "max-h-[60vh] opacity-100 md:max-h-none md:w-80 lg:w-104 xl:w-lg 2xl:w-xl"
          : "max-h-0 opacity-0 md:w-0 md:opacity-0"
      } ${className ?? ""}`}
    >
      <ProjectExplorerContext.Provider value={explorer}>
        {/* max-h-[inherit] carries the bottom sheet's height cap down to this
            column, so on mobile the list below scrolls instead of being
            clipped by the aside's overflow-hidden. */}
        <div className="flex h-full max-h-[inherit] flex-col md:w-80 lg:w-104 xl:w-lg 2xl:w-xl">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-mono text-sm uppercase tracking-wide text-muted">Details</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details panel"
              className="rounded-md p-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
          >
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelectProject(null)}
                  className="self-start rounded-full px-1 font-mono text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
                >
                  &larr; {answerActions.length > 0 ? "Back to the answer" : "All projects"}
                </button>
                <ShowProjectAction
                  action={{ type: "SHOW_PROJECT", id: selected.id, projectDetail: selected }}
                />
                <button
                  type="button"
                  onClick={() => onAsk(`Tell me about ${selected.title}`)}
                  disabled={askDisabled}
                  className="self-start rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                  Ask about this project &rarr;
                </button>
              </>
            ) : (
              answerActions.map((action, i) => <UIActionRenderer key={i} action={action} />)
            )}

            {projects.length > 0 && (
              <section
                aria-labelledby={headingId}
                className={hasTopContent ? "mt-3 border-t border-border pt-5" : ""}
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3
                    id={headingId}
                    className="font-mono text-sm uppercase tracking-wide text-accent"
                  >
                    All projects
                  </h3>
                  <span className="font-mono text-sm text-muted">{projects.length}</span>
                </div>
                <ProjectList projects={projects} />
              </section>
            )}
          </div>
        </div>
      </ProjectExplorerContext.Provider>
    </aside>
  );
}
