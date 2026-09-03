"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { priceList, priceMeta, type PriceGroup, type PriceRow, type ServiceId } from "@/content/site";
import { RevealGroup, RevealItem } from "@/components/motion/RevealGroup";
import Ornament from "@/components/ui/Ornament";
import SectionTitle from "@/components/ui/SectionTitle";
import { ChevronDown } from "@/components/ui/Icons";
import { formatPrice, formatNumber } from "@/components/ui/format";
import { strings } from "@/components/ui/strings";

type GroupId = PriceGroup["id"];

const EASE = [0.16, 1, 0.3, 1] as const;
const TOGGLED_EVENT = "price-group-toggled";

/** Картица услуге → група у ценовнику */
const groupForService: Record<ServiceId, GroupId> = {
  manikir: "manikir",
  pedikir: "pedikir",
  trepavice: "obrve",
  depilacija: "depilacija",
  lice: "lice",
  "sprej-tan": "lice",
};

/**
 * Order-preserving split into two desktop columns (prefix + suffix). Because the
 * left column is the prefix and the right is the suffix, stacking left-then-right
 * on mobile reproduces the exact `priceList` order — no greedy reorder (B4).
 */
function splitColumns(groups: PriceGroup[]): [PriceGroup[], PriceGroup[]] {
  const weight = (g: PriceGroup) => g.rows.length + 3;
  const total = groups.reduce((s, g) => s + weight(g), 0);
  const left: PriceGroup[] = [];
  const right: PriceGroup[] = [];
  let acc = 0;
  for (const g of groups) {
    if (acc < total / 2 && left.length < groups.length - 1) {
      left.push(g);
      acc += weight(g);
    } else {
      right.push(g);
    }
  }
  return [left, right];
}

type Cells = { kind: "span"; value: string } | { kind: "pair"; left: string; right: string };

/** Two-column (Јана/Бранка) price parsing. */
function twoColCells(price: PriceRow["price"]): Cells {
  if (typeof price === "number") {
    const s = formatNumber(price);
    return { kind: "pair", left: s, right: s };
  }
  if (Array.isArray(price)) return { kind: "pair", left: formatNumber(price[0]), right: formatNumber(price[1]) };
  if (price.includes("/")) {
    const [l, r] = price.split("/").map((p) => p.trim());
    return { kind: "pair", left: l, right: r };
  }
  // "+300" and the like span both columns, right-aligned.
  return { kind: "span", value: price };
}

const PRICE_COL = "w-[7.5rem] shrink-0 sm:w-[11rem]";

export default function PriceList() {
  const reduce = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [openIds, setOpenIds] = useState<Set<GroupId>>(new Set());
  const initedFor = useRef<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Default open state per breakpoint: desktop → all open, mobile → first group.
  useEffect(() => {
    if (isDesktop === null || initedFor.current === isDesktop) return;
    initedFor.current = isDesktop;
    setOpenIds(isDesktop ? new Set(priceList.map((g) => g.id)) : new Set([priceList[0]?.id]));
  }, [isDesktop]);

  // A service card asks to open its matching group.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const target = groupForService[(e as CustomEvent<ServiceId>).detail];
      if (target) setOpenIds((prev) => new Set(prev).add(target));
    };
    window.addEventListener("open-price-group", onOpen);
    return () => window.removeEventListener("open-price-group", onOpen);
  }, []);

  const [left, right] = useMemo(() => splitColumns(priceList), []);

  const toggle = (id: GroupId) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRow = (row: PriceRow, twoCols: boolean) => {
    let priceEl;
    if (twoCols) {
      const cells = twoColCells(row.price);
      priceEl =
        cells.kind === "span" ? (
          <span className={`${PRICE_COL} text-right tabular-nums`}>{cells.value}</span>
        ) : (
          <span className={`${PRICE_COL} grid grid-cols-2 gap-x-2 text-right tabular-nums`}>
            <span className="min-w-0">{cells.left}</span>
            <span className="min-w-0">{cells.right}</span>
          </span>
        );
    } else {
      priceEl = <span className="shrink-0 text-right tabular-nums">{formatPrice(row.price)}</span>;
    }

    return (
      <RevealItem
        key={row.name}
        as="li"
        className="flex items-baseline py-[7px] text-[16px] leading-snug text-mocha lg:text-[17px]"
      >
        <span className="min-w-0 [overflow-wrap:anywhere]">{row.name}</span>
        <span className="leaders" aria-hidden="true" />
        {priceEl}
      </RevealItem>
    );
  };

  const renderGroup = (group: PriceGroup) => {
    const open = openIds.has(group.id);
    const panelId = `cenovnik-${group.id}`;
    const titleId = `${panelId}-naslov`;
    const twoCols = Boolean(group.columns);

    return (
      <section
        key={group.id}
        id={`${panelId}-grupa`}
        className="scroll-mt-[96px]"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className="m-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => toggle(group.id)}
            className="flex w-full items-center justify-between gap-4 border-b border-mocha/15 py-3 text-left font-serif text-[24px] font-medium text-mocha lg:text-[26px]"
          >
            <span>{group.title}</span>
            <ChevronDown
              size={22}
              className={`shrink-0 text-plum-500 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
            />
          </button>
        </h3>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="panel"
              id={panelId}
              role="region"
              aria-labelledby={titleId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { height: { duration: 0.4, ease: EASE }, opacity: { duration: 0.25 } }
              }
              style={{ overflow: "hidden" }}
              onAnimationComplete={() => window.dispatchEvent(new Event(TOGGLED_EVENT))}
            >
              <div className="pt-3">
                {twoCols && group.columns ? (
                  <div
                    className="flex items-end pb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-mocha/60"
                    aria-hidden="true"
                  >
                    <span className="min-w-0 flex-1">{strings.priceColumnService}</span>
                    <span className={`${PRICE_COL} grid grid-cols-2 gap-x-2 text-right`}>
                      <span className="min-w-0">{group.columns[0]}</span>
                      <span className="min-w-0">{group.columns[1]}</span>
                    </span>
                  </div>
                ) : null}

                <RevealGroup as="ul" stagger={0.04} className="m-0 list-none p-0">
                  {group.rows.map((row) => renderRow(row, twoCols))}
                </RevealGroup>

                {group.footnote ? (
                  <p className="mt-2 text-[14px] italic text-mocha/70">{group.footnote}</p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    );
  };

  return (
    <section
      id="cenovnik"
      aria-labelledby="cenovnik-title"
      className="section-y paper-grain relative overflow-hidden bg-paper text-mocha"
    >
      <Ornament corner="br" sizeClass="w-[150px] lg:w-[330px]" className="-right-6 -bottom-6 opacity-70 lg:-right-4" />
      <Ornament corner="tl" sizeClass="w-0 lg:w-[220px]" className="-left-12 top-10 opacity-40" />
      <div className="container-x relative z-10">
        <SectionTitle id="cenovnik-title" title={priceMeta.title} tone="mocha" />

        <div className="mx-auto mt-8 grid max-w-[1000px] grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-10">
          <div className="flex flex-col gap-8 lg:gap-10">{left.map(renderGroup)}</div>
          <div className="flex flex-col gap-8 lg:gap-10">{right.map(renderGroup)}</div>
        </div>

        <div className="mx-auto mt-10 max-w-[1000px] text-center text-[14px] text-mocha/70 lg:mt-14">
          <p>{priceMeta.note}</p>
          <p className="mt-1">{priceMeta.packages}</p>
        </div>
      </div>
    </section>
  );
}
