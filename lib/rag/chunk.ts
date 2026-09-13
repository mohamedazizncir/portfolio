import { sanitizeImagePaths } from "./images";

export interface KnowledgeMetadata {
  type?: string;
  id?: string;
  tags?: string[];
  /** Images that apply to every section of the file. */
  images?: string[];
  /** Images scoped to a single heading, keyed by that heading lowercased. */
  sectionImages?: Record<string, string[]>;
}

export interface MarkdownChunk {
  id: string;
  source: string;
  heading: string;
  content: string;
  metadata: KnowledgeMetadata;
  /** Resolved for this section: file-wide images plus this heading's own. */
  images?: string[];
}

export interface ChunkOptions {
  maxWords?: number;
}

const DEFAULT_MAX_WORDS = 350;

/** Splits the `[a, b, c]` inline-list form shared by `tags` and `images`. */
function parseInlineList(value: string): string[] {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

export function parseFrontmatter(markdown: string): {
  metadata: KnowledgeMetadata;
  body: string;
} {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { metadata: {}, body: markdown };

  const metadata: KnowledgeMetadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    // `images[Some Heading]: [...]` scopes images to one section of a
    // multi-section file, so the IEEE photos in experience.md don't get
    // attached to the STEG internship answer as well. Matched before the
    // generic "key: value" split below, since a heading can itself contain
    // a colon, which would confuse a plain indexOf(":").
    //
    // The heading is matched against the section headings chunkMarkdown
    // produces, case-insensitively. Text above the first heading in a file
    // belongs to the synthesized section "Introduction".
    const scoped = line.match(/^\s*images\[(.+?)\]\s*:(.*)$/);
    if (scoped) {
      const heading = scoped[1].trim().toLowerCase();
      const paths = sanitizeImagePaths(parseInlineList(scoped[2].trim()));
      if (heading && paths.length > 0) {
        metadata.sectionImages = { ...metadata.sectionImages, [heading]: paths };
      }
      continue;
    }

    const separator = line.indexOf(":");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "type" || key === "id") {
      metadata[key] = value.replace(/^['"]|['"]$/g, "");
    }
    if (key === "tags") {
      metadata.tags = parseInlineList(value);
    }
    if (key === "images") {
      metadata.images = sanitizeImagePaths(parseInlineList(value));
    }
  }

  return { metadata, body: markdown.slice(match[0].length) };
}

function splitLongSection(text: string, maxWords: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).length;
    if (current.length > 0 && currentWords + paragraphWords > maxWords) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }
    current.push(paragraph);
    currentWords += paragraphWords;
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));

  return chunks;
}

/**
 * Splits a Markdown document into heading-based, embedding-ready sections.
 * HTML comments are deliberately omitted: they document placeholders for
 * maintainers but are not portfolio knowledge for a visitor-facing answer.
 */
export function chunkMarkdown(
  source: string,
  markdown: string,
  options: ChunkOptions = {}
): MarkdownChunk[] {
  const { metadata, body } = parseFrontmatter(markdown);
  const cleanBody = body.replace(/<!--[\s\S]*?-->/g, "").trim();
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS;
  const headingPattern = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;
  const headings = [...cleanBody.matchAll(headingPattern)];
  const sections: Array<{ heading: string; body: string }> = [];

  if (headings.length === 0) {
    sections.push({ heading: "Introduction", body: cleanBody });
  } else {
    const preamble = cleanBody.slice(0, headings[0].index).trim();
    if (preamble) sections.push({ heading: "Introduction", body: preamble });

    headings.forEach((heading, index) => {
      const start = (heading.index ?? 0) + heading[0].length;
      const end = index + 1 < headings.length
        ? headings[index + 1].index
        : cleanBody.length;
      sections.push({ heading: heading[2].trim(), body: cleanBody.slice(start, end).trim() });
    });
  }

  return sections.flatMap((section) => {
    const sectionImages = sanitizeImagePaths([
      ...(metadata.images ?? []),
      ...(metadata.sectionImages?.[section.heading.toLowerCase()] ?? []),
    ]);

    return splitLongSection(section.body, maxWords).map((sectionPart, partIndex) => ({
      id: `${source.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}-${section.heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section"}-${partIndex + 1}`,
      source,
      heading: section.heading,
      content: `## ${section.heading}\n\n${sectionPart}`,
      metadata,
      // Only the first part carries the images: a long section split into
      // several chunks would otherwise attach the same photos repeatedly
      // when more than one of its parts is retrieved.
      ...(partIndex === 0 && sectionImages.length > 0 ? { images: sectionImages } : {}),
    }));
  });
}
