"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from "./gsap";

/**
 * Window event name: dispatch `window.dispatchEvent(new Event(ROWS_CHANGED_EVENT))`
 * after rows mount/unmount (accordion toggle) to force a re-scan. A MutationObserver on
 * the scope already catches this in most cases; the event is a belt-and-braces hook.
 */
export const ROWS_CHANGED_EVENT = "price-group-toggled";

/**
 * Fade/rise rows (default `[data-row]`) with a 40ms stagger as they enter the viewport, once.
 * Rows never stay invisible: only gsap.from is used and every trigger is `once`.
 */
export function useStaggerRows(scope: RefObject<HTMLElement | null>, selector = "[data-row]"): void {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const root = scope.current;
      if (!root) return;

      const seen = new WeakSet<Element>();
      const triggers: ScrollTrigger[] = [];

      const scan = () => {
        const fresh = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => !seen.has(el));
        if (!fresh.length) return;
        fresh.forEach((el) => seen.add(el));
        triggers.push(
          ...ScrollTrigger.batch(fresh, {
            once: true,
            start: "top 88%",
            onEnter: (batch) =>
              gsap.from(batch, {
                autoAlpha: 0,
                y: 10,
                stagger: 0.04,
                duration: 0.5,
                ease: "power3.out",
                overwrite: true,
                immediateRender: true,
              }),
          }),
        );
      };

      let raf = 0;
      const rescan = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          scan();
          ScrollTrigger.refresh();
        });
      };

      scan();

      const observer = new MutationObserver(rescan);
      observer.observe(root, { childList: true, subtree: true });
      window.addEventListener(ROWS_CHANGED_EVENT, rescan);

      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener(ROWS_CHANGED_EVENT, rescan);
        triggers.forEach((t) => t.kill());
      };
    },
    { scope, dependencies: [selector] },
  );
}
