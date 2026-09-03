/** Shared class strings for the booking wizard (client + admin reuse a few). */

export const inputClass =
  "h-12 w-full rounded-xl border border-plum-300/50 bg-white px-4 text-ink placeholder:text-ink/40 outline-none transition-shadow duration-200 focus:ring-2 focus:ring-plum-500 aria-[invalid=true]:border-plum-700";

export const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export const errorClass = "mt-1.5 text-sm text-plum-700";

export const primaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-plum-700 px-6 font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-plum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98]";

export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-plum-300/60 bg-white px-5 text-sm font-medium text-plum-700 transition-colors duration-200 hover:bg-plum-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:cursor-not-allowed disabled:opacity-50";

export const channelButtonClass = secondaryButtonClass;

/** Selectable chip (service / time / staff). Pass `selected`. */
export function chipClass(selected: boolean, extra = ""): string {
  return [
    "inline-flex items-center justify-center rounded-full border text-[15px] font-medium transition-[background-color,border-color,color,transform] duration-200 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2",
    "motion-safe:active:scale-[0.97]",
    selected
      ? "border-plum-700 bg-plum-700 text-white shadow-plum"
      : "border-plum-300/60 bg-white text-ink hover:border-plum-500 hover:bg-plum-100",
    extra,
  ].join(" ");
}

export const eyebrowClass = "eyebrow text-plum-500";
