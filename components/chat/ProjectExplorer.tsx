"use client";

import { createContext, useContext } from "react";
import type { ProjectEntry } from "@/lib/actions/resolve";
import { findSkillMark, SkillMarkIcon } from "@/components/skills/icons";
import type { SkillMark } from "@/components/skills/marks";

interface ProjectExplorerValue {
  projects: ProjectEntry[];
  /** Projects currently open in the panel, highlighted in any list. */
  activeIds: string[];
  openProject: (id: string) => void;
}

/**
 * Lets any card inside the details panel (the project browser itself, or a
 * filtered SHOW_PROJECTS card) open a project in place, without threading
 * callbacks through UIActionRenderer's fixed switch.
 */
export const ProjectExplorerContext = createContext<ProjectExplorerValue>({
  projects: [],
  activeIds: [],
  openProject: () => {},
});

export function useProjectExplorer() {
  return useContext(ProjectExplorerContext);
}

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/[-_\s]+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether a project matches a SHOW_PROJECTS filter term: one of its tags
 * (so "computer vision" matches the `computer-vision` tag, and "Spring"
 * matches `spring-boot` through the skill catalogue's aliases), or the term
 * appearing as a whole word in its own title or description (so "YOLOv8"
 * finds the football project, which names it in prose only).
 */
export function projectMatches(project: ProjectEntry, term?: string): boolean {
  if (!term) return true;
  const needle = normalise(term);
  if (!needle) return true;

  const needleMark = findSkillMark(term)?.name;
  const tagMatch = project.tags.some(
    (tag) =>
      normalise(tag) === needle ||
      (needleMark !== undefined && findSkillMark(normalise(tag))?.name === needleMark)
  );
  if (tagMatch) return true;

  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`);
  return pattern.test(normalise(`${project.title} ${project.body}`));
}

/** The body as one line of plain text, for a two-line preview. */
function previewText(body: string): string {
  return body
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tags that map to a recognisable technology logo, deduplicated. */
function techMarks(tags: string[]): SkillMark[] {
  const seen = new Set<string>();
  const marks: SkillMark[] = [];
  for (const tag of tags) {
    const mark = findSkillMark(normalise(tag));
    if (mark && !seen.has(mark.name)) {
      seen.add(mark.name);
      marks.push(mark);
    }
  }
  return marks;
}

interface ListProps {
  projects: ProjectEntry[];
}

export function ProjectList({ projects }: ListProps) {
  const { activeIds, openProject } = useProjectExplorer();

  return (
    <ul className="flex flex-col gap-2">
      {projects.map((project) => {
        const active = activeIds.includes(project.id);
        const marks = techMarks(project.tags);

        return (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => openProject(project.id)}
              aria-current={active ? "true" : undefined}
              className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-semibold leading-snug transition-colors motion-reduce:transition-none ${
                    active ? "text-accent" : "text-foreground group-hover:text-accent"
                  }`}
                >
                  {project.title}
                </span>
                <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                  {previewText(project.body)}
                </span>
                {(marks.length > 0 || project.images.length > 0) && (
                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
                    {marks.map((mark) => (
                      <span key={mark.name} className="inline-flex items-center gap-1.5">
                        <SkillMarkIcon mark={mark} className="h-3.5 w-3.5 shrink-0" />
                        {mark.name}
                      </span>
                    ))}
                    {project.images.length > 0 && (
                      <span>
                        {project.images.length} {project.images.length === 1 ? "image" : "images"}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                className={`mt-0.5 h-5 w-5 shrink-0 transition-[color,transform] duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 ${
                  active ? "text-accent" : "text-muted group-hover:text-accent"
                }`}
                aria-hidden="true"
              >
                <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
