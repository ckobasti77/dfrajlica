"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { REVEAL_EASE } from "./Reveal";

type GroupTag = "div" | "ul" | "ol" | "section";
type ItemTag = "div" | "li" | "figure" | "span";

const GROUP_TAGS = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  section: motion.section,
} as const;

const ITEM_TAGS = {
  div: motion.div,
  li: motion.li,
  figure: motion.figure,
  span: motion.span,
} as const;

/** Item variant; children of RevealGroup consume this via inheritance only. */
export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: REVEAL_EASE } },
};

export type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  as?: GroupTag;
  /** seconds between children */
  stagger?: number;
  /** seconds before the first child */
  delayChildren?: number;
};

/**
 * Staggered container for NON-TEXT items (trust items, service cards, price rows,
 * gallery tiles, booking fields, footer columns). Wrap each child in `RevealItem`.
 * The parent's `whileInView` starts the stagger once; children carry no
 * initial/animate of their own.
 */
export function RevealGroup({
  children,
  className,
  as = "div",
  stagger = 0.08,
  delayChildren = 0.05,
}: RevealGroupProps) {
  const reduce = useReducedMotion();
  const Tag = GROUP_TAGS[as] as unknown as typeof motion.div;

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren } } }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </Tag>
  );
}

export type RevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: ItemTag;
};

export function RevealItem({ children, className, as = "div" }: RevealItemProps) {
  const reduce = useReducedMotion();
  const Tag = ITEM_TAGS[as] as unknown as typeof motion.div;

  // `data-reveal="off"` keeps the site-wide text reveal off this element: framer
  // owns its opacity here, so nothing animates the same opacity twice.
  if (reduce) {
    return (
      <Tag data-reveal="off" className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag data-reveal-el="" data-reveal="off" className={className} variants={revealItemVariants}>
      {children}
    </Tag>
  );
}
