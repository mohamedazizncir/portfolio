import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "SHOW_PROJECTS" }> };

export function ShowProjectsAction({ action }: Props) {
  const { filters } = action;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm">
      <p className="font-medium">Projects</p>
      {filters?.category && (
        <p className="text-neutral-400">Category: {filters.category}</p>
      )}
      {filters?.tech && <p className="text-neutral-400">Tech: {filters.tech}</p>}
      {!filters?.category && !filters?.tech && (
        <p className="text-neutral-400">Showing all projects.</p>
      )}
    </div>
  );
}
