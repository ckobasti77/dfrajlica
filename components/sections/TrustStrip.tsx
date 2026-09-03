import { trust } from "@/content/site";
import { Heart } from "@/components/ui/Icons";

export default function TrustStrip() {
  return (
    <section aria-label={trust.map((t) => t.text).join(", ")} className="bg-plum-100">
      <div className="container-x">
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-4 text-[15px] font-medium text-ink lg:gap-x-24 lg:py-5 lg:text-[16px]">
          {trust.map((item) => (
            <li key={item.text} className="inline-flex items-center gap-2.5">
              <Heart size={16} className="text-plum-500" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
