"use client";

import { bookingV2 as t } from "@/content/site";

export default function StepDots({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  const n = t.steps.length;
  return (
    <ol className="flex items-center gap-2" aria-label={t.stepOf(step + 1, n)}>
      {t.steps.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => done && onJump(i)}
              disabled={!done}
              aria-current={current ? "step" : undefined}
              className={[
                "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium transition-colors duration-200",
                current ? "bg-plum-100 text-plum-700" : done ? "text-plum-700 hover:bg-plum-100" : "text-ink/40",
                done ? "cursor-pointer" : "cursor-default",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-200",
                  current || done ? "bg-plum-700 text-white" : "bg-plum-100 text-ink/50",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < n - 1 ? <span aria-hidden="true" className="h-px w-4 bg-plum-300/60 sm:w-6" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
