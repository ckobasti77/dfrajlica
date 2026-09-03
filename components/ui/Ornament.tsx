import Image from "next/image";
import type { ComponentPropsWithRef } from "react";

export type OrnamentCorner = "tl" | "tr" | "bl" | "br";

/** Intrinsic PNG sizes of /images/ornaments/leaf-*.png */
const dims: Record<OrnamentCorner, { width: number; height: number }> = {
  tl: { width: 430, height: 300 },
  tr: { width: 396, height: 370 },
  bl: { width: 370, height: 264 },
  br: { width: 330, height: 264 },
};

const anchor: Record<OrnamentCorner, string> = {
  tl: "top-0 left-0",
  tr: "top-0 right-0",
  bl: "bottom-0 left-0",
  br: "bottom-0 right-0",
};

type OrnamentProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  corner: OrnamentCorner;
  /** Tailwind width classes, e.g. "w-[140px] lg:w-[300px]" */
  sizeClass?: string;
  /** White-on-plum variant */
  invert?: boolean;
  opacity?: number;
};

/**
 * Watercolor corner leaf, absolutely positioned inside a `relative` parent.
 * Decorative only: aria-hidden, pointer-events none, low z-index.
 */
export default function Ornament({
  corner,
  sizeClass = "w-[140px] lg:w-[300px]",
  invert = false,
  opacity,
  className = "",
  style,
  ...rest
}: OrnamentProps) {
  const { width, height } = dims[corner];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 select-none ${anchor[corner]} ${sizeClass} ${className}`.trim()}
      style={{
        aspectRatio: `${width} / ${height}`,
        opacity,
        filter: invert ? "brightness(0) invert(1)" : undefined,
        ...style,
      }}
      {...rest}
    >
      <Image
        src={`/images/ornaments/leaf-${corner}.png`}
        alt=""
        width={width}
        height={height}
        sizes="(max-width: 1023px) 160px, 340px"
        className="h-auto w-full"
        draggable={false}
      />
    </div>
  );
}
