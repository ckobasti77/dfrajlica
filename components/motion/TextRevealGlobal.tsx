"use client";

import { useEffect } from "react";
import { createTextRevealRuntime } from "@/lib/textReveal";

/**
 * Mounts the site-wide word-by-word text reveal exactly once. Renders nothing.
 * All timing/selectors live in `constants/textRevealConfig.ts`; the runtime in
 * `lib/textReveal.ts`. See the `text-reveal` skill.
 */
export default function TextRevealGlobal() {
  useEffect(() => {
    // Hand the non-text Reveal system control: until this attribute is present,
    // globals.css keeps [data-reveal-el] visible, so a failed hydration can
    // never leave those elements stuck at their SSR opacity:0.
    document.documentElement.setAttribute("data-motion-ready", "");
    return createTextRevealRuntime();
  }, []);
  return null;
}
