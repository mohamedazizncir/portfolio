export interface KnowledgeMetadata {
  type?: string;
  id?: string;
  tags?: string[];
}

export interface MarkdownChunk {
  id: string;
  source: string;
  heading: string;
  content: string;
  metadata: KnowledgeMetadata;
}

export interface ChunkOptions {
  maxWords?: number;
}

const DEFAULT_MAX_WORDS = 350;

function parseFrontmatter(markdown: string): {
  metadata: KnowledgeMetadata;
  body: string;
} {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { metadata: {}, body: markdown };

  const metadata: KnowledgeMetadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "type" || key === "id") {
      metadata[key] = value.replace(/^['"]|['"]$/g, "");
    }
    if (key === "tags") {
      metadata.tags = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
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

  return sections.flatMap((section) =>
    splitLongSection(section.body, maxWords).map((sectionPart, partIndex) => ({
      id: `${source.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}-${section.heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section"}-${partIndex + 1}`,
      source,
      heading: section.heading,
      content: `## ${section.heading}\n\n${sectionPart}`,
      metadata,
    }))
  );
}
