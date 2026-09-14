import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { parseFrontmatter } from "@/lib/rag/chunk";

/**
 * Fixed allowlist for OPEN_GITHUB. The model can never supply an arbitrary
 * URL — only entries listed here are ever allowed through, matching
 * knowledge/contact.md, the only place this URL is ever shown to the model.
 */
export const ALLOWED_GITHUB_URLS: readonly string[] = [
  "https://github.com/mohamedazizncir",
];

const showProjectsActionSchema = z
  .object({
    type: z.literal("SHOW_PROJECTS"),
    filters: z
      .object({
        category: z.string().min(1).max(100).optional(),
        tech: z.string().min(1).max(100).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const showProjectActionSchema = z
  .object({
    type: z.literal("SHOW_PROJECT"),
    id: z.string().min(1).max(200),
  })
  .strict();

const highlightSkillActionSchema = z
  .object({
    type: z.literal("HIGHLIGHT_SKILL"),
    skill: z.string().min(1).max(100),
  })
  .strict();

const showExperienceActionSchema = z
  .object({ type: z.literal("SHOW_EXPERIENCE") })
  .strict();

const showTimelineActionSchema = z
  .object({ type: z.literal("SHOW_TIMELINE") })
  .strict();

const openGithubActionSchema = z
  .object({
    type: z.literal("OPEN_GITHUB"),
    url: z.string().url(),
  })
  .strict();

const showContactActionSchema = z
  .object({ type: z.literal("SHOW_CONTACT") })
  .strict();

const showArchitectureActionSchema = z
  .object({ type: z.literal("SHOW_ARCHITECTURE") })
  .strict();

/** The eight UI actions from ARCHITECTURE.md section 7, and nothing else. */
export const uiActionSchema = z.discriminatedUnion("type", [
  showProjectsActionSchema,
  showProjectActionSchema,
  highlightSkillActionSchema,
  showExperienceActionSchema,
  showTimelineActionSchema,
  openGithubActionSchema,
  showContactActionSchema,
  showArchitectureActionSchema,
]);

export type UIAction = z.infer<typeof uiActionSchema>;

/** The model-facing response contract: one answer plus an optional actions array. */
export const modelOutputSchema = z.object({
  answer: z.string(),
  actions: z.array(z.unknown()).optional(),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

let cachedProjectIds: Set<string> | null = null;

/** Reads knowledge/projects/*.md frontmatter so SHOW_PROJECT can reject unknown ids. */
export async function getValidProjectIds(): Promise<Set<string>> {
  if (cachedProjectIds) return cachedProjectIds;

  const projectsDir = path.join(process.cwd(), "knowledge", "projects");
  const ids = new Set<string>();

  let files: string[] = [];
  try {
    files = await readdir(projectsDir);
  } catch {
    cachedProjectIds = ids;
    return ids;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(path.join(projectsDir, file), "utf-8");
    const { metadata } = parseFrontmatter(raw);
    if (metadata.id) ids.add(metadata.id);
  }

  cachedProjectIds = ids;
  return ids;
}

/**
 * Validates one candidate action. Returns null for anything that doesn't
 * match the schema, references an unknown project, or points OPEN_GITHUB at
 * a URL outside the fixed allowlist — the caller drops nulls silently.
 */
async function validateAction(
  candidate: unknown,
  validProjectIds: Set<string>
): Promise<UIAction | null> {
  const result = uiActionSchema.safeParse(candidate);
  if (!result.success) return null;

  const action = result.data;

  if (action.type === "SHOW_PROJECT" && !validProjectIds.has(action.id)) {
    return null;
  }

  if (action.type === "OPEN_GITHUB" && !ALLOWED_GITHUB_URLS.includes(action.url)) {
    return null;
  }

  return action;
}

/**
 * Validates a raw, untrusted array of candidate actions from the model.
 * Invalid or unknown entries are dropped; valid ones are kept, in order.
 */
export async function validateActions(raw: unknown): Promise<UIAction[]> {
  if (!Array.isArray(raw)) return [];

  const validProjectIds = await getValidProjectIds();
  const validated = await Promise.all(
    raw.map((candidate) => validateAction(candidate, validProjectIds))
  );

  return validated.filter((action): action is UIAction => action !== null);
}
