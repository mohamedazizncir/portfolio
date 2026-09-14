import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Architecture — Aziz/AI",
  description:
    "The real pipeline behind this AI-driven portfolio, stage by stage, with the actual files that implement each one.",
};

interface Stage {
  title: string;
  description: string;
  file: string;
}

const PIPELINE: Stage[] = [
  {
    title: "Visitor",
    description:
      "Types a question into the landing input or the bottom bar once a conversation has started.",
    file: "app/page.tsx",
  },
  {
    title: "Chat Interface",
    description:
      "Posts the question to the chat API and renders the response as it streams in, plus any structured actions the model attached.",
    file: "app/page.tsx",
  },
  {
    title: "Query",
    description:
      "Hits a per-IP rate limiter (20 requests/hour) and a 2,000-character cap before anything expensive — embedding, retrieval, generation — ever runs.",
    file: "lib/rate-limit.ts, app/api/chat/route.ts",
  },
  {
    title: "Retriever",
    description:
      "Embeds the question with Gemini's embedding model, then ranks every stored chunk by cosine similarity against the pre-built index.",
    file: "lib/rag/retrieve.ts",
  },
  {
    title: "Personal Knowledge Base",
    description:
      "Nine Markdown files under knowledge/, chunked by heading and embedded once at build time — not re-read or re-embedded on every request.",
    file: "knowledge/*.md, data/index.json",
  },
  {
    title: "Context Builder",
    description:
      "Joins the handful of chunks that actually clear the similarity threshold into the system prompt, alongside the anti-injection rules.",
    file: "buildContext() in app/api/chat/route.ts",
  },
  {
    title: "LLM",
    description:
      "Whichever provider LLM_PROVIDER selects — Gemini by default, Groq wired in as an alternative — reached only through one shared interface, never a provider SDK directly.",
    file: "lib/llm/provider.ts",
  },
  {
    title: "Streamed Response",
    description:
      "Provider output streams to the browser as newline-delimited JSON events as it arrives, split at a literal marker that separates prose from the actions payload.",
    file: "provider.stream() in app/api/chat/route.ts",
  },
  {
    title: "Validated UI Actions",
    description:
      "Whatever JSON the model wrote after the marker is checked against a strict, typed schema before any of it reaches a component.",
    file: "lib/actions/schema.ts",
  },
];

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen px-4 py-12 text-foreground sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md font-mono text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          ← Back to chat
        </Link>

        <header className="mt-6 space-y-3">
          <h1 className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
            How this <span className="text-accent">actually</span> works
          </h1>
          <p className="text-base text-muted">
            Every stage below names a real file in this codebase, not a
            generic diagram of what a chatbot theoretically does. If a claim
            here stops matching the code, the code is right and this page is
            stale.
          </p>
        </header>

        <section aria-labelledby="pipeline-heading" className="mt-12">
          <h2
            id="pipeline-heading"
            className="font-mono text-xs uppercase tracking-wide text-muted"
          >
            The pipeline
          </h2>

          <ol className="relative mt-4 border-l border-border pl-6 sm:pl-8">
            {PIPELINE.map((stage, i) => (
              <li key={stage.title} className="relative pb-8 last:pb-0">
                <span
                  className="absolute -left-[calc(1.5rem+4.5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent sm:-left-[calc(2rem+4.5px)]"
                  aria-hidden="true"
                />
                <div className="rounded-xl border border-border border-l-2 border-l-accent bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span
                      className="font-mono text-xs text-accent"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-mono text-sm font-semibold">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    {stage.description}
                  </p>
                  <code className="mt-2 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-xs text-accent">
                    {stage.file}
                  </code>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="decisions-heading" className="mt-14">
          <h2
            id="decisions-heading"
            className="font-mono text-xs uppercase tracking-wide text-muted"
          >
            Three decisions worth explaining
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <article className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-mono text-sm font-semibold text-accent">
                The fallback is deterministic, not the model&apos;s call
              </h3>
              <p className="mt-2 text-sm text-muted">
                Every question gets embedded and compared against the stored
                chunks by cosine similarity. If nothing clears a similarity
                score of <code className="text-foreground">0.7</code>, the
                route returns a fixed string —{" "}
                <em>&ldquo;I don&apos;t have enough information about Aziz
                to answer that confidently&rdquo;</em> — directly, without
                ever calling the LLM. The model never gets a chance to guess
                when retrieval comes up empty, because it never runs in that
                case.
              </p>
              <code className="mt-3 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-xs text-accent">
                DEFAULT_MIN_SIMILARITY in lib/rag/retrieve.ts
              </code>
            </article>

            <article className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-mono text-sm font-semibold text-accent">
                Rate limiting without a database
              </h3>
              <p className="mt-2 text-sm text-muted">
                This runs on Vercel serverless functions with no database
                yet, so the limiter is an in-memory, fixed-window counter
                keyed by IP — 20 requests per hour, checked before the
                request body is even parsed. Being honest about the
                tradeoff: Vercel can run several concurrent instances of the
                same route, each with its own process memory, so this is
                authoritative per warm instance, not atomically enforced
                across the whole deployment. For a personal portfolio&apos;s
                traffic that&apos;s an acceptable cost for zero added
                infrastructure — the upgrade path, if it&apos;s ever needed,
                is swapping this module&apos;s internals for Vercel KV or
                Upstash Redis behind the same function signature.
              </p>
              <code className="mt-3 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-xs text-accent">
                lib/rate-limit.ts
              </code>
            </article>

            <article className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-mono text-sm font-semibold text-accent">
                The model can suggest UI actions, never execute them
              </h3>
              <p className="mt-2 text-sm text-muted">
                After its prose answer, the model can write a JSON array of
                actions — things like showing a project or highlighting a
                skill. That array is parsed and checked against a Zod schema
                covering exactly eight shapes; anything that doesn&apos;t
                match is silently dropped. Two extra checks go further than
                shape alone: a{" "}
                <code className="text-foreground">SHOW_PROJECT</code> action
                is only kept if its id matches a real{" "}
                <code className="text-foreground">
                  knowledge/projects/*.md
                </code>{" "}
                file, and an{" "}
                <code className="text-foreground">OPEN_GITHUB</code> action
                is only kept if its URL is in a fixed allowlist — currently
                empty, so that action is inert by default rather than
                trusting a URL the model invented. The frontend then renders
                whatever survives through a fixed switch statement, one
                component per action type — no dynamic lookup, no eval.
              </p>
              <code className="mt-3 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-xs text-accent">
                lib/actions/schema.ts, components/ui-actions/
              </code>
            </article>
          </div>
        </section>

        <footer className="mt-14 border-t border-border pt-6">
          <Link
            href="/"
            className="font-mono text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            ← Ask a question instead
          </Link>
        </footer>
      </div>
    </main>
  );
}
