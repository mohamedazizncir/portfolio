"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { EnrichedAction, ProjectEntry } from "@/lib/actions/resolve";
import type { ContactDetail } from "@/lib/actions/contact";
import { SuggestedChips } from "@/components/chat/SuggestedChips";
import { ActionPanel } from "@/components/chat/ActionPanel";
import { PersistentMenu } from "@/components/chat/PersistentMenu";
import { AnswerGallery } from "@/components/chat/AnswerGallery";
import { Hero } from "@/components/chat/Hero";
import { AnswerSkills } from "@/components/chat/AnswerSkills";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: EnrichedAction[];
  images?: string[];
  skills?: string[];
}

type StreamEvent =
  | { type: "answer_delta"; text: string }
  | { type: "images"; images: string[] }
  | { type: "skills"; skills: string[] }
  | { type: "actions"; actions: EnrichedAction[] }
  | { type: "error"; message: string };

interface Props {
  contact: ContactDetail;
  projects: ProjectEntry[];
}

export function HomeChat({ contact, projects }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [panelActions, setPanelActions] = useState<EnrichedAction[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [scrolledPastTop, setScrolledPastTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

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

  // The quick-links button sits fixed directly over the top of the message
  // column, so once the visitor has scrolled even slightly, it recedes
  // instead of sitting fully opaque over whatever text scrolled underneath
  // it — see PersistentMenu's `recede` prop.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      setScrolledPastTop((el?.scrollTop ?? 0) > 24);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasConversation]);

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
              setSelectedProjectId(null);
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
      <main className="flex min-h-dvh flex-col items-center justify-center overflow-x-hidden px-4 py-12 text-foreground">
        <PersistentMenu onSelect={sendMessage} disabled={isStreaming} />
        <Hero contact={contact}>
          <div className="flex flex-col items-center gap-4">
            <form onSubmit={handleSubmit} className="w-full">
              <label htmlFor="chat-input" className="sr-only">
                Ask a question about Aziz
              </label>
              <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-6 py-4 transition-colors focus-within:border-accent">
                <span className="font-mono text-lg text-accent select-none" aria-hidden="true">
                  ›
                </span>
                <input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about Aziz"
                  autoFocus
                  className="w-full bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted sm:text-lg"
                />
              </div>
            </form>

            <SuggestedChips onSelect={sendMessage} />
          </div>
        </Hero>
      </main>
    );
  }

  // Shared by the mobile bottom sheet and the desktop column, which render
  // the same state in two shapes.
  const panelProps = {
    actions: panelActions,
    projects,
    selectedProjectId,
    onSelectProject: setSelectedProjectId,
    onAsk: sendMessage,
    askDisabled: isStreaming,
    open: panelOpen,
    onClose: () => setPanelOpen(false),
  };

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground md:flex-row">
      <PersistentMenu onSelect={sendMessage} disabled={isStreaming} recede={scrolledPastTop} />

      {/* Reopens the details panel, which always carries the full project
          browser, so every project stays one click away once it's closed. */}
      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="Browse all projects"
          className={`fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 font-mono text-sm text-foreground backdrop-blur-sm transition-[color,border-color,opacity] duration-200 ease-out hover:border-accent hover:text-accent hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
            scrolledPastTop ? "opacity-60" : "opacity-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="5.5" height="5.5" rx="1.25" />
            <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.25" />
            <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.25" />
            <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.25" />
          </svg>
          Projects
        </button>
      )}

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          chatVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          ref={scrollRef}
          id="chat-scroll"
          className="min-h-0 flex-1 overflow-y-auto px-4 pt-20"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-7 pb-8">
            {messages.map((m, i) => {
              const isLastAssistant =
                m.role === "assistant" && i === messages.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col gap-2 ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl border border-accent/30 bg-accent/10 px-5 py-3.5 text-lg leading-relaxed text-foreground"
                        : "max-w-[90%] whitespace-pre-wrap rounded-2xl border border-border bg-surface px-5 py-4 text-lg leading-relaxed"
                    }
                  >
                    {m.content}
                    {isLastAssistant && isStreaming && (
                      <span
                        className="ml-0.5 inline-block h-5 w-2 translate-y-1 animate-pulse bg-accent motion-reduce:animate-none"
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
                </motion.div>
              );
            })}
          </div>
        </div>

        <ActionPanel {...panelProps} className="md:hidden" />

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border bg-background px-4 py-4"
        >
          <label htmlFor="chat-input-bar" className="sr-only">
            Ask a question about Aziz
          </label>
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-border bg-surface px-6 py-3.5 transition-colors focus-within:border-accent">
            <span className="font-mono text-lg text-accent select-none" aria-hidden="true">
              ›
            </span>
            <input
              id="chat-input-bar"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Aziz"
              disabled={isStreaming}
              autoFocus
              className="w-full bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted disabled:opacity-50 sm:text-lg"
            />
          </div>
        </form>
      </div>

      <ActionPanel {...panelProps} className="hidden md:flex" />
    </main>
  );
}
