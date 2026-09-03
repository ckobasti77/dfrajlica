/**
 * Single place where GSAP plugins are registered.
 * Every motion hook imports `gsap` / `ScrollTrigger` / `useGSAP` from here so the
 * registration happens exactly once and in the right order.
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_OK_QUERY = "(prefers-reduced-motion: no-preference)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export { gsap, useGSAP, ScrollTrigger };
