import { readFile } from "node:fs/promises";
import path from "node:path";
import { embedText, type EmbeddedChunk, type KnowledgeIndex } from "./embed";
import { matchTopicTags } from "./topics";

export const FALLBACK_ANSWER =
  "I don't have enough information about Aziz to answer that confidently";

// Empirically checked against the current knowledge base: genuinely
// irrelevant queries ("what is the capital of France", "write me a
// recipe") top out around 0.55-0.60, while short, generic-but-genuine
// questions ("tell me about a project") land around 0.68 — 0.7 excluded
// that second group. 0.68 keeps a comfortable ~0.08 margin above the
// irrelevant-query ceiling while admitting the borderline genuine ones.
export const DEFAULT_MIN_SIMILARITY = 0.68;

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

function hasAnyTag(chunk: EmbeddedChunk, tags: readonly string[]): boolean {
  return chunk.metadata.tags?.some((tag) => tags.includes(tag)) ?? false;
}

/**
 * Chunks tagged with a topic the query names by word (lib/rag/topics.ts),
 * scored against the same query embedding so they can be merged with — or
 * used in place of — the plain semantic results.
 */
function chunksForTopic(
  topicTags: readonly string[],
  index: KnowledgeIndex,
  queryEmbedding: number[],
  topK: number
): RetrievedChunk[] {
  return index.chunks
    .filter((chunk) => hasAnyTag(chunk, topicTags))
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

/**
 * Corrects two related failure modes with the same small, curated
 * mechanism (lib/rag/topics.ts): a genuine question that names a real
 * knowledge-base topic in words too sparse to clear the embedding
 * threshold at all ("characteristics", "personality"), and a genuine
 * question that clears the threshold but only against generic,
 * off-topic chunks because nothing more specific happened to score higher
 * ("aziz difficult moments" landing on generic "Who is Aziz?" bios instead
 * of the actual story in characteristics.md).
 *
 * Bounded on both sides: it only ever pulls in chunks tagged with a topic
 * the query's words map to via the fixed vocabulary in topics.ts, and it
 * leaves the semantic result untouched whenever that result already
 * includes a chunk carrying the matched topic — so it can rescue or
 * correct a match, never override a search that already found the right
 * section.
 */
function widenByTopic(
  query: string,
  result: RetrievalResult,
  index: KnowledgeIndex,
  queryEmbedding: number[],
  topK: number
): RetrievalResult {
  const topicTags = matchTopicTags(query);
  if (topicTags.length === 0) return result;

  if (result.chunks.length > 0 && result.chunks.some((chunk) => hasAnyTag(chunk, topicTags))) {
    return result; // Already found something under the right topic.
  }

  const topicMatches = chunksForTopic(topicTags, index, queryEmbedding, topK);
  if (topicMatches.length === 0) return result; // Topic named, but nothing is filed under it yet.

  const merged = [...topicMatches, ...result.chunks]
    .filter((chunk, position, all) => all.findIndex((c) => c.id === chunk.id) === position)
    .slice(0, topK);

  return { chunks: merged, topScore: result.topScore, fallbackAnswer: null };
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
  const result = rankChunks(queryEmbedding, index.chunks, options);
  const topK = Math.max(3, Math.min(5, options.topK ?? 4));
  return widenByTopic(query, result, index, queryEmbedding, topK);
}
