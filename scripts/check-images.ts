/**
 * Verifies the images wired into knowledge-file frontmatter against what is
 * actually on disk, without needing an API key or a rebuilt index.
 *
 * Catches the two failure modes a rename introduces: a chunk pointing at an
 * image that no longer exists (broken <img> for a visitor), and an image
 * sitting in public/ that no chunk references (moved but never wired up).
 *
 * Run: npx tsx scripts/check-images.ts
 */
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, type MarkdownChunk } from "../lib/rag/chunk";

const IMAGE_PATTERN = /\.(?:png|jpe?g|webp|avif|gif)$/i;

/** Images that are legitimately not attached to any knowledge chunk. */
const UNREFERENCED_ALLOWLIST = new Set(["/profile.png"]);

async function filesUnder(
  directory: string,
  matches: (name: string) => boolean
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return filesUnder(fullPath, matches);
      return entry.isFile() && matches(entry.name) ? [fullPath] : [];
    })
  );
  return nested.flat();
}

function toWebPath(root: string, absolute: string): string {
  return "/" + path.relative(root, absolute).split(path.sep).join("/");
}

async function main(): Promise<void> {
  const root = process.cwd();
  const publicDirectory = path.join(root, "public");

  const markdownPaths = await filesUnder(path.join(root, "knowledge"), (name) =>
    name.endsWith(".md")
  );

  const chunks: MarkdownChunk[] = [];
  for (const filePath of markdownPaths.sort()) {
    const source = path.relative(root, filePath).split(path.sep).join("/");
    chunks.push(...chunkMarkdown(source, await readFile(filePath, "utf-8")));
  }

  const referenced = new Set<string>();
  let brokenCount = 0;
  let referenceCount = 0;

  for (const chunk of chunks) {
    if (!chunk.images?.length) continue;

    console.log(`\n${chunk.source} :: "${chunk.heading}" (${chunk.images.length})`);
    for (const image of chunk.images) {
      referenceCount += 1;
      referenced.add(image);
      try {
        await access(path.join(publicDirectory, image.slice(1)));
        console.log(`   ok       ${image}`);
      } catch {
        brokenCount += 1;
        console.log(`   BROKEN   ${image}`);
      }
    }
  }

  const onDisk = (
    await filesUnder(publicDirectory, (name) => IMAGE_PATTERN.test(name))
  ).map((absolute) => toWebPath(publicDirectory, absolute));

  const unreferenced = onDisk
    .filter((image) => !referenced.has(image) && !UNREFERENCED_ALLOWLIST.has(image))
    .sort();

  console.log(
    `\n${chunks.filter((c) => c.images?.length).length} chunks carry images, ` +
      `${referenceCount} references, ${brokenCount} broken.`
  );
  console.log(
    `${onDisk.length} images on disk, ${unreferenced.length} referenced by nothing.`
  );
  for (const image of unreferenced) console.log(`   unreferenced  ${image}`);

  if (brokenCount > 0 || unreferenced.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("check-images failed:", error);
  process.exitCode = 1;
});
