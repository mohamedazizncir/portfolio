/**
 * Canned questions shared between the landing screen's suggested chips and
 * the persistent quick-links menu. Both feed straight into the same
 * sendMessage() call as anything a visitor types — one chat pipeline, not
 * two parallel content systems.
 */
export const SUGGESTED_QUESTIONS = [
  "What are Aziz's skills?",
  "Tell me about a project",
  "What's Aziz's experience?",
  "How can I contact Aziz?",
  "How does this site work?",
] as const;

export const QUICK_LINKS = [
  { label: "Projects", question: "Tell me about a project" },
  { label: "Skills", question: "What are Aziz's skills?" },
  { label: "Contact", question: "How can I contact Aziz?" },
] as const;
