"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, MOTION_OK_QUERY } from "./gsap";

/**
 * Subtle scroll-scrubbed vertical drift (default 40px) over the lifetime of the
 * closest <section> (or the element itself). No-op under prefers-reduced-motion.
 */
export function useParallax(ref: RefObject<HTMLElement | null>, amount = 40): void {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK_QUERY, () => {
        gsap.to(el, {
          y: amount,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { dependencies: [amount] },
  );
}
