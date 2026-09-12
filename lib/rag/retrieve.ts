import { readFile } from "node:fs/promises";
import path from "node:path";
import { embedText, type EmbeddedChunk, type KnowledgeIndex } from "./embed";

export const FALLBACK_ANSWER =
  "I don't have enough information about Aziz to answer that confidently";

export const DEFAULT_MIN_SIMILARITY = 0.7;

export interface RetrievedChunk extends EmbeddedChunk {
  score: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  topScore: number | null;
  fallbackAnswer: string | null;
}

export interface RetrievalOptions {
  topK?: number;
  minSimilarity?: number;
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return -1;

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return -1;
  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}

/** Ranks a pre-embedded index and reports the fixed safe fallback when nothing is relevant. */
export function rankChunks(
  queryEmbedding: number[],
  chunks: EmbeddedChunk[],
  options: RetrievalOptions = {}
): RetrievalResult {
  const topK = Math.max(3, Math.min(5, options.topK ?? 4));
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;
  const ranked = chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score);
  const relevant = ranked.filter((chunk) => chunk.score >= minSimilarity).slice(0, topK);

  return {
    chunks: relevant,
    topScore: ranked[0]?.score ?? null,
    fallbackAnswer: relevant.length === 0 ? FALLBACK_ANSWER : null,
  };
}

async function loadIndex(): Promise<KnowledgeIndex> {
  const indexPath = path.join(process.cwd(), "data", "index.json");
  const raw = await readFile(indexPath, "utf-8");
  const index = JSON.parse(raw) as KnowledgeIndex;
  if (index.version !== 1 || !Array.isArray(index.chunks)) {
    throw new Error("data/index.json is not a valid knowledge index. Run scripts/build-index.ts.");
  }
  return index;
}

/** Embeds a visitor question, then returns the best three to five relevant knowledge chunks. */
export async function retrieve(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  if (!query.trim()) {
    return { chunks: [], topScore: null, fallbackAnswer: FALLBACK_ANSWER };
  }

  const [index, queryEmbedding] = await Promise.all([
    loadIndex(),
    embedText(query, { taskType: "RETRIEVAL_QUERY" }),
  ]);
  return rankChunks(queryEmbedding, index.chunks, options);
}
