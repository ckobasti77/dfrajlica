import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import PriceList from "@/components/sections/PriceList";
import Gallery from "@/components/sections/Gallery";
import Booking from "@/components/sections/Booking";
import Footer from "@/components/sections/Footer";
import MobileBar from "@/components/ui/MobileBar";

export default function Home() {
  return (
    <>
      <Header />
      <main id="sadrzaj" className="flex-1">
        <Hero />
        <TrustStrip />
        <Services />
        <PriceList />
        <Gallery />
        <Booking />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
