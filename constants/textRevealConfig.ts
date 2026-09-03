/**
 * Site-wide word-by-word text reveal — configuration and the CSS the root layout
 * inlines to hide copy before first paint.
 *
 * This is a project-local port of the `text-reveal` skill. There is no
 * LanguageProvider here, so the locale/translation contract is dropped; the
 * split/restore contract (MOVE text nodes into `.reveal-word` spans, never
 * clone) is kept exactly.
 *
 * The runtime lives in `lib/textReveal.ts`; the once-mounted client component is
 * `components/motion/TextRevealGlobal.tsx`.
 */

export const TEXT_REVEAL = {
  /** Elements whose copy arrives word by word. */
  candidateSelector: "h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figcaption,[data-reveal='text']",

  /**
   * Subtrees that must stay readable the instant they appear, or whose opacity
   * another animation already owns. Anything inside one of these is never split
   * and never hidden by the pre-paint rule.
   */
  skipSelector:
    "header,nav,form,button,a,label,select,textarea,input,[aria-live],[role='dialog'],[data-reveal='off'],[data-no-reveal],.reveal-word,#admin-root,[data-admin]",

  /** Fire each element once, this far into the viewport (fraction of height). */
  enterRatio: 0.15,

  /** Copy longer than this fades as one block instead of splitting into words. */
  maxWords: 60,

  /** Per-word animation. */
  word: {
    /** seconds */
    duration: 0.55,
    /** seconds between words (order is randomized, not left-to-right) */
    stagger: 0.018,
    /** px lift */
    y: 10,
    /** px blur */
    blur: 6,
    /** expo-out */
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },

  /** Whole-element block fade (flex/grid boxes, over-maxWords copy). */
  block: {
    duration: 0.6,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },

  /** Marker attributes / flags (kept in one place so CSS + JS agree). */
  activeAttr: "data-text-reveal-active",
  readyAttr: "data-text-reveal-ready",
  stateAttr: "data-reveal-state",
  wordClass: "reveal-word",
} as const;

/**
 * The pre-paint hide rule, inlined into <head>. Copy is invisible until either
 * (a) the runtime marks it `data-reveal-state` (split → words carry their own
 * opacity, or block → the element fades in), or (b) the `active` flag is removed
 * by the head failsafe when the runtime never boots. With no JS at all the flag
 * is never set, so copy is visible.
 *
 * Crucially, candidates inside a skipped subtree (header/nav/forms/dialogs/
 * `data-reveal="off"`) are NEVER hidden — the runtime never reveals them, so
 * hiding them would leave chrome permanently invisible. This mirrors the
 * runtime's `closest(skipSelector)` check exactly.
 */
export function textRevealHideCss(): string {
  const { candidateSelector, skipSelector, activeAttr, stateAttr, wordClass } = TEXT_REVEAL;
  const skip = skipSelector;
  const hidden =
    `html[${activeAttr}] :is(${candidateSelector})` +
    `:not([${stateAttr}])` + // already processed
    `:not(:is(${skip}))` + // is itself chrome
    `:not(:is(${skip}) *)`; // lives inside chrome
  return `${hidden}{opacity:0}.${wordClass}{display:inline-block;white-space:pre;will-change:transform,opacity,filter}`;
}

/**
 * Synchronous head script: set the active flag before paint, and remove it after
 * a grace period if the runtime never signalled ready — so a failed JS bundle
 * can never leave copy permanently hidden.
 */
export function textRevealHeadScript(): string {
  const { activeAttr, readyAttr } = TEXT_REVEAL;
  return `(function(){var d=document.documentElement;d.setAttribute('${activeAttr}','');setTimeout(function(){if(!d.hasAttribute('${readyAttr}'))d.removeAttribute('${activeAttr}');},2600);})();`;
}
