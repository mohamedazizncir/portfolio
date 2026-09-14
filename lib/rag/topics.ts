/**
 * A narrow, deterministic safety net for retrieve(): short or bare-topic
 * questions ("characteristics", "personality", "aziz's hobbies") that name
 * a real section of the knowledge base directly, in words a visitor would
 * actually type, but don't resemble a full sentence closely enough to
 * clear the embedding similarity threshold on their own.
 *
 * This is NOT a general threshold reduction — DEFAULT_MIN_SIMILARITY in
 * retrieve.ts stays as tuned, so a genuinely unrelated question ("what's
 * the capital of France") still gets the honest fallback. This module only
 * ever proposes chunks tagged with a topic that a curated, small vocabulary
 * of trigger words maps to, and retrieve() only consults it once semantic
 * search has already come up with nothing above threshold — so it can
 * never override a confident, more specific semantic match, only rescue a
 * query that would otherwise get "I don't have enough information."
 */

export interface TopicRoute {
  /** The frontmatter tag(s) this trigger maps to (see knowledge/*.md). */
  tags: readonly string[];
  /** Distinctive words that reliably signal this topic and nothing else. */
  triggerWords: readonly string[];
  /** Multi-word phrases, for topics whose single words are too ambiguous. */
  triggerPhrases?: readonly string[];
}

/**
 * Tags whose chunks are left out of plain semantic search entirely, and only
 * retrieved when the query names their topic through the routes below.
 *
 * knowledge/personal-life.md is a joke answer. Embedding similarity alone
 * put it next to "tell me about his personal projects" and "what does he do
 * in his free time", which would let it leak into answers a recruiter is
 * actually reading. Gating it behind explicit trigger words and phrases
 * keeps it to the questions it was written for.
 */
export const GATED_TOPIC_TAGS: readonly string[] = ["personal-life"];

const TOPIC_ROUTES: readonly TopicRoute[] = [
  {
    tags: ["characteristics", "personality"],
    triggerWords: [
      "characteristics",
      "personality",
      "trait",
      "traits",
      "setback",
      "setbacks",
      "struggle",
      "struggles",
      "struggled",
      "adversity",
      "resilience",
      "difficult",
      "difficulty",
      "challenge",
      "challenges",
      "hardship",
      "hardships",
    ],
  },
  {
    tags: ["skills", "technical"],
    triggerWords: ["skills", "skill", "technologies", "technology"],
  },
  {
    tags: ["experience", "internships"],
    triggerWords: ["experience", "internships", "internship"],
  },
  {
    tags: ["interests", "hobbies"],
    triggerWords: ["interests", "hobbies", "hobby"],
  },
  {
    tags: ["education", "academic"],
    triggerWords: ["education", "academic", "ipeim", "enit", "baccalaureate"],
  },
  {
    // "personal", "single" and "love" only count inside the phrases below:
    // on their own they show up in ordinary questions ("personal projects",
    // "single-page app", "loves finance").
    tags: ["personal-life", "relationships"],
    triggerWords: [
      "girlfriend",
      "girlfriends",
      "boyfriend",
      "relationship",
      "relationships",
      "dating",
      "married",
      "marriage",
      "wife",
      "crush",
      "romantic",
      "romance",
    ],
    triggerPhrases: [
      "personal life",
      "love life",
      "private life",
      "is he single",
      "is aziz single",
      "he is single",
      "aziz is single",
    ],
  },
  {
    tags: ["about", "identity"],
    triggerWords: ["identity", "bio", "biography"],
  },
  {
    tags: ["contact"],
    triggerWords: ["contact", "email", "reach", "linkedin", "github"],
  },
];

const WORD_PATTERN = /[a-z]+/g;

function significantWords(query: string): Set<string> {
  const words = query.toLowerCase().match(WORD_PATTERN) ?? [];
  return new Set(words);
}

/**
 * Returns the frontmatter tags to widen the search to, if any trigger word
 * for a known topic appears in the query. Multiple topics can match (e.g.
 * "skills and experience"); callers union the results.
 */
export function matchTopicTags(query: string): string[] {
  const words = significantWords(query);
  if (words.size === 0) return [];
  // Letters only, single-spaced and padded, so a phrase matches whole words.
  const normalised = ` ${(query.toLowerCase().match(WORD_PATTERN) ?? []).join(" ")} `;

  const matchedTags = new Set<string>();
  for (const route of TOPIC_ROUTES) {
    const wordHit = route.triggerWords.some((trigger) => words.has(trigger));
    const phraseHit = route.triggerPhrases?.some((phrase) => normalised.includes(` ${phrase} `));
    if (wordHit || phraseHit) {
      for (const tag of route.tags) matchedTags.add(tag);
    }
  }
  return [...matchedTags];
}
