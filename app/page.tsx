"use client";

import { useEffect, useRef, useState } from "react";
import type { UIAction } from "@/lib/actions/schema";
import { SuggestedChips } from "@/components/chat/SuggestedChips";
import { ActionPanel } from "@/components/chat/ActionPanel";
import { PersistentMenu } from "@/components/chat/PersistentMenu";
import { AnswerGallery } from "@/components/chat/AnswerGallery";
import { Hero } from "@/components/chat/Hero";
import { AnswerSkills } from "@/components/chat/AnswerSkills";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: UIAction[];
  images?: string[];
  skills?: string[];
}

type StreamEvent =
  | { type: "answer_delta"; text: string }
  | { type: "images"; images: string[] }
  | { type: "skills"; skills: string[] }
  | { type: "actions"; actions: UIAction[] }
  | { type: "error"; message: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [panelActions, setPanelActions] = useState<UIAction[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    if (!hasConversation) {
      setChatVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setChatVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [hasConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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
          } else if (event.type === "images") {
            appendToLastAssistant((msg) => ({ ...msg, images: event.images }));
          } else if (event.type === "skills") {
            appendToLastAssistant((msg) => ({ ...msg, skills: event.skills }));
          } else if (event.type === "actions") {
            appendToLastAssistant((msg) => ({ ...msg, actions: event.actions }));
            if (event.actions.length > 0) {
              setPanelActions(event.actions);
              setPanelOpen(true);
            }
          } else if (event.type === "error") {
            appendToLastAssistant((msg) => ({ ...msg, content: event.message }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong reaching the assistant. Please try again.";
      appendToLastAssistant(() => ({ role: "assistant", content: message }));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  if (!hasConversation) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-12 text-foreground">
        <PersistentMenu onSelect={sendMessage} disabled={isStreaming} />
        <Hero>
          <div className="flex flex-col items-center gap-4">
            <form onSubmit={handleSubmit} className="w-full">
              <label htmlFor="chat-input" className="sr-only">
                Ask a question about Aziz
              </label>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3.5 transition-colors focus-within:border-accent">
                <span className="font-mono text-accent select-none" aria-hidden="true">
                  ›
                </span>
                <input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about Aziz"
                  autoFocus
                  className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted sm:text-base"
                />
              </div>
            </form>

            <SuggestedChips onSelect={sendMessage} />
          </div>
        </Hero>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground md:flex-row">
      <PersistentMenu onSelect={sendMessage} disabled={isStreaming} />
      <div
        className={`flex min-w-0 flex-1 flex-col transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          chatVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-16 md:pt-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-4">
            {messages.map((m, i) => {
              const isLastAssistant =
                m.role === "assistant" && i === messages.length - 1;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-2 ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl bg-foreground px-4 py-2 text-background"
                        : "max-w-[80%] whitespace-pre-wrap rounded-2xl bg-surface px-4 py-2"
                    }
                  >
                    {m.content}
                    {isLastAssistant && isStreaming && (
                      <span
                        className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-accent motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {m.role === "assistant" && m.skills && m.skills.length > 0 && (
                    <AnswerSkills skills={m.skills} />
                  )}

                  {m.role === "assistant" && m.images && m.images.length > 0 && (
                    <div className="w-full min-w-0">
                      <AnswerGallery images={m.images} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ActionPanel
          actions={panelActions}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          className="md:hidden"
        />

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border bg-background px-4 py-4"
        >
          <label htmlFor="chat-input-bar" className="sr-only">
            Ask a question about Aziz
          </label>
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 transition-colors focus-within:border-accent">
            <span className="font-mono text-accent select-none" aria-hidden="true">
              ›
            </span>
            <input
              id="chat-input-bar"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Aziz"
              disabled={isStreaming}
              autoFocus
              className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50 sm:text-base"
            />
          </div>
        </form>
      </div>

      <ActionPanel
        actions={panelActions}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        className="hidden md:flex"
      />
    </main>
  );
}
