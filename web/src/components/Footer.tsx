import { Link } from "react-router-dom";
import { Heart, Mail, MapPin } from "lucide-react";
import { Brand } from "./Brand";

export function Footer() {
 return (
 <footer className="relative w-full overflow-hidden bg-zinc-950 px-5 pb-8 pt-12 text-zinc-300 md:px-10 md:pb-10 md:pt-16 lg:px-14 xl:px-20">
 {/* Ambient gradient blobs picking up where ContactUs leaves off */}
 <div className="pointer-events-none absolute inset-0 -z-10">
 <div className="absolute -top-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-brand-500/10 to-amber-500/5 blur-[140px]" />
 <div className="absolute -bottom-40 right-1/3 h-[20rem] w-[20rem] rounded-full bg-gradient-to-br from-sky-500/10 to-violet-500/5 blur-[120px]" />
 </div>

 <div className="relative grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
 {/* Brand block */}
 <div>
 <Brand size="lg" forceTheme="dark" />
 <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
 Tamil Nadu's modern recruitment platform — connecting students and professionals across every field with the right opportunities, near home.
 </p>

 {/* Quick contact line */}
 <div className="mt-5 flex flex-col gap-2 text-xs text-zinc-400">
 <a href="mailto:hello@itamilrecruit.com" className="inline-flex items-center gap-2 transition hover:text-white">
 <Mail size={13} className="text-brand-400" />
 hello@itamilrecruit.com
 </a>
 <span className="inline-flex items-center gap-2">
 <MapPin size={13} className="text-brand-400" />
 Tamil Nadu, India
 </span>
 </div>

 {/* Social */}
 <div className="mt-6 flex items-center gap-2">
 <Social href="https://linkedin.com" label="LinkedIn">
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
 <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
 </svg>
 </Social>
 <Social href="https://twitter.com" label="X (Twitter)">
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
 </svg>
 </Social>
 <Social href="https://instagram.com" label="Instagram">
 <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="2" y="2" width="20" height="20" rx="5" />
 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
 <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
 </svg>
 </Social>
 </div>
 </div>

 <Col title="Platform">
 <FooterLink to="/candidate">For candidates</FooterLink>
 <FooterLink to="/employer">For employers</FooterLink>
 <FooterHash to="#why">Why us</FooterHash>
 <FooterHash to="#about">About</FooterHash>
 </Col>

 <Col title="Support">
 <FooterHash to="#contact">Contact us</FooterHash>
 <FooterHash to="#suggestions">Suggestions</FooterHash>
 <FooterLink to="/admin">Admin login</FooterLink>
 <FooterLink to="/super-admin">Super admin</FooterLink>
 </Col>

 <Col title="Legal">
 <FooterAnchor href="#">Privacy policy</FooterAnchor>
 <FooterAnchor href="#">Terms of service</FooterAnchor>
 <FooterAnchor href="#">Refund policy</FooterAnchor>
 <FooterAnchor href="#">DPDP compliance</FooterAnchor>
 </Col>
 </div>

 {/* Bottom strip */}
 <div className="relative mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11.5px] text-zinc-500 md:flex-row md:items-center">
 <p>© {new Date().getFullYear()} RUDRAA Human Resource Solutions Pvt. Ltd. All rights reserved.</p>
 <p className="inline-flex items-center gap-1.5">
 Made with <Heart size={11} className="fill-rose-500 text-rose-500" /> in Tamil Nadu
 </p>
 </div>
 </footer>
 );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <div>
 <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white">{title}</div>
 <div className="flex flex-col gap-2.5 text-sm text-zinc-400">{children}</div>
 </div>
 );
}

const linkClass =
 "inline-flex w-fit items-center text-zinc-400 transition hover:text-white";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
 return (
 <Link to={to} className={linkClass}>
 {children}
 </Link>
 );
}
function FooterHash({ to, children }: { to: string; children: React.ReactNode }) {
 return (
 <a href={to} className={linkClass}>
 {children}
 </a>
 );
}
function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }) {
 return (
 <a href={href} className={linkClass}>
 {children}
 </a>
 );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
 return (
 <a
 href={href}
 aria-label={label}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:border-brand-400/60 hover:bg-brand-500/15 hover:text-brand-300"
 >
 {children}
 </a>
 );
}
