"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import CanvasErrorBoundary from "./CanvasErrorBoundary";

/* three/R3F are only downloaded when the 3D path is actually taken (desktop, motion allowed, WebGL ok). */
const LeafScene = lazy(() => import("./LeafScene"));

/* Below lg the Hero wrapper equals the photo card (no 120px leaf padding), so the 3D scene would sit inside the photo. */
const MOBILE_QUERY = "(max-width: 1023px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Static fallback placement, as % of the layer (the layer = wrapper around the photo card). */
const STATIC = {
  /* < lg: the wrapper equals the card; >= lg: the wrapper is the card + 120px padding (see Hero.tsx) */
  a: "left-[-2%] top-[3%] w-[36%] lg:left-[6%] lg:top-[7%] lg:w-[22%]",
  b: "right-[-3%] bottom-[-2%] w-[36%] lg:right-[5%] lg:bottom-[5%] lg:w-[25%]",
  shadow: "drop-shadow(0 18px 22px rgb(122 27 99 / 0.22))",
} as const;

type Mode = "static" | "3d";

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function decideMode(): Mode {
  if (window.matchMedia(MOBILE_QUERY).matches) return "static";
  if (window.matchMedia(REDUCED_QUERY).matches) return "static";
  return webglAvailable() ? "3d" : "static";
}

function StaticLeaves({ faded }: { faded: boolean }) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-500 ease-out"
      style={{ opacity: faded ? 0 : 1 }}
    >
      {/* top-left sprig: desktop fallback only (mobile.png shows a single bottom-right sprig) */}
      <Image
        src="/images/ornaments/leaf3d-a.png"
        alt=""
        width={235}
        height={188}
        sizes="(max-width: 1023px) 0px, 22vw"
        className={`absolute hidden h-auto select-none lg:block ${STATIC.a}`}
        style={{ filter: STATIC.shadow }}
        draggable={false}
      />
      <Image
        src="/images/ornaments/leaf3d-b.png"
        alt=""
        width={186}
        height={235}
        sizes="(max-width: 1023px) 36vw, 25vw"
        priority
        className={`absolute h-auto select-none ${STATIC.b}`}
        style={{ filter: STATIC.shadow }}
        draggable={false}
      />
    </div>
  );
}

export type HeroLeavesProps = { className?: string };

/**
 * Decorative glass-leaf layer for the hero photo card. Fills its `relative` parent.
 * - < 768px, prefers-reduced-motion, or no WebGL: static PNG sprigs.
 * - otherwise: R3F canvas (lazy), static PNGs stay visible until the GLB is decoded,
 *   then cross-fade (500ms). Any runtime failure falls back to the PNGs.
 */
export default function HeroLeaves({ className }: HeroLeavesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("static");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const apply = () => setMode(decideMode());
    apply();
    const queries = [window.matchMedia(MOBILE_QUERY), window.matchMedia(REDUCED_QUERY)];
    queries.forEach((q) => q.addEventListener("change", apply));
    return () => queries.forEach((q) => q.removeEventListener("change", apply));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "10% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const show3d = mode === "3d" && !failed;

  return (
    <div
      ref={ref}
      className={`absolute inset-0 pointer-events-none ${className ?? ""}`}
      aria-hidden="true"
    >
      <StaticLeaves faded={show3d && ready} />
      {show3d && (
        <CanvasErrorBoundary onError={onError}>
          <Suspense fallback={null}>
            <div
              className="absolute inset-0 transition-opacity duration-500 ease-out"
              style={{ opacity: ready ? 1 : 0 }}
            >
              <LeafScene active={active} onReady={onReady} />
            </div>
          </Suspense>
        </CanvasErrorBoundary>
      )}
    </div>
  );
}
