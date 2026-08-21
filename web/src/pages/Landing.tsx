import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { WelcomeStrip } from "../components/WelcomeStrip";
import { HeroCarousel } from "../components/HeroCarousel";
import { WhyUs } from "../components/WhyUs";
import { AboutUs } from "../components/AboutUs";
import { ContactUs } from "../components/ContactUs";

export function Landing() {
 const { hash } = useLocation();

 // Scroll-to-hash after mount. When the user clicks a nav anchor like
 // /#why from another page, the browser sometimes fires the built-in
 // scroll BEFORE React renders the target section — so the page ends
 // up at the top. Wait one frame so React commits the DOM, then
 // scrollIntoView on whatever element the hash points to.
 useEffect(() => {
 if (!hash) return;
 const id = hash.replace(/^#/, "");
 if (!id) return;
 // requestAnimationFrame → the target element is definitely in the DOM.
 const raf = requestAnimationFrame(() => {
 const el = document.getElementById(id);
 if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
 });
 return () => cancelAnimationFrame(raf);
 }, [hash]);

 return (
 <div className="scroll-smooth">
 <WelcomeStrip />
 <main>
 <HeroCarousel />
 <WhyUs />
 <AboutUs />
 <ContactUs />
 </main>
 </div>
 );
}
