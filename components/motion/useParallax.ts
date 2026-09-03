"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";

/** Desktop + motion-safe only — ornament parallax is a large-screen flourish. */
const DESKTOP_MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * Subtle scroll-scrubbed vertical drift (default 40px) over the lifetime of the
 * closest <section> (or the element itself). Desktop + motion-safe only.
 */
export function useParallax(ref: RefObject<HTMLElement | null>, amount = 40): void {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(DESKTOP_MOTION_QUERY, () => {
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
