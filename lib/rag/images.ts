/**
 * Image attachment rules, shared by the index builder and the chat route.
 *
 * The trust model here is the same one SHOW_PROJECT uses for project ids:
 * the model never supplies an image path. Paths come only from the
 * frontmatter of the knowledge files themselves, are validated against the
 * allowlist pattern below when the index is built, and are validated again
 * on the way out. A model can influence *which chunks are retrieved*, but
 * it can never introduce a URL that wasn't already written into the
 * knowledge base by hand.
 */

/** Anything with attached images — kept structural to avoid an import cycle. */
export interface HasImages {
  images?: string[];
}

/** Upper bound on images attached to a single response, so the answer stays readable. */
export const MAX_IMAGES_PER_RESPONSE = 6;

const ALLOWED_EXTENSIONS = /\.(?:png|jpe?g|webp|avif|gif)$/i;

/**
 * Accepts only same-origin, public/-relative paths: a leading slash, plain
 * path segments, and a known raster extension.
 *
 * Deliberately rejected: absolute URLs and protocol-relative "//host" paths
 * (which would let a knowledge file hotlink anywhere), any "..", backslashes
 * or whitespace, and .svg — an SVG served from our own origin can carry
 * script, and nothing in the knowledge base needs one.
 */
export function isSafeImagePath(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const path = value.trim();
  if (path.length === 0 || path.length > 300) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("..")) return false;
  if (path.includes("\\")) return false;
  if (/\s/.test(path)) return false;
  if (!/^\/[A-Za-z0-9._/-]+$/.test(path)) return false;

  return ALLOWED_EXTENSIONS.test(path);
}

/** Drops anything that isn't a safe path, then removes duplicates, preserving order. */
export function sanitizeImagePaths(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const safe: string[] = [];

  for (const value of values) {
    if (!isSafeImagePath(value)) continue;
    const path = value.trim();
    if (seen.has(path)) continue;
    seen.add(path);
    safe.push(path);
  }

  return safe;
}

/**
 * Gathers the images attached to the chunks that actually informed an
 * answer. Retrieval order is preserved, so the most relevant chunk's
 * images lead, and the total is capped so a broad question can't flood the
 * response with every photo in the knowledge base.
 */
export function collectResponseImages(
  chunks: readonly HasImages[],
  limit: number = MAX_IMAGES_PER_RESPONSE
): string[] {
  const collected = chunks.flatMap((chunk) => chunk.images ?? []);
  return sanitizeImagePaths(collected).slice(0, Math.max(0, limit));
}
