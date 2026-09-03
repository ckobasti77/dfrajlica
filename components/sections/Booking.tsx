import { booking, site } from "@/content/site";
import BookingForm from "@/components/booking/BookingForm";
import Ornament from "@/components/ui/Ornament";
import SectionTitle from "@/components/ui/SectionTitle";
import { Phone } from "@/components/ui/Icons";
import { strings } from "@/components/ui/strings";

const quickChannelIds = ["viber", "whatsapp", "instagram", "sms"] as const;

export default function Booking() {
  const msg = strings.quickMessage;
  const quick = booking.channels.filter((c) => (quickChannelIds as readonly string[]).includes(c.id));

  return (
    <section id="zakazivanje" aria-labelledby="zakazivanje-title" className="section-y relative overflow-hidden bg-plum-700 text-white">
      <Ornament corner="bl" invert opacity={0.14} sizeClass="w-[150px] lg:w-[340px]" className="-left-4 -bottom-4" />
      <Ornament corner="br" invert opacity={0.14} sizeClass="w-[140px] lg:w-[320px]" className="-right-4 -bottom-4" />
      <Ornament corner="tr" invert opacity={0.1} sizeClass="w-[0px] lg:w-[260px]" className="-right-6 -top-8" />

      <div className="container-x relative z-10">
        <SectionTitle id="zakazivanje-title" title={booking.title} subtitle={booking.subtitle} tone="white" />

        <div className="mx-auto mt-10 max-w-[720px] rounded-card bg-white p-5 text-ink shadow-plum-lg sm:p-8 lg:mt-14 lg:p-10">
          <BookingForm />
        </div>

        <div className="mx-auto mt-10 flex max-w-[720px] flex-col items-center gap-5 lg:mt-12">
          <p className="eyebrow text-white/70">{strings.callUs}</p>
          <a
            href={site.phone.primary.tel}
            className="inline-flex items-center gap-3 rounded-pill bg-white px-8 py-4 font-serif text-[30px] font-medium leading-none text-plum-700 shadow-plum-lg transition-[transform,background-color] duration-250 ease-out hover:-translate-y-0.5 hover:bg-plum-100 focus-visible:outline-white sm:px-10 sm:text-[36px]"
          >
            <Phone size={28} className="text-plum-500" />
            <span className="tabular-nums">{site.phone.primary.display}</span>
          </a>
          <p className="text-[15px] text-white/70">{strings.orWrite}</p>
          <ul className="flex flex-wrap items-center justify-center gap-2.5">
            {quick.map((c) => (
              <li key={c.id}>
                <a
                  href={c.build(msg)}
                  target={c.id === "instagram" || c.id === "whatsapp" ? "_blank" : undefined}
                  rel={c.id === "instagram" || c.id === "whatsapp" ? "noopener noreferrer" : undefined}
                  className="inline-flex h-11 items-center rounded-pill border border-white/70 px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10 focus-visible:outline-white"
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-center text-[14px] text-white/60">{site.hours.note}</p>
        </div>
      </div>
    </section>
  );
}
