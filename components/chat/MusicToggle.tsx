"use client";

import { toolbarButtonClass } from "./toolbarButton";

interface Props {
  playing: boolean;
  onToggle: () => void;
  /** Show the text label next to the icon (the landing screen has room). */
  showLabel?: boolean;
  recede?: boolean;
}

/**
 * Play/pause for the background music (see useMusic). While playing, the
 * note icon becomes a small bouncing equaliser, so it's obvious at a glance
 * where the sound is coming from and how to stop it.
 */
export function MusicToggle({ playing, onToggle, showLabel, recede }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      title={playing ? "Pause music" : "Play music"}
      className={`${toolbarButtonClass({ recede, active: playing })} ${showLabel ? "px-4" : "w-10"}`}
    >
      {playing ? (
        <span aria-hidden="true" className="flex h-4 w-4 items-end justify-between">
          {[0, 1, 2, 3].map((bar) => (
            <span
              key={bar}
              className="music-bar h-full w-0.75 rounded-full bg-current"
              style={{ animationDelay: `${bar * -0.27}s` }}
            />
          ))}
        </span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M7.5 15V4.5l9-2V13" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5.25" cy="15" r="2.25" />
          <circle cx="14.25" cy="13" r="2.25" />
        </svg>
      )}
      {showLabel && (
        <span className="font-mono text-sm">{playing ? "Music on" : "Play music"}</span>
      )}
    </button>
  );
}
