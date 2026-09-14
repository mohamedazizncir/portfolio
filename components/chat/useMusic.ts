"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChiptuneLoop, isMusicSupported } from "@/lib/music/chiptune";

/**
 * Background music, off until the visitor asks for it. Browsers refuse to
 * start audio before a user gesture anyway, and sound that starts on its own
 * is the fastest way to get a portfolio tab closed.
 *
 * The loop pauses while the tab is hidden and picks back up when the
 * visitor returns, so it never plays to nobody in a background tab.
 */
export function useMusic() {
  const loopRef = useRef<ChiptuneLoop | null>(null);
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setSupported(isMusicSupported());
    return () => {
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;

    function handleVisibility() {
      if (document.hidden) loopRef.current?.stop();
      else void loopRef.current?.start().catch(() => setPlaying(false));
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [playing]);

  const toggle = useCallback(() => {
    if (playing) {
      loopRef.current?.stop();
      setPlaying(false);
      return;
    }

    loopRef.current ??= new ChiptuneLoop();
    setPlaying(true);
    loopRef.current.start().catch(() => setPlaying(false));
  }, [playing]);

  return { supported, playing, toggle };
}
