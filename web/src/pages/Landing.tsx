import { Navbar } from "../components/Navbar";
import { WelcomeStrip } from "../components/WelcomeStrip";
import { HeroCarousel } from "../components/HeroCarousel";
import { EntryCards } from "../components/EntryCards";
import { WhyUs } from "../components/WhyUs";
import { AboutUs } from "../components/AboutUs";
import { SuggestionForm } from "../components/SuggestionForm";
import { ContactUs } from "../components/ContactUs";
import { Footer } from "../components/Footer";

export function Landing() {
  return (
    <div className="scroll-smooth">
      <WelcomeStrip />
      <Navbar />
      <main>
        <HeroCarousel />
        <EntryCards />
        <WhyUs />
        <AboutUs />
        <SuggestionForm />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
