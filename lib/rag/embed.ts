import type { MarkdownChunk } from "./chunk";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export interface EmbeddedChunk extends MarkdownChunk {
  embedding: number[];
}

export interface KnowledgeIndex {
  version: 1;
  model: string;
  generatedAt: string;
  chunks: EmbeddedChunk[];
}

export interface EmbedOptions {
  taskType?: EmbeddingTaskType;
  model?: string;
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to generate knowledge embeddings.");
  }
  return apiKey;
}

export function getEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

/** Generates one Gemini embedding using the same model for documents and queries. */
export async function embedText(
  text: string,
  options: EmbedOptions = {}
): Promise<number[]> {
  if (!text.trim()) throw new Error("Cannot embed an empty string.");

  const model = options.model ?? getEmbeddingModel();
  const url = `${GEMINI_API_BASE}/models/${model}:embedContent?key=${getApiKey()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType: options.taskType ?? "RETRIEVAL_DOCUMENT",
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini embedding request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { embedding?: { values?: unknown } };
  const values = data.embedding?.values;
  if (!Array.isArray(values) || !values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Gemini embedding response did not include a valid vector.");
  }

  return values;
}

/** Embeds sequentially to stay comfortably within Gemini's free-tier limits. */
export async function embedChunks(chunks: MarkdownChunk[]): Promise<EmbeddedChunk[]> {
  const embedded: EmbeddedChunk[] = [];
  for (const chunk of chunks) {
    embedded.push({
      ...chunk,
      embedding: await embedText(chunk.content, { taskType: "RETRIEVAL_DOCUMENT" }),
    });
  }
  return embedded;
}
