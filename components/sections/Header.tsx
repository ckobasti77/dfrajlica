"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { hero, nav, site } from "@/content/site";
import { scrollToHash, lenisStop, lenisStart } from "@/components/SmoothScroll";
import Button from "@/components/ui/Button";
import Ornament from "@/components/ui/Ornament";
import { Close, Menu, Phone, Pin } from "@/components/ui/Icons";
import { strings } from "@/components/ui/strings";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Header row geometry, shared by the closed header and the open menu so nothing jumps. */
const ROW = "mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 lg:px-10";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const enable = () => setMounted(true);
    enable();
  }, []);

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

  // Scroll lock + Lenis pause + focus management + Escape + focus trap while open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    lenisStop();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (!dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    }, 60);

    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      lenisStart();
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

  // Header background: blur ONLY when scrolled and NOT open (backdrop-filter on the
  // header while open would create a containing block that broke the fixed dialog — B1).
  const blurred = scrolled && !open;

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ease-out",
          blurred
            ? "bg-white/85 backdrop-blur-md border-b border-plum-100 shadow-[0_1px_0_rgb(122_27_99/0.04)]"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
        data-reveal="off"
      >
        {/* Top scrim so the logo + hamburger always read over the hero ornaments (B2). */}
        {!blurred ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/90 via-white/60 to-transparent lg:hidden"
          />
        ) : null}

        <a
          href="#sadrzaj"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-plum-700"
        >
          {strings.skipToContent}
        </a>

        <div className={`${ROW} relative h-16 lg:h-20`}>
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
              sizes="(max-width: 1023px) 160px, 267px"
              className={`h-9 w-auto transition-transform duration-300 ease-out lg:h-[60px] lg:origin-left ${scrolled ? "lg:scale-[0.92]" : ""}`}
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
            className="relative z-[60] inline-flex h-11 w-11 items-center justify-center rounded-pill text-plum-700 transition-colors hover:bg-plum-100 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? strings.menuClose : strings.menuOpen}
            onClick={() => (open ? close() : setOpen(true))}
          >
            {open ? <Close size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  id={menuId}
                  key="mobile-menu"
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={strings.mobileNav}
                  data-reveal="off"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                  className="fixed inset-0 z-[70] flex min-h-[100dvh] flex-col overflow-hidden bg-white lg:hidden"
                >
                  {/* Top row mirrors the closed header exactly */}
                  <div className={`${ROW} h-16 shrink-0`}>
                    <a
                      href="#hero"
                      onClick={(e) => onNavClick(e, "#hero")}
                      className="flex items-center rounded-md"
                      aria-label={strings.homeLink}
                    >
                      <Image src="/logos/logo-wide.png" alt={site.name} width={1200} height={270} sizes="160px" className="h-9 w-auto" />
                    </a>
                    <button
                      type="button"
                      onClick={close}
                      aria-label={strings.menuClose}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-plum-700 transition-colors hover:bg-plum-100"
                    >
                      <Close size={26} />
                    </button>
                  </div>

                  <nav aria-label={strings.mobileNav} className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-6">
                    <ul className="flex flex-col">
                      {nav.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.08 + i * 0.06, ease: EASE }}
                        >
                          <a
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

                  <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.08 + nav.length * 0.06, ease: EASE }}
                    className="relative z-10 mx-auto w-full max-w-[1200px] shrink-0 px-6 pb-[max(24px,env(safe-area-inset-bottom))]"
                  >
                    <Button variant="primary" size="lg" block onClick={goBooking}>
                      {hero.ctaPrimary}
                    </Button>
                    <address className="mt-5 flex flex-col items-center gap-2 not-italic text-[15px] text-ink/70">
                      <span className="inline-flex items-center gap-2">
                        <Pin size={16} className="text-plum-500" />
                        {site.address.full}
                      </span>
                      <a href={site.phone.primary.tel} className="inline-flex items-center gap-2 font-semibold text-plum-700">
                        <Phone size={16} className="text-plum-500" />
                        <span className="tabular-nums">{site.phone.primary.display}</span>
                      </a>
                    </address>
                  </motion.div>

                  {/* Two watercolor leaves at 40% in the bottom corners */}
                  <Ornament corner="bl" opacity={0.4} sizeClass="w-[130px]" className="-left-3 -bottom-2" />
                  <Ornament corner="br" opacity={0.4} sizeClass="w-[120px]" className="-right-3 -bottom-2" />
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
