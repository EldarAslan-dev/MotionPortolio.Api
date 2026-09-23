"use client";

import { motion } from "framer-motion";
import { BehanceIcon, InstagramIcon, LinkedInIcon } from "@/components/site/BrandIcons";
import { INQUIRY_GENERAL, SOCIALS } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

export function Contact() {
  const { profile, openInquiry } = useStudio();
  const instagram = profile?.instagramUrl || SOCIALS.instagramFallback;

  return (
    <section
      id="contact"
      className="relative scroll-mt-28 overflow-visible border-t border-line px-5 py-32 text-center md:px-10"
    >
      <div className="grain" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="mb-5 font-mono-tech text-xs uppercase tracking-[0.2em] text-mist"
        >
          06 — Contact
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="font-display mt-8 text-4xl leading-[1.05] text-bone sm:text-5xl md:text-7xl md:leading-[0.95]"
        >
          Let&rsquo;s create something
          <br className="hidden sm:block" /> worth watching.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mx-auto mt-6 max-w-lg text-mist"
        >
          Send the brief and the budget. Studio desk replies.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="mt-12 flex flex-col items-center gap-10"
        >
          <motion.button
            type="button"
            data-cursor="link"
            onClick={() => openInquiry(INQUIRY_GENERAL)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            className="btn-glow rounded-full border border-bone/30 px-8 py-4 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
          >
            Start a project
          </motion.button>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <motion.a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 text-bone transition-colors hover:text-cue"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
              <span className="font-display text-lg md:text-xl">Instagram</span>
            </motion.a>
            <motion.a
              href={SOCIALS.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 text-bone transition-colors hover:text-cue"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="h-5 w-5" />
              <span className="font-display text-lg md:text-xl">LinkedIn</span>
            </motion.a>
            <motion.a
              href={SOCIALS.behance}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 text-bone transition-colors hover:text-cue"
              aria-label="Behance"
            >
              <BehanceIcon className="h-5 w-5" />
              <span className="font-display text-lg md:text-xl">Behance</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
