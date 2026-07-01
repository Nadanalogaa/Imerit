import { Link } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";

interface Props {
 title: string;
 subtitle?: string;
}

export function Placeholder({ title, subtitle }: Props) {
 return (
 <div className="min-h-screen">
 <header className="flex items-center justify-between px-6 py-5 md:px-10">
 <Link to="/" className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100">
 ← Back to home
 </Link>
 <ThemeToggle />
 </header>
 <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 text-center">
 <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
 {subtitle && <p className="mt-3 text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
 <p className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
 Coming up in the next milestone.
 </p>
 </main>
 </div>
 );
}
