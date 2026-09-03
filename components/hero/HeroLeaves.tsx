"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import CanvasErrorBoundary from "./CanvasErrorBoundary";

/* three/R3F are only downloaded when the 3D path is actually taken (desktop, motion allowed, WebGL ok). */
const LeafScene = lazy(() => import("./LeafScene"));

/* Below lg the Hero wrapper equals the photo card (no 120px leaf padding), so the 3D scene would sit inside the photo. */
const MOBILE_QUERY = "(max-width: 1023px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Static fallback placement, as % of the layer (the layer = wrapper around the photo card).
 * leaf3d-a/b.png are cut from the live 3D scene at 3x (see docs/DECISIONS.md), so the
 * static path and the WebGL path show the same glass.
 */
const STATIC = {
  /* < lg: the wrapper equals the card; >= lg: the wrapper is the card + 120px padding (see Hero.tsx) */
  /* lg values are derived from POSITIONS in LeafScene.tsx, so the PNGs sit where the
     3D sprigs will appear and the cross-fade does not jump.
     Below lg only `b` is shown, placed as in mobile.png: right edge of the photo,
     about three quarters of the way down. */
  a: "left-[-2%] top-[3%] w-[36%] lg:left-[3%] lg:top-[15%] lg:w-[21%]",
  b: "right-[-2%] bottom-[12%] w-[32%] lg:right-[8%] lg:bottom-[9%] lg:w-[23%]",
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
        width={420}
        height={379}
        sizes="(max-width: 1023px) 0px, 21vw"
        className={`absolute hidden h-auto select-none lg:block ${STATIC.a}`}
        style={{ filter: STATIC.shadow }}
        draggable={false}
      />
      <Image
        src="/images/ornaments/leaf3d-b.png"
        alt=""
        width={420}
        height={365}
        sizes="(max-width: 1023px) 32vw, 23vw"
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
  /** photo-card size / layer size. Hero.tsx pads the wrapper by 120px at lg, but the
   *  exact numbers move with the breakpoint, so measure instead of assuming. */
  const [card, setCard] = useState({ x: 520 / 760, y: 650 / 890 });

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

  useEffect(() => {
    const layer = ref.current;
    const frame = layer?.parentElement?.querySelector(".frame");
    if (!layer || !frame || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const a = layer.getBoundingClientRect();
      const b = frame.getBoundingClientRect();
      if (!a.width || !a.height) return;
      setCard((prev) => {
        const next = { x: b.width / a.width, y: b.height / a.height };
        return Math.abs(next.x - prev.x) < 0.002 && Math.abs(next.y - prev.y) < 0.002 ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(layer);
    ro.observe(frame);
    return () => ro.disconnect();
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
              style={{
                opacity: ready ? 1 : 0,
                /* the reference sprigs sit on a soft plum glow; WebGL cannot cast that
                   onto the DOM behind the canvas, so the shadow is applied to the layer */
                filter: "drop-shadow(0 14px 18px rgb(122 27 99 / 0.28))",
              }}
            >
              <LeafScene active={active} onReady={onReady} card={card} />
            </div>
          </Suspense>
        </CanvasErrorBoundary>
      )}
    </div>
  );
}
