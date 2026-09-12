// Links to /architecture, which ships in Phase 5. Until then this 404s.
export function ShowArchitectureAction() {
  return (
    <a
      href="/architecture"
      className="inline-block rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:border-neutral-500"
    >
      See how this works →
    </a>
  );
}
