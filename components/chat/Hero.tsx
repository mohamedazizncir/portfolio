"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SkillMarquee } from "@/components/skills/SkillMarquee";
import { ContactLinks } from "@/components/chat/ContactLinks";
import type { ContactDetail } from "@/lib/actions/contact";

/**
 * The landing screen: who Aziz is, before a visitor has asked anything.
 *
 * Every fact shown here comes from the knowledge base — knowledge/profile.md
 * for the name, school, course, home city and languages, and
 * knowledge/characteristics.md for the competition record. The only
 * authored copy is the greeting line, which makes no claim of its own.
 */

const FACTS = [
  "ENIT, computer engineering",
  "Sousse, Tunisia",
  "GPA 3.9",
  "3 hackathon wins",
  "Arabic, French, English",
] as const;

// One shared rhythm, so the portrait, the text and the input read as a
// single movement rather than five unrelated animations.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/** Text-width column. The skill belt deliberately does not use this. */
const COLUMN = "w-full max-w-2xl";

interface Props {
  children: React.ReactNode;
  contact: ContactDetail;
}

export function Hero({ children, contact }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full flex-col items-center gap-7 text-center"
    >
      <motion.div variants={rise} className="relative">
        <span
          aria-hidden="true"
          className="portrait-halo absolute -inset-3 rounded-full bg-accent/20 blur-2xl motion-reduce:animate-none"
        />
        <span className="relative block rounded-full p-0.5 ring-1 ring-accent/40">
          <Image
            src="/profile.png"
            alt="Mohamed Aziz Ncir"
            width={160}
            height={160}
            priority
            className="h-28 w-28 rounded-full object-cover sm:h-36 sm:w-36"
          />
        </span>
      </motion.div>

      <motion.div variants={rise} className={`${COLUMN} space-y-2`}>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">
          Hi, I&rsquo;m
        </p>
        <h1 className="font-mono text-[2rem] font-semibold leading-tight tracking-tight sm:text-5xl">
          Mohamed Aziz Ncir
        </h1>
        <p className="mx-auto max-w-xl text-balance text-lg leading-relaxed text-muted sm:text-xl">
          Software engineering student at ENIT. Come say hello and ask me
          anything, this whole page is a conversation rather than a scroll.
        </p>
      </motion.div>

      <motion.ul
        variants={rise}
        aria-label="About Aziz"
        className={`${COLUMN} flex flex-wrap justify-center gap-2`}
      >
        {FACTS.map((fact) => (
          <li
            key={fact}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-sm text-muted"
          >
            {fact}
          </li>
        ))}
      </motion.ul>

      <motion.div variants={rise} className={COLUMN}>
        {children}
      </motion.div>

      <motion.div variants={rise} className={COLUMN}>
        <ContactLinks contact={contact} />
      </motion.div>

      {/*
        Edge to edge: the belt reads as a band across the whole page rather
        than a strip boxed inside the text column. Its width cancels the
        page's own px-4 on both sides, and the parent's items-center then
        lands it exactly on the viewport edges. Using the flex centring this
        way avoids the left-1/2 / -translate-x-1/2 trick, which fights
        items-center and ends up off-centre.
      */}
      <motion.div variants={rise} className="w-[calc(100%+2rem)] min-w-0">
        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">
          What I build with
        </p>
        <SkillMarquee />
      </motion.div>
    </motion.div>
  );
}
