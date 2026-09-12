import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown } from "../lib/rag/chunk";
import { embedChunks, getEmbeddingModel, type KnowledgeIndex } from "../lib/rag/embed";

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  }));
  return nested.flat();
}

async function buildIndex(): Promise<void> {
  const root = process.cwd();
  const knowledgeDirectory = path.join(root, "knowledge");
  const files = await markdownFiles(knowledgeDirectory);
  const chunks = (
    await Promise.all(files.map(async (filePath) => {
      const markdown = await readFile(filePath, "utf-8");
      return chunkMarkdown(path.relative(root, filePath).replace(/\\/g, "/"), markdown);
    }))
  ).flat();

  if (chunks.length === 0) throw new Error("No Markdown sections were found in knowledge/.");

  const index: KnowledgeIndex = {
    version: 1,
    model: getEmbeddingModel(),
    generatedAt: new Date().toISOString(),
    chunks: await embedChunks(chunks),
  };
  const outputDirectory = path.join(root, "data");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Built data/index.json with ${index.chunks.length} chunks from ${files.length} files.`);
}

buildIndex().catch((error: unknown) => {
  console.error("Failed to build knowledge index:", error);
  process.exitCode = 1;
});
