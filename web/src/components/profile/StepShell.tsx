import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
 title: string;
 subtitle?: string;
 children: React.ReactNode;
 onBack?: () => void;
 onNext: () => void;
 nextLabel?: string;
 isLast?: boolean;
}

export function StepShell({
 title,
 subtitle,
 children,
 onBack,
 onNext,
  nextLabel = "Continue",
  isLast = false,
}: Props) {
 const handleNavigation = (callback: () => void) => {
   const active = document.activeElement;
   if (active instanceof HTMLElement) active.blur();
   callback();
   requestAnimationFrame(() => {
     window.scrollTo({ top: 0, behavior: "smooth" });
   });
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 0.3, ease: "easeOut" }}
 className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 md:p-7"
 >
 <div className="mb-5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
 <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
 {subtitle && <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
 </div>

 {children}

 <div className="mt-8 flex items-center justify-between gap-3">
 {onBack ? (
 <motion.button
 whileTap={{ scale: 0.97 }}
 type="button"
 onClick={() => handleNavigation(onBack)}
 className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-zinc-900/30 transition hover:shadow-lg hover:shadow-zinc-900/40 dark:bg-zinc-700 dark:shadow-zinc-700/30 dark:hover:shadow-zinc-700/40"
 >
 <ArrowLeft size={16} /> Back
 </motion.button>
 ) : (
 <span />
 )}

 <motion.button
 whileTap={{ scale: 0.97 }}
 type="button"
 onClick={() => handleNavigation(onNext)}
 className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
 >
 {nextLabel}
 {!isLast && <ArrowRight size={16} />}
 </motion.button>
 </div>
 </motion.div>
 );
}
