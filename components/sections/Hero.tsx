"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { hero } from "@/content/site";
import { scrollToHash } from "@/components/SmoothScroll";
import { useHeroTimeline } from "@/components/motion/useHeroTimeline";
import { useParallax } from "@/components/motion/useParallax";
import Button from "@/components/ui/Button";
import Ornament from "@/components/ui/Ornament";

const HeroLeaves = dynamic(() => import("@/components/hero/HeroLeaves"), { ssr: false });

export default function Hero() {
  const scope = useRef<HTMLElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLDivElement>(null);

  useHeroTimeline(scope);
  useParallax(tlRef, 12);
  useParallax(trRef, 12);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    scrollToHash(hash);
  };

  return (
    <section
      id="hero"
      ref={scope}
      aria-labelledby="hero-title"
      className="relative bg-white pt-[88px] lg:pt-[120px]"
    >
      <Ornament
        ref={tlRef}
        corner="tl"
        data-hero="ornament"
        breathe
        sizeClass="w-24 lg:w-[320px]"
        className="-left-5 -top-3 lg:-left-6 lg:-top-4"
      />
      <Ornament
        ref={trRef}
        corner="tr"
        data-hero="ornament"
        breathe
        breatheDelay={-4}
        sizeClass="w-24 lg:w-[300px]"
        className="-right-5 -top-3 lg:-right-4 lg:-top-6"
      />

      <div className="container-x relative z-10 flex flex-col items-center gap-8 pb-14 text-center lg:min-h-[calc(92svh-120px)] lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pb-24 lg:text-left">
        <div data-reveal="off" className="w-full max-w-[640px]">
          <p data-hero="eyebrow" className="eyebrow text-plum-500">
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" data-hero="title" className="h1 mt-4 text-ink lg:mt-6">
            {hero.title.map((line, i) => (
              <span key={line} className={`block ${i === hero.title.length - 1 ? "text-plum-700" : ""}`}>
                {line}
              </span>
            ))}
          </h1>
          <p data-hero="subtitle" className="mt-5 text-[16px] leading-relaxed text-ink/70 lg:mt-7 lg:text-[19px]">
            {hero.subtitle}
          </p>
          <p data-hero="subtitle" className="mt-3 hidden max-w-[52ch] text-[17px] text-ink/65 lg:block">
            {hero.intro}
          </p>
          <div data-hero="cta" className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:mt-10 lg:justify-start">
            <Button id="hero-primary-cta" href="#zakazivanje" variant="primary" size="lg" className="w-full sm:w-auto" onClick={(e) => go(e, "#zakazivanje")}>
              {hero.ctaPrimary}
            </Button>
            <Button href="#cenovnik" variant="secondary" size="lg" className="max-sm:hidden" onClick={(e) => go(e, "#cenovnik")}>
              {hero.ctaSecondary}
            </Button>
          </div>
        </div>

        <div className="w-full max-w-[560px] lg:ml-auto lg:max-w-[520px]">
          <div data-hero="card" className="relative lg:-m-[120px] lg:p-[120px]" style={{ overflow: "visible" }}>
            <div className="frame relative aspect-[4/5] w-full overflow-hidden rounded-photo shadow-plum-lg">
              <Image
                src={hero.image.src}
                alt={hero.image.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
              />
            </div>
            <HeroLeaves />
          </div>
        </div>
      </div>
    </section>
  );
}
