"use client";

import { useEffect, useState } from "react";
import { hero } from "@/content/site";
import { scrollToHash } from "@/components/SmoothScroll";
import { Phone } from "@/components/ui/Icons";

export default function MobileBar() {
  // Bar slides in once the hero CTA has scrolled away, and hides again over the
  // booking section.
  const [ctaGone, setCtaGone] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const hidden = !ctaGone || bookingInView;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const cta = document.getElementById("hero-primary-cta");
    const booking = document.getElementById("zakazivanje");
    const observers: IntersectionObserver[] = [];

    const markCtaGone = (gone: boolean) => setCtaGone(gone);
    if (cta) {
      const io = new IntersectionObserver(([entry]) => markCtaGone(!entry.isIntersecting), { threshold: 0 });
      io.observe(cta);
      observers.push(io);
    } else {
      markCtaGone(true); // no CTA to gate on — behave as before
    }

    if (booking) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) setBookingInView(entry.isIntersecting);
        },
        { threshold: 0.15 },
      );
      io.observe(booking);
      observers.push(io);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={[
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 lg:hidden",
        "bg-linear-to-t from-white via-white/90 to-transparent",
        "transition-transform duration-300 ease-out",
        hidden ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <button
        type="button"
        tabIndex={hidden ? -1 : 0}
        onClick={() => scrollToHash("#zakazivanje")}
        className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-pill bg-plum-700 text-[17px] font-semibold text-white shadow-plum-lg transition-colors hover:bg-plum-500 active:bg-plum-500"
      >
        <Phone size={22} />
        <span>{hero.ctaPrimary}</span>
      </button>
    </div>
  );
}
