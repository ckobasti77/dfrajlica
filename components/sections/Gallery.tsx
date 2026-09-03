import { gallery, site } from "@/content/site";
import manifest from "@/public/images/instagram/manifest.json";
import GalleryGrid from "@/components/sections/GalleryGrid";
import SectionTitle from "@/components/ui/SectionTitle";
import { ArrowRight, Instagram } from "@/components/ui/Icons";
import { strings } from "@/components/ui/strings";
import type { LightboxImage } from "@/components/ui/Lightbox";

type ManifestEntry = { file: string; width: number; height: number };

const dims = new Map<string, { width: number; height: number }>(
  (manifest as ManifestEntry[]).map((m) => [`/images/instagram/${m.file}`, { width: m.width, height: m.height }]),
);

const images: LightboxImage[] = gallery.images.map((img) => {
  const d = dims.get(img.src) ?? { width: 1440, height: 1440 };
  return { src: img.src, alt: img.alt, width: d.width, height: d.height };
});

export default function Gallery() {
  return (
    <section id="galerija" aria-labelledby="galerija-title" className="section-y bg-white">
      <div className="container-x">
        <SectionTitle id="galerija-title" title={gallery.title} subtitle={gallery.subtitle} sprig />
        <div className="mt-10 lg:mt-14">
          <GalleryGrid images={images} />
        </div>
        <div className="mt-8 text-center lg:mt-10">
          <a
            href={site.social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill border border-plum-300 px-5 py-2.5 text-[15px] font-semibold text-plum-700 transition-colors hover:bg-plum-100"
          >
            <Instagram size={18} />
            <span>{strings.moreOnInstagram}</span>
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
