import type { MarkdownChunk } from "./chunk";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

const EMBED_TIMEOUT_MS = 8000;
const EMBED_MAX_ATTEMPTS = 3;
const EMBED_RETRY_BASE_DELAY_MS = 300;

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

/**
 * Thrown when the embedding call fails because we couldn't reach Gemini at
 * all (DNS, connect timeout, connection reset, etc.), as opposed to Gemini
 * responding with an error. Callers use this to tell "the network is down"
 * apart from "retrieval genuinely found nothing" — the two must never be
 * presented to a visitor as the same thing.
 */
export class EmbeddingConnectivityError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EmbeddingConnectivityError";
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * True for failures to reach the server at all (DNS, connect timeout,
 * connection reset, our own abort-on-timeout) — never true for the server
 * responding with an HTTP error, which is a different, non-retryable kind
 * of problem.
 */
function isConnectivityError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return true;
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) return true;

  const cause = (err as { cause?: { code?: string } } | undefined)?.cause;
  const connectivityCodes = new Set([
    "UND_ERR_CONNECT_TIMEOUT",
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
  ]);
  return !!cause?.code && connectivityCodes.has(cause.code);
}

/**
 * Fetches with an explicit timeout (rather than relying on undici's
 * internal default) and a short retry with exponential backoff, but only
 * for connectivity-class failures — an HTTP error response from Gemini
 * itself is returned as-is, not retried, since retrying won't fix that.
 */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= EMBED_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (!isConnectivityError(err)) throw err;

      const { hostname, port, protocol } = new URL(url);
      const errorType = err instanceof Error ? err.name : typeof err;
      const causeCode = (err as { cause?: { code?: string } } | undefined)?.cause?.code ?? "unknown";
      console.error(
        `[embed] connectivity attempt ${attempt}/${EMBED_MAX_ATTEMPTS} failed: ` +
          `host=${hostname} port=${port || (protocol === "https:" ? 443 : 80)} ` +
          `timeoutMs=${EMBED_TIMEOUT_MS} errorType=${errorType} cause=${causeCode} ` +
          `HTTPS_PROXY=${process.env.HTTPS_PROXY ? "set" : "unset"} ` +
          `HTTP_PROXY=${process.env.HTTP_PROXY ? "set" : "unset"}`
      );

      if (attempt < EMBED_MAX_ATTEMPTS) {
        await sleep(EMBED_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  throw new EmbeddingConnectivityError(
    "Could not reach the embedding service after multiple attempts — this is a network connectivity problem, not missing knowledge.",
    { cause: lastError }
  );
}

/** Generates one Gemini embedding using the same model for documents and queries. */
export async function embedText(
  text: string,
  options: EmbedOptions = {}
): Promise<number[]> {
  if (!text.trim()) throw new Error("Cannot embed an empty string.");

  const model = options.model ?? getEmbeddingModel();
  const url = `${GEMINI_API_BASE}/models/${model}:embedContent?key=${getApiKey()}`;
  const response = await fetchWithRetry(url, {
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
