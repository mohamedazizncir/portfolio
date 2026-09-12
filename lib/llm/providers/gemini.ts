import type {
  ChatMessage,
  ChatOptions,
  LLMChunk,
  LLMProvider,
  LLMResponse,
} from "../provider";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function toSystemInstruction(messages: ChatMessage[]) {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  return systemText ? { parts: [{ text: systemText }] } : undefined;
}

function extractText(candidate: {
  content?: { parts?: GeminiPart[] };
}): string {
  return candidate.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export class GeminiProvider implements LLMProvider {
  name = "gemini";

  private apiKey: string;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and fill it in."
      );
    }
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async chat(
    messages: ChatMessage[],
    opts: ChatOptions = {}
  ): Promise<LLMResponse> {
    const url = `${API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        systemInstruction: toSystemInstruction(messages),
        generationConfig: {
          maxOutputTokens: opts.maxTokens,
          temperature: opts.temperature,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const content = extractText(data.candidates?.[0] ?? {});

    return { content };
  }

  async *stream(
    messages: ChatMessage[],
    opts: ChatOptions = {}
  ): AsyncIterable<LLMChunk> {
    const url = `${API_BASE}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        systemInstruction: toSystemInstruction(messages),
        generationConfig: {
          maxOutputTokens: opts.maxTokens,
          temperature: opts.temperature,
        },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(
        `Gemini stream request failed: ${res.status} ${await res.text()}`
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.slice("data:".length).trim();
        if (!jsonStr) continue;

        const parsed = JSON.parse(jsonStr);
        const text = extractText(parsed.candidates?.[0] ?? {});
        if (text) yield { delta: text };
      }
    }
  }
}
