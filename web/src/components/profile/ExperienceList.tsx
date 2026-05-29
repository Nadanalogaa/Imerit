import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import type { Experience } from "../../store/profile";

interface Props {
  value: Experience[];
  onChange: (next: Experience[]) => void;
}

export function ExperienceList({ value, onChange }: Props) {
  const add = () => {
    onChange([...value, { company: "", role: "", fromDate: "", toDate: null }]);
  };

  const update = (i: number, patch: Partial<Experience>) => {
    onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {value.map((exp, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Experience {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-zinc-700 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Company"
                value={exp.company}
                onChange={(v) => update(i, { company: v })}
                placeholder="e.g. Zoho"
              />
              <Field
                label="Role"
                value={exp.role}
                onChange={(v) => update(i, { role: v })}
                placeholder="e.g. Software Engineer"
              />
              <Field
                label="From"
                type="month"
                value={exp.fromDate}
                onChange={(v) => update(i, { fromDate: v })}
              />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  To
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={exp.toDate ?? ""}
                    disabled={exp.toDate === null}
                    onChange={(e) => update(i, { toDate: e.target.value })}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <label className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={exp.toDate === null}
                      onChange={(e) =>
                        update(i, { toDate: e.target.checked ? null : "" })
                      }
                      className="accent-brand-500"
                    />
                    Present
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
      >
        <Plus size={16} /> Add a company
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
