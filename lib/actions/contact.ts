import { readFile } from "node:fs/promises";
import path from "node:path";

export interface ContactDetail {
  email: string | null;
  github: string | null;
  linkedin: string | null;
}

/**
 * Parses knowledge/contact.md's "Label: value" lines. One source of truth
 * for both the prose a visitor gets from ordinary RAG retrieval (this file
 * is chunked and embedded like any other knowledge file) and the actual
 * SHOW_CONTACT card the model can't fabricate — see lib/actions/resolve.ts.
 */
export async function loadContactDetail(): Promise<ContactDetail> {
  const filePath = path.join(process.cwd(), "knowledge", "contact.md");
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return { email: null, github: null, linkedin: null };
  }

  const get = (label: string): string | null => {
    const match = raw.match(new RegExp(`^${label}:\\s*(.+)$`, "mi"));
    return match ? match[1].trim() : null;
  };

  return {
    email: get("Email"),
    github: get("GitHub"),
    linkedin: get("LinkedIn"),
  };
}
