"use client";

import { useEffect, useRef, useState, type Ref, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealTag = "div" | "section" | "li" | "span" | "ul" | "figure" | "h2" | "p";

export type RevealProps = {
  children: ReactNode;
  className?: string;
  /** seconds */
  delay?: number;
  /** initial vertical offset in px */
  y?: number;
  as?: RevealTag;
};

/** expo-out-ish curve: calm, expensive, no overshoot */
export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const TAGS = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  span: motion.span,
  ul: motion.ul,
  figure: motion.figure,
  h2: motion.h2,
  p: motion.p,
} as const;

/**
 * Deterministic single-element reveal for NON-TEXT elements (cards, tiles,
 * images, buttons, wrappers). Text is handled by the site-wide text reveal —
 * never wrap copy so its opacity is animated twice.
 *
 * `whileInView` (amount 0.2, once) drives it; a 2s fallback forces the shown
 * state if the element is already on screen but never triggered. `data-reveal-el`
 * lets globals.css keep it visible until motion is ready.
 */
export default function Reveal({ children, className, delay = 0, y = 24, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  // All eight tags accept the same generic HTML motion props used here; the cast
  // collapses the union so JSX can call it.
  const Tag = TAGS[as] as unknown as typeof motion.div;

  useEffect(() => {
    if (reduce || shown) return;
    const t = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) setShown(true);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [reduce, shown]);

  // `data-reveal="off"`: framer owns this element's opacity, so the site-wide
  // text reveal must not also animate it (never two systems on one opacity).
  const tagRef = ref as unknown as Ref<HTMLDivElement>;

  if (reduce) {
    return (
      <Tag ref={tagRef} data-reveal-el="" data-reveal="off" className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={tagRef}
      data-reveal-el=""
      data-reveal="off"
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setShown(true)}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: REVEAL_EASE, delay }}
    >
      {children}
    </Tag>
  );
}
