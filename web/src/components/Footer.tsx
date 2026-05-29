import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
                <span className="text-sm font-bold">iT</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">i-Tamil Recruit</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">by RUDRAA HR Solutions</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              Tamil Nadu's modern recruitment platform — connecting students and professionals across every field with the right opportunities.
            </p>
          </div>

          <Col title="Platform">
            <Link to="/candidate" className="hover:text-zinc-900 dark:hover:text-zinc-100">For candidates</Link>
            <Link to="/employer" className="hover:text-zinc-900 dark:hover:text-zinc-100">For employers</Link>
            <a href="#why" className="hover:text-zinc-900 dark:hover:text-zinc-100">Why us</a>
            <a href="#about" className="hover:text-zinc-900 dark:hover:text-zinc-100">About</a>
          </Col>

          <Col title="Support">
            <a href="#contact" className="hover:text-zinc-900 dark:hover:text-zinc-100">Contact us</a>
            <a href="#suggestions" className="hover:text-zinc-900 dark:hover:text-zinc-100">Suggestions</a>
            <Link to="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-100">Admin login</Link>
            <Link to="/super-admin" className="hover:text-zinc-900 dark:hover:text-zinc-100">Super admin</Link>
          </Col>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 md:flex-row md:items-center dark:border-zinc-800 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} RUDRAA Human Resource Solutions Pvt. Ltd. All rights reserved.</p>
          <p>Made with ❤️ in Tamil Nadu</p>
        </div>
      </div>
    </footer>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </div>
  );
}
