"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { priceList, priceMeta, type PriceGroup, type ServiceId } from "@/content/site";
import { ROWS_CHANGED_EVENT, useStaggerRows } from "@/components/motion/useStaggerRows";
import Ornament from "@/components/ui/Ornament";
import SectionTitle from "@/components/ui/SectionTitle";
import { ChevronDown } from "@/components/ui/Icons";
import { formatPrice, splitPrice } from "@/components/ui/format";
import { strings } from "@/components/ui/strings";

type GroupId = PriceGroup["id"];

/** Картица услуге → група у ценовнику */
const groupForService: Record<ServiceId, GroupId> = {
  manikir: "manikir",
  pedikir: "pedikir",
  trepavice: "obrve",
  depilacija: "depilacija",
  lice: "lice",
  "sprej-tan": "lice",
};

/** Подели групе у две колоне тако да буду приближно једнако високе, чувајући редослед. */
function balance(groups: PriceGroup[]): [PriceGroup[], PriceGroup[]] {
  const left: PriceGroup[] = [];
  const right: PriceGroup[] = [];
  let l = 0;
  let r = 0;
  const weight = (g: PriceGroup) => g.rows.length + 3;
  const sorted = [...groups].sort((a, b) => weight(b) - weight(a));
  const side = new Map<GroupId, "l" | "r">();
  for (const g of sorted) {
    if (l <= r) {
      side.set(g.id, "l");
      l += weight(g);
    } else {
      side.set(g.id, "r");
      r += weight(g);
    }
  }
  for (const g of groups) (side.get(g.id) === "l" ? left : right).push(g);
  return [left, right];
}

export default function PriceList() {
  const scope = useRef<HTMLElement>(null);
  const [openId, setOpenId] = useState<GroupId>(priceList[0]?.id ?? "manikir");
  const [isDesktop, setIsDesktop] = useState(false);

  useStaggerRows(scope);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ServiceId>).detail;
      const target = groupForService[detail];
      if (target) setOpenId(target);
    };
    window.addEventListener("open-price-group", onOpen);
    return () => window.removeEventListener("open-price-group", onOpen);
  }, []);

  // Rows that were hidden inside a closed accordion need ScrollTrigger to re-measure.
  useEffect(() => {
    window.dispatchEvent(new Event(ROWS_CHANGED_EVENT));
  }, [openId, isDesktop]);

  const [left, right] = useMemo(() => balance(priceList), []);

  const renderGroup = (group: PriceGroup) => {
    const open = isDesktop || openId === group.id;
    const panelId = `cenovnik-${group.id}`;
    const twoCols = Boolean(group.columns);
    return (
      <section key={group.id} id={`cenovnik-${group.id}-grupa`} className="scroll-mt-[96px]" aria-labelledby={`${panelId}-naslov`}>
        <h3 id={`${panelId}-naslov`} className="m-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpenId((cur) => (cur === group.id && !isDesktop ? cur : group.id))}
            className="flex w-full items-center justify-between gap-4 border-b border-mocha/15 py-3 text-left font-serif text-[24px] font-medium text-mocha lg:pointer-events-none lg:text-[26px]"
          >
            <span>{group.title}</span>
            <ChevronDown
              size={22}
              className={`shrink-0 text-plum-500 transition-transform duration-300 ease-out lg:hidden ${open ? "rotate-180" : ""}`}
            />
          </button>
        </h3>
        <div id={panelId} hidden={!open} className="pt-3">
          {twoCols && group.columns ? (
            <div className="flex items-end pb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-mocha/60" aria-hidden="true">
              <span className="flex-1">{strings.priceColumnService}</span>
              <span className="grid w-[9.5rem] grid-cols-2 text-right sm:w-[11rem]">
                <span>{group.columns[0]}</span>
                <span>{group.columns[1]}</span>
              </span>
            </div>
          ) : null}
          <ul className="m-0 list-none p-0">
            {group.rows.map((row) => {
              const cells = twoCols ? splitPrice(row.price) : null;
              return (
                <li
                  key={row.name}
                  data-row
                  className="flex items-baseline py-[7px] text-[16px] leading-snug text-mocha lg:text-[17px]"
                >
                  <span className="shrink-0 max-w-[62%] sm:max-w-none">{row.name}</span>
                  <span className="leaders" aria-hidden="true" />
                  {cells ? (
                    <span className="grid w-[9.5rem] shrink-0 grid-cols-2 text-right tabular-nums sm:w-[11rem]">
                      <span>{cells[0]}</span>
                      <span>{cells[1]}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 tabular-nums">{formatPrice(row.price)}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {group.footnote ? <p className="mt-2 text-[14px] italic text-mocha/70">{group.footnote}</p> : null}
        </div>
      </section>
    );
  };

  return (
    <section
      id="cenovnik"
      ref={scope}
      aria-labelledby="cenovnik-title"
      className="section-y paper-grain relative overflow-hidden bg-paper text-mocha"
    >
      <Ornament corner="br" sizeClass="w-[150px] lg:w-[330px]" className="-right-6 -bottom-6 opacity-70 lg:-right-4" />
      <Ornament corner="tl" sizeClass="w-[0px] lg:w-[220px]" className="-left-12 top-10 opacity-40" />
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
