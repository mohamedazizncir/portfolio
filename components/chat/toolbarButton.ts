/**
 * The round, top-left toolbar buttons (quick links, home, music) share one
 * look. `recede` is the scrolled-away state described in PersistentMenu:
 * smaller and translucent while the visitor reads, back to full strength on
 * hover or keyboard focus. `active` marks a button whose feature is on.
 */
export function toolbarButtonClass({
  recede = false,
  active = false,
}: {
  recede?: boolean;
  active?: boolean;
}): string {
  return `flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border bg-surface backdrop-blur-sm transition-[color,border-color,opacity,transform] duration-200 ease-out hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
    active ? "border-accent/60 text-accent" : "border-border text-foreground"
  } ${
    recede
      ? "scale-90 opacity-40 hover:scale-100 hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100"
      : "scale-100 opacity-100"
  }`;
}
