"use client";

import { useState } from "react";
import type { UIAction } from "@/lib/actions/schema";
import { UIActionRenderer } from "@/components/ui-actions";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: UIAction[];
}

type StreamEvent =
  | { type: "answer_delta"; text: string }
  | { type: "actions"; actions: UIAction[] }
  | { type: "error"; message: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  function appendToLastAssistant(update: (msg: Message) => Message) {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = update(next[next.length - 1]);
      return next;
    });
  }

  async function sendMessage(text: string) {
    const question = text.trim();
    if (!question || isStreaming) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
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
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;

          if (event.type === "answer_delta") {
            appendToLastAssistant((msg) => ({
              ...msg,
              content: msg.content + event.text,
            }));
          } else if (event.type === "actions") {
            appendToLastAssistant((msg) => ({ ...msg, actions: event.actions }));
          } else if (event.type === "error") {
            appendToLastAssistant((msg) => ({ ...msg, content: event.message }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      appendToLastAssistant(() => ({
        role: "assistant",
        content: "Something went wrong reaching the assistant. Please try again.",
      }));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const hasConversation = messages.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 text-neutral-100">
      {!hasConversation ? (
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-8 px-4">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Aziz
            </h1>
            <p className="text-neutral-400 max-w-md mx-auto">
              An AI-driven portfolio. Ask a question instead of scrolling.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Aziz"
              autoFocus
              className="w-full rounded-full border border-neutral-800 bg-neutral-900 px-5 py-3 text-base outline-none focus:border-neutral-500"
            />
          </form>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col max-w-2xl px-4 pb-28 pt-10">
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "rounded-2xl bg-neutral-100 text-neutral-900 px-4 py-2 max-w-[80%]"
                      : "rounded-2xl bg-neutral-900 px-4 py-2 max-w-[80%] whitespace-pre-wrap"
                  }
                >
                  {m.content ||
                    (isStreaming && i === messages.length - 1 ? "…" : "")}
                </div>
                {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-[80%]">
                    {m.actions.map((action, j) => (
                      <UIActionRenderer key={j} action={action} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur px-4 py-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Aziz"
              disabled={isStreaming}
              autoFocus
              className="mx-auto block w-full max-w-2xl rounded-full border border-neutral-800 bg-neutral-900 px-5 py-3 text-base outline-none focus:border-neutral-500 disabled:opacity-50"
            />
          </form>
        </div>
      )}
    </main>
  );
}
