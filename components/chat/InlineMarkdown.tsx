import { Fragment } from "react";

/**
 * Renders `**bold**` spans inside otherwise-plain text. This is the only
 * inline markdown syntax any knowledge file actually uses (verified against
 * every project and knowledge file) — no links, code spans, or italics — so
 * a small regex split covers it without pulling in a full Markdown renderer
 * for one feature.
 */
export function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        return (
          <Fragment key={i}>
            {bold ? <strong className="font-semibold text-foreground">{bold[1]}</strong> : part}
          </Fragment>
        );
      })}
    </>
  );
}
