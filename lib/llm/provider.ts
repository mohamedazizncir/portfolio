import { GeminiProvider } from "./providers/gemini";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
}

export interface LLMChunk {
  delta: string;
}

export interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<LLMResponse>;
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<LLMChunk>;
}

let cachedProvider: LLMProvider | null = null;

/**
 * Reads LLM_PROVIDER to select an implementation. The rest of the app only
 * ever talks to the LLMProvider interface, never a provider SDK directly.
 */
export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.LLM_PROVIDER ?? "gemini";

  switch (providerName) {
    case "gemini":
      cachedProvider = new GeminiProvider();
      break;
    default:
      throw new Error(`Unknown LLM provider: "${providerName}"`);
  }

  return cachedProvider;
}
