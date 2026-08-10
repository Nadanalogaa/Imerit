import { Navbar } from "../components/Navbar";
import { WelcomeStrip } from "../components/WelcomeStrip";
import { HeroCarousel } from "../components/HeroCarousel";
import { WhyUs } from "../components/WhyUs";
import { AboutUs } from "../components/AboutUs";
import { ContactUs } from "../components/ContactUs";
import { Footer } from "../components/Footer";

export function Landing() {
 return (
 <div className="scroll-smooth">
 <WelcomeStrip />
 <Navbar />
 <main>
 <HeroCarousel />
 <WhyUs />
 <AboutUs />
 <ContactUs />
 </main>
 <Footer />
 </div>
 );
}
