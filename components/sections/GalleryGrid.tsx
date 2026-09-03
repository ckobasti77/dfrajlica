"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { RevealGroup, RevealItem } from "@/components/motion/RevealGroup";
import { REVEAL_EASE } from "@/components/motion/Reveal";
import Lightbox, { type LightboxImage } from "@/components/ui/Lightbox";
import { strings } from "@/components/ui/strings";

type GalleryGridProps = { images: readonly LightboxImage[] };

/** Reveal-time zoom on the tile image; inherits hidden/show from the RevealGroup. */
const imgVariants: Variants = {
  hidden: { scale: 1.06 },
  show: { scale: 1, transition: { duration: 0.6, ease: REVEAL_EASE } },
};

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);

  return (
    <>
      <RevealGroup
        as="ul"
        stagger={0.06}
        className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:gap-5 [&>li]:mb-3 sm:[&>li]:mb-4 lg:[&>li]:mb-5"
      >
        {images.map((img, i) => (
          <RevealItem key={img.src} as="li" className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${strings.openGallery}: ${img.alt}`}
              className="group block w-full overflow-hidden rounded-card bg-plum-100 shadow-soft transition-[transform,box-shadow] duration-250 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-plum"
              style={{ aspectRatio: `${img.width} / ${img.height}` }}
            >
              <motion.span variants={imgVariants} className="block h-full w-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
                />
              </motion.span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>
      <Lightbox images={images} index={index} onClose={close} onIndexChange={setIndex} />
    </>
  );
}
