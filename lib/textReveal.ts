/**
 * Word-by-word text reveal runtime.
 *
 * Contract (from the `text-reveal` skill):
 *  - `splitWords` MOVES the original text nodes into `.reveal-word` spans — it
 *    never clones — so surrounding elements keep their identity and React keeps
 *    its handles. Nested inline elements (`<strong>`, a coloured `<span>`) are
 *    split per text node so their styling survives.
 *  - `restoreWords` collapses the spans back to plain text.
 *  - The runtime hides copy with WAAPI (independent of GSAP/ScrollTrigger) and
 *    reveals each element once, `enterRatio` into the viewport.
 */

import { TEXT_REVEAL } from "@/constants/textRevealConfig";

const { wordClass, stateAttr, skipSelector, candidateSelector, maxWords, word, block } = TEXT_REVEAL;

function reduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isSkipped(el: Element): boolean {
  return Boolean(el.closest(skipSelector));
}

/** Shuffle in place (Fisher–Yates) so words arrive in random order. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeWord(text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = wordClass;
  span.textContent = text;
  span.style.opacity = "0";
  return span;
}

/**
 * Recursively move the text nodes under `node` into `.reveal-word` spans.
 * Element children that match `skipSelector` are left untouched (atomic);
 * other inline elements are recursed into so their styling is preserved.
 * Collected word spans are pushed onto `out`.
 */
function splitNode(node: Node, out: HTMLSpanElement[]): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (!text.trim()) continue; // pure whitespace — leave it
      const parts = text.split(/(\s+)/); // keep the whitespace chunks
      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = makeWord(part);
          frag.appendChild(span);
          out.push(span);
        }
      }
      node.replaceChild(frag, child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      if (el.classList.contains(wordClass)) continue;
      if (el.matches(skipSelector)) continue; // atomic — keep as-is
      splitNode(el, out);
    }
  }
}

/**
 * Split `el` into word spans. Returns the created spans, or `null` when the
 * element should fade as one block instead (flex/grid container, or copy longer
 * than `maxWords`).
 */
export function splitWords(el: HTMLElement): HTMLSpanElement[] | null {
  if (el.dataset.reveal === "off") return null;
  const display = getComputedStyle(el).display;
  if (display.includes("flex") || display.includes("grid")) return null;

  const out: HTMLSpanElement[] = [];
  splitNode(el, out);
  if (out.length === 0) return null;
  if (out.length > maxWords) {
    restoreWords(el);
    return null;
  }
  return out;
}

/** Collapse every `.reveal-word` under `el` back into plain text. */
export function restoreWords(el: HTMLElement): void {
  const spans = el.querySelectorAll<HTMLSpanElement>(`.${wordClass}`);
  spans.forEach((span) => {
    span.replaceWith(document.createTextNode(span.textContent ?? ""));
  });
  el.normalize();
}

function animateWords(spans: HTMLSpanElement[]): void {
  const order = shuffle(spans.map((_, i) => i));
  order.forEach((rank, idx) => {
    const span = spans[idx];
    span.animate(
      [
        { opacity: 0, transform: `translateY(${word.y}px)`, filter: `blur(${word.blur}px)` },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
      ],
      { duration: word.duration * 1000, delay: rank * word.stagger * 1000, easing: word.easing, fill: "both" },
    );
    span.style.opacity = "";
    if (idx === spans.length - 1) {
      // best-effort will-change cleanup once the last word is done
      const total = (rank * word.stagger + word.duration) * 1000 + 60;
      window.setTimeout(() => spans.forEach((s) => (s.style.willChange = "auto")), total);
    }
  });
}

function blockFade(el: HTMLElement): void {
  el.animate(
    [
      { opacity: 0, transform: `translateY(${word.y}px)` },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: block.duration * 1000, easing: block.easing, fill: "both" },
  );
}

/**
 * Boot the site-wide reveal. Returns a disposer. Splits after fonts are ready so
 * Cyrillic glyph metrics are final; reveals each element once via one
 * IntersectionObserver, and re-scans DOM mutations (accordion, lightbox,
 * success card) on a debounced MutationObserver.
 */
export function createTextRevealRuntime(): () => void {
  const root = document.documentElement;

  if (reduced()) {
    // No motion: release the pre-paint hide rule, animate nothing.
    root.setAttribute(TEXT_REVEAL.readyAttr, "");
    root.removeAttribute(TEXT_REVEAL.activeAttr);
    return () => {};
  }

  let io: IntersectionObserver | null = null;
  let mo: MutationObserver | null = null;
  let disposed = false;
  const observed = new Set<HTMLElement>();

  const reveal = (el: HTMLElement) => {
    observed.delete(el);
    io?.unobserve(el);
    if (el.getAttribute(stateAttr) === "done") return;
    const spans = splitWords(el);
    el.setAttribute(stateAttr, "done");
    if (spans) animateWords(spans);
    else blockFade(el);
  };

  const collect = (): HTMLElement[] => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(candidateSelector));
    return els.filter((el) => !el.hasAttribute(stateAttr) && !isSkipped(el));
  };

  // The shrunk root never reaches the last ~enterRatio of the page, so the very
  // bottom elements (e.g. the footer) can't cross it. When scrolled to the end,
  // reveal any still-pending element that is on screen.
  const bottomCatch = () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (!atBottom) return;
    for (const el of Array.from(observed)) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
    }
  };

  const start = () => {
    if (disposed) return;
    root.setAttribute(TEXT_REVEAL.readyAttr, "");

    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        }
      },
      // Shrink the viewport from the bottom by enterRatio so an element reveals
      // once its top has come `enterRatio` of the way up the screen.
      { rootMargin: `0px 0px -${Math.round(TEXT_REVEAL.enterRatio * 100)}% 0px`, threshold: 0 },
    );

    const observeAll = () =>
      collect().forEach((el) => {
        observed.add(el);
        io?.observe(el);
      });
    observeAll();
    bottomCatch();

    let raf = 0;
    mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(observeAll);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("scroll", bottomCatch, { passive: true });
    window.addEventListener("resize", bottomCatch, { passive: true });
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    start();
  }

  return () => {
    disposed = true;
    io?.disconnect();
    mo?.disconnect();
    window.removeEventListener("scroll", bottomCatch);
    window.removeEventListener("resize", bottomCatch);
  };
}
