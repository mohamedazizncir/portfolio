import { readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown } from "@/lib/rag/chunk";

/**
 * Real dates and descriptions pulled directly from knowledge/education.md
 * and knowledge/experience.md, for SHOW_EXPERIENCE and SHOW_TIMELINE.
 *
 * Nothing here is authored separately from those files — it's the same
 * text, re-parsed for a specific layout, so it can never drift out of sync
 * with the knowledge base the way a hand-duplicated timeline could.
 */
export interface TimelineEntry {
  id: string;
  title: string;
  dateLabel: string | null;
  sortKey: number | null;
  kind: "education" | "experience";
  body: string;
  images: string[];
}

const MONTH_NUMBERS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/**
 * Extracts a date or date range from a short piece of text, in whichever
 * of the three formats the knowledge files actually use: "MM/YYYY to
 * MM/YYYY" or "YYYY to YYYY" (experience.md headings, sometimes wrapped in
 * parens), "since Month YYYY" (the ENIT education bullet), or a bare year
 * (the Bac Maths bullet). Tried in that order since a range is the most
 * specific match available.
 */
function extractDate(text: string): { label: string; sortKey: number } | null {
  const range = text.match(/(\d{1,2}\/\d{4}|\d{4})\s+to\s+(\d{1,2}\/\d{4}|\d{4})/);
  if (range) {
    const [full, start] = range;
    const [startMonth, startYear] = start.includes("/") ? start.split("/") : [null, start];
    const sortKey = Number(startYear) * 12 + (startMonth ? Number(startMonth) : 1);
    return { label: full.replace(/\s+to\s+/, " – "), sortKey };
  }

  const since = text.match(/since\s+([A-Za-z]+)\s+(\d{4})/i);
  if (since) {
    const month = MONTH_NUMBERS[since[1].toLowerCase()];
    const sortKey = Number(since[2]) * 12 + (month ?? 1);
    const monthLabel = since[1][0].toUpperCase() + since[1].slice(1).toLowerCase();
    return { label: `Since ${monthLabel} ${since[2]}`, sortKey };
  }

  const yearOnly = text.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) {
    return { label: yearOnly[0], sortKey: Number(yearOnly[0]) * 12 + 1 };
  }

  return null;
}

async function loadChunks(relativePath: string) {
  const fullPath = path.join(process.cwd(), ...relativePath.split("/"));
  const raw = await readFile(fullPath, "utf-8");
  return chunkMarkdown(relativePath, raw);
}

/** Drops the synthesized "## Heading\n\n" prefix chunkMarkdown adds to every section. */
function stripHeadingPrefix(content: string): string {
  return content.replace(/^##[^\n]*\n+/, "").trim();
}

/**
 * Experience entries in the order knowledge/experience.md authors them.
 * The "[Note: not included]" section is an editorial aside about
 * in-progress applications, not a real entry, and is filtered out.
 */
export async function loadExperienceEntries(): Promise<TimelineEntry[]> {
  const chunks = await loadChunks("knowledge/experience.md");

  return chunks
    .filter((chunk) => !chunk.heading.startsWith("[Note"))
    .map((chunk) => {
      const trailingParen = chunk.heading.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      const title = trailingParen ? trailingParen[1].trim() : chunk.heading;
      const dateSource = trailingParen ? trailingParen[2] : chunk.heading;
      const date = extractDate(dateSource);

      return {
        id: chunk.id,
        title,
        dateLabel: date?.label ?? null,
        sortKey: date?.sortKey ?? null,
        kind: "experience" as const,
        body: stripHeadingPrefix(chunk.content),
        images: chunk.images ?? [],
      };
    });
}

/**
 * Education entries from knowledge/education.md's single bulleted section.
 * Each bullet is its own entry, parsed independently for a date; a bullet
 * with no extractable date (the declined IPP master's, "currently
 * learning") keeps dateLabel null rather than getting a guessed one.
 */
export async function loadEducationEntries(): Promise<TimelineEntry[]> {
  const chunks = await loadChunks("knowledge/education.md");
  const chunk = chunks[0];
  if (!chunk) return [];

  const bullets = stripHeadingPrefix(chunk.content)
    .split(/\r?\n/)
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return bullets.map((text, index) => {
    const date = extractDate(text);
    return {
      id: `education-${index}`,
      title: text,
      dateLabel: date?.label ?? null,
      sortKey: date?.sortKey ?? null,
      kind: "education" as const,
      body: "",
      // Attached to the first card only, so the file-wide images don't
      // repeat identically on every bullet.
      images: index === 0 ? chunk.images ?? [] : [],
    };
  });
}

export interface Timeline {
  dated: TimelineEntry[];
  undated: TimelineEntry[];
}

/** Every dated entry across education and experience, oldest first. */
export async function buildTimeline(): Promise<Timeline> {
  const [experience, education] = await Promise.all([
    loadExperienceEntries(),
    loadEducationEntries(),
  ]);
  const all = [...education, ...experience];
  const dated = all
    .filter((entry): entry is TimelineEntry & { sortKey: number } => entry.sortKey !== null)
    .sort((left, right) => left.sortKey - right.sortKey);
  const undated = all.filter((entry) => entry.sortKey === null);
  return { dated, undated };
}
