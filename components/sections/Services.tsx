import { services } from "@/content/site";
import Reveal from "@/components/motion/Reveal";
import SectionTitle from "@/components/ui/SectionTitle";
import ServiceCard from "@/components/sections/ServiceCard";
import { strings } from "@/components/ui/strings";

export default function Services() {
  return (
    <section id="usluge" aria-labelledby="usluge-title" className="section-y relative bg-white">
      <div className="container-x">
        <SectionTitle id="usluge-title" title={strings.servicesTitle} sprig />
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {services.map((s, i) => (
            <Reveal key={s.id} as="li" delay={i * 0.06} className="h-full">
              <ServiceCard {...s} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
