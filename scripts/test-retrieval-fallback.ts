import assert from "node:assert/strict";
import { FALLBACK_ANSWER, rankChunks } from "../lib/rag/retrieve";

const unrelatedQuestion = "What is the capital of Mars?";
const result = rankChunks(
  [-1, 0],
  [
    {
      id: "knowledge-profile-1",
      source: "knowledge/profile.md",
      heading: "Profile",
      content: "Placeholder profile information.",
      metadata: { type: "profile" },
      embedding: [1, 0],
    },
  ],
  { minSimilarity: 0.7 }
);

assert.equal(result.chunks.length, 0, `Expected no relevant chunks for: ${unrelatedQuestion}`);
assert.equal(result.fallbackAnswer, FALLBACK_ANSWER);
console.log(`Fallback verified for unrelated question: ${unrelatedQuestion}`);
