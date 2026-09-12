import type { UIAction } from "@/lib/actions/schema";

type Props = { action: Extract<UIAction, { type: "SHOW_PROJECT" }> };

export function ShowProjectAction({ action }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm">
      <p className="font-medium">Project: {action.id}</p>
      <p className="text-neutral-400">
        Full project details ship in a later phase.
      </p>
    </div>
  );
}
