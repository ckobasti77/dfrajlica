"use client";

import { useEffect, useState } from "react";
import { hero } from "@/content/site";
import { scrollToHash } from "@/components/SmoothScroll";
import { Phone } from "@/components/ui/Icons";

export default function MobileBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("zakazivanje");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setHidden(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    io.observe(target);
    return () => io.disconnect();
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
