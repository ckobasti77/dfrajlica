"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion/gsap";

/** Sticky header height compensation (px). */
const HEADER_OFFSET = 80;

let lenis: Lenis | null = null;

function resolveHash(hash: string): HTMLElement | null {
  if (!hash.startsWith("#") || hash.length < 2) return null;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep raw id */
  }
  return document.getElementById(id);
}

/**
 * Smooth-scroll to an in-page anchor (e.g. "#cenovnik") with header offset and
 * update the URL hash. Works before Lenis is ready (native fallback).
 */
export function scrollToHash(hash: string): void {
  if (typeof window === "undefined") return;
  const el = resolveHash(hash);
  if (!el) return;

  if (lenis) {
    lenis.scrollTo(el, { offset: -HEADER_OFFSET, duration: 1 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
  window.history.replaceState(null, "", hash);
}

/**
 * Mount once in app/layout.tsx. Renders nothing.
 * - Lenis (lerp .1) driven by the GSAP ticker, ScrollTrigger kept in sync.
 * - Click delegation for same-page `a[href^="#"]` links.
 * - Skipped entirely under prefers-reduced-motion (anchors still work natively).
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let tick: ((time: number) => void) | null = null;

    if (!reduced) {
      const instance = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
      lenis = instance;
      instance.on("scroll", () => ScrollTrigger.update());
      tick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href") ?? "";
      if (hash === "#" || hash === "#top") {
        event.preventDefault();
        if (lenis) lenis.scrollTo(0, { duration: 1 });
        else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }
      if (!resolveHash(hash)) return;
      event.preventDefault();
      scrollToHash(hash);
    };
    document.addEventListener("click", onClick);

    let initial = 0;
    if (window.location.hash) {
      const hash = window.location.hash;
      initial = window.setTimeout(() => scrollToHash(hash), 60);
    }

    return () => {
      window.clearTimeout(initial);
      document.removeEventListener("click", onClick);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
