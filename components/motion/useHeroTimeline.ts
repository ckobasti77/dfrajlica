"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, MOTION_OK_QUERY, prefersReducedMotion } from "./gsap";
import { splitWords, restoreWords } from "@/lib/textReveal";

/**
 * Hero entrance choreography. The hero copy is owned by this GSAP timeline
 * (its wrapper is `data-reveal="off"`, so the site-wide text reveal skips it),
 * but it still arrives WORD BY WORD via the shared `splitWords`/`restoreWords`
 * from `lib/textReveal.ts` — never a local splitter, never a block fade — synced
 * with the photo card and the leaves.
 *
 *  [data-hero="eyebrow"]   - kicker, words rise + de-blur
 *  [data-hero="title"]     - H1 (keeps the plum „лепоту" span), words rise + de-blur
 *  [data-hero="subtitle"]  - supporting lines, words rise + de-blur
 *  [data-hero="card"]      - photo, scale .96->1 + fade
 *  [data-hero="ornament"]  - corner leaves: NOT animated here (always visible; B2)
 *
 * No-op under prefers-reduced-motion (gsap.matchMedia); the copy is then revealed
 * by the text-reveal runtime lifting the pre-paint hide.
 */
export function useHeroTimeline(scope: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const copySelectors = ['[data-hero="eyebrow"]', '[data-hero="title"]', '[data-hero="subtitle"]'];
      const copyEls = copySelectors.flatMap((sel) => Array.from(root.querySelectorAll<HTMLElement>(sel)));
      const card = Array.from(root.querySelectorAll<HTMLElement>('[data-hero="card"]'));
      const cta = Array.from(root.querySelectorAll<HTMLElement>('[data-hero="cta"]'));

      let tl: gsap.core.Timeline | null = null;
      const splitEls: HTMLElement[] = [];

      const build = () => {
        if (!root.isConnected) return;

        // Reduced motion: leave the copy as plain, visible text (the wrapper is
        // data-reveal="off", so nothing else hides it) and animate nothing.
        if (prefersReducedMotion()) return;

        // Split copy into words; the word spans keep their own opacity:0 until the
        // timeline animates them, so nothing flashes.
        const groups = copyEls.map((el) => {
          const spans = splitWords(el);
          el.setAttribute("data-reveal-state", "done");
          if (spans) splitEls.push(el);
          return { el, spans };
        });

        const mm = gsap.matchMedia();
        mm.add(MOTION_OK_QUERY, () => {
          tl = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });

          if (card.length) tl.from(card, { scale: 0.96, autoAlpha: 0, duration: 0.7 }, 0);

          let at = 0.1;
          for (const { spans } of groups) {
            if (spans && spans.length) {
              tl.fromTo(
                spans,
                { yPercent: 60, autoAlpha: 0, filter: "blur(6px)" },
                { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.6, stagger: 0.03, ease: "expo.out" },
                at,
              );
              at += 0.18;
            }
          }

          if (cta.length) tl.from(cta, { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.06 }, "-=0.3");

          return () => {
            tl?.kill();
          };
        });
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(build).catch(build);
      } else {
        build();
      }

      return () => {
        tl?.kill();
        splitEls.forEach((el) => restoreWords(el));
      };
    },
    { scope },
  );
}
