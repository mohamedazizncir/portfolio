/**
 * The technologies this site can show a logo for.
 *
 * Pure data, deliberately free of React or icon imports, so the chat route
 * can detect skills server-side without pulling an icon library into the
 * server bundle. The matching icon and brand colour live alongside the
 * component that renders them, in components/skills/icons.ts.
 *
 * Every entry is a technology named in knowledge/skills.md, or — for
 * Hugging Face — knowledge/experience.md. Nothing is listed because it
 * would look good on a portfolio: this stays a subset of what Aziz has
 * actually written down. Technologies with no recognisable mark in the
 * Simple Icons set (XGBoost, ChromaDB, FAISS, CrewAI, RAGAS, MobileNet,
 * DistilBERT, H3) are absent rather than given a stand-in.
 */
export interface SkillEntry {
  name: string;
  /** Extra spellings to match in knowledge text, beyond `name` itself. */
  aliases?: readonly string[];
}

export const SKILL_CATALOGUE: readonly SkillEntry[] = [
  { name: "Python" },
  { name: "Java", aliases: ["J2EE", "OpenJDK"] },
  { name: "Spring Boot", aliases: ["Spring"] },
  { name: "FastAPI" },
  { name: "Flask" },
  { name: "React" },
  { name: "Flutter" },
  { name: "Docker" },
  { name: "Kafka", aliases: ["Apache Kafka"] },
  { name: "PostgreSQL", aliases: ["Postgres"] },
  { name: "Firebase" },
  { name: "Raspberry Pi" },
  { name: "Arduino" },
  { name: "OpenCV" },
  { name: "YOLOv8", aliases: ["YOLO"] },
  { name: "Hugging Face", aliases: ["HuggingFace"] },
  { name: "LangGraph", aliases: ["LangChain"] },
  { name: "Ollama" },
  { name: "Qdrant" },
  { name: "Kaggle" },
  { name: "Mapbox", aliases: ["Mapbox GL JS"] },
  { name: "Node-RED", aliases: ["Node RED"] },
  { name: "MQTT" },
];

/** Upper bound per response, so an answer about skills stays a summary. */
export const MAX_SKILLS_PER_RESPONSE = 12;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary matchers, longest alias first so "Mapbox GL JS" wins over
 * "Mapbox". \b is what keeps "Java" from matching inside "JavaScript" and
 * "React" from matching inside "reactive": in both cases the character
 * after the alias is a word character, so there is no boundary there.
 */
const MATCHERS: ReadonlyArray<{ name: string; pattern: RegExp }> = SKILL_CATALOGUE.flatMap(
  (skill) =>
    [skill.name, ...(skill.aliases ?? [])]
      .sort((a, b) => b.length - a.length)
      .map((spelling) => ({
        name: skill.name,
        pattern: new RegExp(`\\b${escapeRegExp(spelling)}\\b`, "i"),
      }))
);

/**
 * Finds the catalogue technologies actually named in some knowledge text.
 *
 * This is the same trust rule the images use: the list is derived from the
 * retrieved knowledge chunks, never from anything the model wrote, so a
 * model cannot cause a logo to appear for a technology Aziz has not
 * claimed. Results follow catalogue order, which keeps the badge row
 * stable between answers instead of reshuffling by match position.
 */
export function detectSkills(
  text: string,
  limit: number = MAX_SKILLS_PER_RESPONSE
): string[] {
  if (!text.trim()) return [];

  const found = new Set<string>();
  for (const { name, pattern } of MATCHERS) {
    if (found.has(name)) continue;
    if (pattern.test(text)) found.add(name);
  }

  return SKILL_CATALOGUE.filter((skill) => found.has(skill.name))
    .map((skill) => skill.name)
    .slice(0, Math.max(0, limit));
}
