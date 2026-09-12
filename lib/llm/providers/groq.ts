import type {
  ChatMessage,
  ChatOptions,
  LLMChunk,
  LLMProvider,
  LLMResponse,
} from "../provider";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface GroqStreamEvent {
  choices?: Array<{ delta?: { content?: string | null } }>;
}

export class GroqProvider implements LLMProvider {
  name = "groq";

  private apiKey: string;
  private model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set. Add it to .env.local before selecting Groq.");
    }
    this.apiKey = apiKey;
    this.model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;
  }

  private async request(messages: ChatMessage[], opts: ChatOptions, stream: boolean): Promise<Response> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        stream,
      }),
    });
    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.status} ${await response.text()}`);
    }
    return response;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<LLMResponse> {
    const response = await this.request(messages, opts, false);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { content: data.choices?.[0]?.message?.content ?? "" };
  }

  async *stream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<LLMChunk> {
    const response = await this.request(messages, opts, true);
    if (!response.body) throw new Error("Groq stream response did not include a body.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const data = event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") continue;

        const parsed = JSON.parse(data) as GroqStreamEvent;
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield { delta };
      }
    }
  }
}
