import Image from "next/image";
import { footer, site } from "@/content/site";
import Ornament from "@/components/ui/Ornament";
import { Clock, Facebook, Instagram, Phone, Pin } from "@/components/ui/Icons";
import { strings } from "@/components/ui/strings";

export default function Footer() {
  return (
    <footer id="kontakt" aria-label={strings.address} className="relative overflow-hidden border-t border-plum-100 bg-white">
      <Ornament corner="bl" sizeClass="w-[130px] lg:w-[300px]" className="-left-4 -bottom-3 opacity-90" />
      <Ornament corner="br" sizeClass="w-[120px] lg:w-[280px]" className="-right-3 -bottom-3 opacity-90" />

      <div className="container-x relative z-10 flex flex-col items-center py-14 text-center lg:py-20">
        <Image
          src="/logos/logo-wide.png"
          alt={site.name}
          width={1200}
          height={270}
          sizes="(max-width: 1023px) 250px, 285px"
          className="h-14 w-auto lg:h-16"
        />
        <p className="mt-2 text-[15px] text-ink/60">{site.tagline}</p>

        <address className="mt-8 flex flex-col items-center gap-3 not-italic text-[16px] text-ink lg:text-[17px]">
          <a
            href={site.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={strings.openInMaps}
            className="inline-flex items-center gap-2 rounded-md transition-colors hover:text-plum-700"
          >
            <Pin size={18} className="text-plum-500" />
            <span>{site.address.full}</span>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href={site.phone.primary.tel} className="inline-flex items-center gap-2 rounded-md font-semibold text-plum-700 transition-colors hover:text-plum-500">
              <Phone size={18} className="text-plum-500" />
              <span className="tabular-nums">{site.phone.primary.display}</span>
            </a>
            <a href={site.phone.landline.tel} className="inline-flex items-center gap-2 rounded-md transition-colors hover:text-plum-700">
              <Phone size={18} className="text-plum-500" />
              <span className="tabular-nums">{site.phone.landline.display}</span>
            </a>
          </div>
          <p className="inline-flex items-start gap-2 text-ink/75">
            <Clock size={18} className="mt-1 shrink-0 text-plum-500" />
            <span>{site.hours.summary}</span>
          </p>
          <p className="text-[14px] text-ink/55">{site.address.transport}</p>
        </address>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-3" aria-label={strings.social}>
          <li>
            <a
              href={site.social.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-plum-100 px-4 text-[15px] font-medium text-plum-700 transition-colors hover:bg-plum-100"
            >
              <Instagram size={18} />
              <span>{site.social.instagram.handle}</span>
            </a>
          </li>
          <li>
            <a
              href={site.social.facebook.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-plum-100 px-4 text-[15px] font-medium text-plum-700 transition-colors hover:bg-plum-100"
            >
              <Facebook size={18} />
              <span>{site.social.facebook.handle}</span>
            </a>
          </li>
        </ul>

        <p className="mt-8 text-[14px] text-ink/55">
          {footer.copyright} · {footer.madeWith}
        </p>
      </div>
    </footer>
  );
}
