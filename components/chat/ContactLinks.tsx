"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ContactDetail } from "@/lib/actions/contact";

/**
 * The landing screen's "get in touch" row.
 *
 * Values come from knowledge/contact.md via loadContactDetail(), the same
 * single source the chat's SHOW_CONTACT card and ordinary RAG answers use,
 * so there is no second copy of Aziz's details to drift out of sync. A
 * channel renders only when that file actually has it — nothing here is
 * ever a placeholder or an invented address.
 *
 * The marks: GitHub and LinkedIn are vendored from Simple Icons (CC0, the
 * same source as the skill logos in components/skills/marks.ts); mail and
 * phone are drawn here as stroke icons, matching the stroke style already
 * used for the panel close button and the quick-links hamburger.
 *
 * They stay monochrome and pick up the accent on hover rather than using
 * brand colours. In a one-accent dark system, four competing brand colours
 * in a single row reads as clutter, and the silhouettes alone carry the
 * recognition. Each link keeps a visible text label too, so the icon is a
 * cue rather than the only way to tell what a button does.
 */

type Channel = {
  key: string;
  label: string;
  href: string;
  /** Screen-reader text, since "Email" alone doesn't say where it goes. */
  description: string;
  external?: boolean;
  icon: React.ReactNode;
};

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const MailIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" {...strokeProps}>
    <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.25" />
    <path d="m3.5 8 8.5 5.75L20.5 8" />
  </svg>
);

const PhoneIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" {...strokeProps}>
    <path d="M6.4 3.5h2.9l1.5 3.9-2 1.4a12.3 12.3 0 0 0 5.4 5.4l1.4-2 3.9 1.5v2.9a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2Z" />
  </svg>
);

const GithubIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LinkedinIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

function buildChannels(contact: ContactDetail): Channel[] {
  const channels: Channel[] = [];

  if (contact.email) {
    channels.push({
      key: "email",
      label: "Email",
      href: `mailto:${contact.email}`,
      description: `Email Aziz at ${contact.email}`,
      icon: MailIcon,
    });
  }
  if (contact.phone) {
    channels.push({
      key: "phone",
      label: "Phone",
      href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`,
      description: `Call Aziz on ${contact.phone}`,
      icon: PhoneIcon,
    });
  }
  if (contact.github) {
    channels.push({
      key: "github",
      label: "GitHub",
      href: contact.github,
      description: "Aziz's GitHub profile, opens in a new tab",
      external: true,
      icon: GithubIcon,
    });
  }
  if (contact.linkedin) {
    channels.push({
      key: "linkedin",
      label: "LinkedIn",
      href: contact.linkedin,
      description: "Aziz's LinkedIn profile, opens in a new tab",
      external: true,
      icon: LinkedinIcon,
    });
  }

  return channels;
}

export function ContactLinks({ contact }: { contact: ContactDetail }) {
  const reduceMotion = useReducedMotion();
  const channels = buildChannels(contact);

  if (channels.length === 0) return null;

  return (
    <div className="w-full">
      <p className="mb-3 font-mono text-sm uppercase tracking-wide text-muted">
        Get in touch
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {channels.map((channel, i) => (
          <motion.li
            key={channel.key}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduceMotion ? 0 : i * 0.06,
              duration: reduceMotion ? 0 : 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <a
              href={channel.href}
              aria-label={channel.description}
              {...(channel.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-base text-muted transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:text-accent focus-visible:-translate-y-0.5 focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
            >
              {channel.icon}
              <span className="font-mono">{channel.label}</span>
            </a>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
