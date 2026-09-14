import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, parseFrontmatter } from "@/lib/rag/chunk";
import type { UIAction } from "./schema";
import { buildTimeline, loadExperienceEntries, type Timeline, type TimelineEntry } from "./timeline";
import { loadContactDetail, type ContactDetail } from "./contact";

export interface ProjectDetail {
  title: string;
  body: string;
  tags: string[];
  images: string[];
}

/**
 * Extra, richer data attached to a validated action before it reaches the
 * client — never supplied by the model, always resolved server-side from
 * the same knowledge files the model was given as context. This is the
 * same trust boundary as lib/rag/images.ts: the model can cause an action
 * to be emitted (e.g. SHOW_PROJECT with a real id), but it can never
 * control what detail gets attached to it.
 */
export type EnrichedAction = UIAction & {
  projectDetail?: ProjectDetail;
  experienceEntries?: TimelineEntry[];
  timeline?: Timeline;
  contactDetail?: ContactDetail;
};

function stripHeadingPrefix(content: string): string {
  return content.replace(/^##[^\n]*\n+/, "").trim();
}

let projectDetailCache: Map<string, ProjectDetail | null> | null = null;

async function loadAllProjectDetails(): Promise<Map<string, ProjectDetail | null>> {
  if (projectDetailCache) return projectDetailCache;

  const projectsDir = path.join(process.cwd(), "knowledge", "projects");
  const map = new Map<string, ProjectDetail | null>();

  let files: string[] = [];
  try {
    files = await readdir(projectsDir);
  } catch {
    projectDetailCache = map;
    return map;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(path.join(projectsDir, file), "utf-8");
    const { metadata } = parseFrontmatter(raw);
    if (!metadata.id) continue;

    const chunks = chunkMarkdown(`knowledge/projects/${file}`, raw);
    const chunk = chunks[0];
    if (!chunk) continue;

    map.set(metadata.id, {
      title: chunk.heading,
      body: stripHeadingPrefix(chunk.content),
      tags: metadata.tags ?? [],
      images: chunk.images ?? [],
    });
  }

  projectDetailCache = map;
  return map;
}

async function loadProjectDetail(id: string): Promise<ProjectDetail | null> {
  const map = await loadAllProjectDetails();
  return map.get(id) ?? null;
}

/**
 * Attaches real content to each validated action so the UI can render more
 * than a placeholder: the project's own description and images for
 * SHOW_PROJECT, every real entry for SHOW_EXPERIENCE, a chronological view
 * of education plus experience for SHOW_TIMELINE, and the real email,
 * GitHub and LinkedIn for SHOW_CONTACT (knowledge/contact.md via
 * lib/actions/contact.ts). Actions without extra detail (HIGHLIGHT_SKILL,
 * OPEN_GITHUB, SHOW_ARCHITECTURE, SHOW_PROJECTS) pass through unchanged.
 */
export async function enrichActions(actions: UIAction[]): Promise<EnrichedAction[]> {
  return Promise.all(
    actions.map(async (action): Promise<EnrichedAction> => {
      if (action.type === "SHOW_PROJECT") {
        const detail = await loadProjectDetail(action.id);
        return detail ? { ...action, projectDetail: detail } : action;
      }
      if (action.type === "SHOW_EXPERIENCE") {
        return { ...action, experienceEntries: await loadExperienceEntries() };
      }
      if (action.type === "SHOW_TIMELINE") {
        return { ...action, timeline: await buildTimeline() };
      }
      if (action.type === "SHOW_CONTACT") {
        return { ...action, contactDetail: await loadContactDetail() };
      }
      return action;
    })
  );
}
