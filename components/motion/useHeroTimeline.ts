"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, MOTION_OK_QUERY } from "./gsap";

/**
 * Hero entrance choreography. Targets (inside `scope`):
 *  [data-hero="ornament"]   - corner watercolor leaves, fade 0.8s
 *  [data-hero="eyebrow"]    - y 12->0 + fade 0.5s
 *  [data-hero="title-line"] - yPercent 110->0, 0.8s, stagger 0.08, expo.out (parent must be overflow:hidden)
 *  [data-hero="subtitle"]   - fade/rise 0.5s
 *  [data-hero="cta"]        - stagger 0.06
 *  [data-hero="card"]       - scale .96->1 + fade 0.7s
 *
 * Uses gsap.from + immediateRender, so the server-rendered markup is the final state.
 * No-op under prefers-reduced-motion (gsap.matchMedia).
 */
export function useHeroTimeline(scope: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const pick = (name: string): HTMLElement[] =>
        Array.from(root.querySelectorAll<HTMLElement>(`[data-hero="${name}"]`));

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK_QUERY, () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out", immediateRender: true, overwrite: "auto" },
        });

        const ornament = pick("ornament");
        const eyebrow = pick("eyebrow");
        const lines = pick("title-line");
        const subtitle = pick("subtitle");
        const cta = pick("cta");
        const card = pick("card");

        if (ornament.length) tl.from(ornament, { autoAlpha: 0, duration: 0.8 }, 0);
        if (eyebrow.length) tl.from(eyebrow, { y: 12, autoAlpha: 0, duration: 0.5 }, 0.05);
        if (lines.length) {
          tl.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: "expo.out" }, 0.1);
        }
        if (subtitle.length) tl.from(subtitle, { y: 14, autoAlpha: 0, duration: 0.5 }, "-=0.45");
        if (cta.length) tl.from(cta, { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.06 }, "-=0.35");
        if (card.length) tl.from(card, { scale: 0.96, autoAlpha: 0, duration: 0.7 }, "-=0.6");

        return () => {
          tl.kill();
        };
      });
    },
    { scope },
  );
}
