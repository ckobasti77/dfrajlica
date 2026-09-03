"use client";

import Image from "next/image";
import type { ServiceId } from "@/content/site";
import { scrollToHash } from "@/components/SmoothScroll";

type ServiceCardProps = {
  id: ServiceId;
  title: string;
  short: string;
  image: string;
  alt: string;
};

export default function ServiceCard({ id, title, short, image, alt }: ServiceCardProps) {
  const onClick = () => {
    window.dispatchEvent(new CustomEvent<ServiceId>("open-price-group", { detail: id }));
    scrollToHash("#cenovnik");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col items-center rounded-card border border-plum-100 bg-white px-4 py-6 text-center shadow-soft transition-[transform,box-shadow] duration-250 ease-out hover:-translate-y-1 hover:shadow-plum focus-visible:-translate-y-1 lg:px-6 lg:py-8"
    >
      <span className="frame relative aspect-square w-[96px] overflow-hidden rounded-full ring-4 ring-plum-100 transition-[box-shadow] duration-250 group-hover:ring-plum-300/60 sm:w-[120px] lg:w-[160px]">
        <Image src={image} alt={alt} fill sizes="(max-width: 640px) 96px, (max-width: 1024px) 120px, 160px" className="object-cover" />
      </span>
      <span className="h3 mt-4 text-plum-700 lg:mt-5">{title}</span>
      <span className="mt-2 hidden text-[14.5px] leading-relaxed text-ink/65 min-[420px]:block lg:text-[15px]">{short}</span>
    </button>
  );
}
