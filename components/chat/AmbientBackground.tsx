"use client";

import Image from "next/image";

/**
 * A dynamic, photo-backed background across the whole site, replacing the
 * flat black one. Two rows of real photos — projects, internships, campus
 * life — drift slowly in opposite directions behind everything else, each
 * row at its own depth and speed for a mild parallax feel.
 *
 * Kept from competing with foreground content by construction rather than
 * by being nearly invisible: every real piece of text in the app sits on
 * its own opaque bg-surface card (message bubbles, chips, panels, gallery
 * cards), so none of it is actually read against this layer — only the
 * empty space around those cards is. That's what allows the photos to stay
 * clearly visible and in motion, with just one moderate scrim in the
 * existing background token on top, rather than needing to crush them down
 * to a barely-there texture. No new colour is introduced — the photos
 * supply movement, the token supplies every colour.
 *
 * aria-hidden and pointer-events-none throughout: this is decoration, not
 * content, so it's invisible to assistive tech and never intercepts a
 * click or a drag on the real UI above it. The animation is driven by the
 * same marquee-scroll keyframe as the skill belt, which the global
 * prefers-reduced-motion rule in globals.css already freezes to a static
 * frame — no separate handling needed here.
 */

const ROW_ONE = [
  "/projects/crimelens/hotspot-map.png",
  "/activities/group-activities.jpeg",
  "/experience/ieee-sight/sight-day-congress.jpg",
  "/projects/stockcare-hackathon/screenshot.jpg",
  "/education/enit-classmates-photo.jpeg",
  "/projects/appointment-platform/screenshot-1.png",
  "/activities/workshop.jpg",
] as const;

const ROW_TWO = [
  "/experience/steg/steg-internship-team.jpeg",
  "/projects/rl-trading-agent/workflow-diagram.png",
  "/activities/camp-1.jpg",
  "/projects/steg-iot-monitoring/platform-screenshot.png",
  "/interests/sports/playing-football.jpeg",
  "/projects/fraud-detection-gnn/winning-photo.jpeg",
  "/activities/industry-visit.jpeg",
  "/projects/mood-diary/screenshot.png",
] as const;

function Row({
  images,
  animationClass,
}: {
  images: readonly string[];
  animationClass: string;
}) {
  // Two copies back to back so the loop has no visible seam, same trick
  // as the skill marquee.
  return (
    <div className="flex w-max shrink-0">
      {[0, 1].map((copy) => (
        <div key={copy} className={`flex shrink-0 gap-4 pr-4 ${animationClass}`}>
          {images.map((src, i) => (
            <span
              key={`${copy}-${i}-${src}`}
              className="relative block h-40 w-56 shrink-0 overflow-hidden rounded-2xl sm:h-48 sm:w-72"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="288px"
                className="object-cover grayscale contrast-90 brightness-75"
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      <div className="absolute inset-0 flex -rotate-2 scale-125 flex-col justify-center gap-6 opacity-[0.6]">
        <Row images={ROW_ONE} animationClass="ambient-row-left" />
        <Row images={ROW_TWO} animationClass="ambient-row-right" />
      </div>
      {/* One scrim, pure --background at a little over half opacity: light
          enough that the photos read clearly as a moving backdrop, strong
          enough that every real UI surface (all opaque bg-surface cards)
          keeps exactly the contrast it already had — the scrim only
          affects the bare page background, never what text sits on. */}
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
}
