import { SUGGESTED_QUESTIONS } from "./questions";

interface Props {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedChips({ onSelect, disabled }: Props) {
  return (
    <div
      role="group"
      aria-label="Suggested questions"
      className="flex flex-wrap justify-center gap-2"
    >
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
