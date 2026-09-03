"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { hero, nav, site } from "@/content/site";
import { scrollToHash } from "@/components/SmoothScroll";
import Button from "@/components/ui/Button";
import { Close, Menu } from "@/components/ui/Icons";
import { strings } from "@/components/ui/strings";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstLinkRef.current?.focus(), 60);
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [open, close]);

  const goBooking = () => {
    setOpen(false);
    scrollToHash("#zakazivanje");
  };

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToHash(href);
  };

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ease-out",
        scrolled || open
          ? "bg-white/85 backdrop-blur-md border-b border-plum-100 shadow-[0_1px_0_rgb(122_27_99/0.04)]"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-plum-700"
      >
        {strings.skipToContent}
      </a>
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <a
          href="#hero"
          onClick={(e) => onNavClick(e, "#hero")}
          className="relative z-[60] flex items-center rounded-md"
          aria-label={strings.homeLink}
        >
          <Image
            src="/logos/logo-wide.png"
            alt={site.name}
            width={1200}
            height={270}
            priority
            sizes="(max-width: 1023px) 178px, 267px"
            className="h-10 w-auto lg:h-[60px]"
          />
        </a>

        <nav aria-label={strings.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => onNavClick(e, item.href)}
                  className="text-[16px] font-medium text-ink/85 transition-colors duration-200 hover:text-plum-700"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:block">
          <Button variant="primary" size="md" onClick={goBooking}>
            {hero.ctaPrimary}
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="relative z-[60] -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-pill text-plum-700 transition-colors hover:bg-plum-100 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? strings.menuClose : strings.menuOpen}
          onClick={() => (open ? close() : setOpen(true))}
        >
          {open ? <Close size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            key="menu"
            role="dialog"
            aria-modal="true"
            aria-label={strings.mobileNav}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[55] flex flex-col bg-white pt-24 pb-10 lg:hidden"
          >
            <nav aria-label={strings.mobileNav} className="container-x flex-1">
              <ul className="flex flex-col gap-2">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduce ? 0 : 0.4,
                      delay: reduce ? 0 : 0.06 + i * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={item.href}
                      onClick={(e) => onNavClick(e, item.href)}
                      className="block border-b border-plum-100 py-4 font-serif text-[36px] leading-tight text-ink transition-colors hover:text-plum-700"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="container-x">
              <Button variant="primary" size="lg" block onClick={goBooking}>
                {hero.ctaPrimary}
              </Button>
              <p className="mt-4 text-center text-[15px] text-ink/60">{site.tagline}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
