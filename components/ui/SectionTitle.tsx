import Image from "next/image";
import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle?: ReactNode;
  /** faint watercolor sprig behind the heading */
  sprig?: boolean;
  align?: "center" | "left";
  tone?: "ink" | "mocha" | "white";
  className?: string;
  id?: string;
};

const tones = {
  ink: { h: "text-ink", p: "text-ink/65" },
  mocha: { h: "text-mocha", p: "text-mocha/70" },
  white: { h: "text-white", p: "text-white/80" },
} as const;

export default function SectionTitle({
  title,
  subtitle,
  sprig = false,
  align = "center",
  tone = "ink",
  className = "",
  id,
}: SectionTitleProps) {
  const t = tones[tone];
  return (
    <div className={`${align === "center" ? "text-center" : "text-left"} ${className}`.trim()}>
      <h2 id={id} className={`h2 relative inline-block ${t.h}`}>
        {sprig ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 left-[62%] -z-10 w-[150px] opacity-25 lg:-top-10 lg:w-[190px]"
            style={{ aspectRatio: "396 / 370" }}
          >
            <Image
              src="/images/ornaments/leaf-tr.avif"
              alt=""
              width={396}
              height={370}
              sizes="190px"
              className="h-auto w-full"
            />
          </span>
        ) : null}
        <span className="relative">{title}</span>
      </h2>
      {subtitle ? <p className={`mx-auto mt-3 max-w-[60ch] text-[17px] ${t.p}`}>{subtitle}</p> : null}
    </div>
  );
}
