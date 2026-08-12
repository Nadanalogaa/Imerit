import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Link2, Rocket } from "lucide-react";
import { handlePasteSanitized } from "../../lib/sanitizePaste";
import type { CandidateProject } from "../../store/profile";
import { ChipInput } from "./ChipInput";

interface Props {
  value: CandidateProject[];
  onChange: (rows: CandidateProject[]) => void;
}

/**
 * Repeatable list of standalone projects — personal / college / side work
 * that lives on the candidate profile itself (not scoped to a job). Mirrors
 * the visual language of ExperienceList so the two read as siblings.
 */
export function ProjectsList({ value, onChange }: Props) {
  const add = () =>
    onChange([
      ...value,
      { name: "", role: "", description: "", skills: [], showcaseUrl: "", startedAt: "", endedAt: "" },
    ]);

  const update = (i: number, patch: Partial<CandidateProject>) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {value.map((proj, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-white p-4 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                <Rocket size={12} /> Project {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-zinc-700 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Project name"
                value={proj.name}
                onChange={(v) => update(i, { name: v })}
                placeholder="e.g. Smart attendance system"
                required
              />
              <Field
                label="Your role"
                hint="(optional)"
                value={proj.role ?? ""}
                onChange={(v) => update(i, { role: v })}
                placeholder="e.g. Lead developer, Designer"
              />

              <Field
                label="Started"
                hint="(optional)"
                value={proj.startedAt ?? ""}
                onChange={(v) => update(i, { startedAt: v })}
                placeholder="YYYY-MM or YYYY"
              />
              <Field
                label="Ended"
                hint="(optional)"
                value={proj.endedAt ?? ""}
                onChange={(v) => update(i, { endedAt: v })}
                placeholder="YYYY-MM, YYYY or Present"
              />

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Showcase link <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="url"
                    value={proj.showcaseUrl ?? ""}
                    onChange={(e) => update(i, { showcaseUrl: e.target.value })}
                    placeholder="https://github.com/... or case study URL"
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Description <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <textarea
                  value={proj.description ?? ""}
                  onChange={(e) => update(i, { description: e.target.value })}
                  onPaste={(e) => handlePasteSanitized(e, (v) => update(i, { description: v }))}
                  rows={3}
                  placeholder="What problem it solved, your contribution, impact…"
                  className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Skills used <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <ChipInput
                  value={proj.skills ?? []}
                  onChange={(v) => update(i, { skills: v })}
                  max={10}
                  placeholder="Type a skill and press Enter"
                />
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
        <Plus size={16} /> Add project
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
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
        {hint && <span className="ml-1 font-normal text-zinc-500">{hint}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
