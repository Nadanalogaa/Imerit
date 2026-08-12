import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Link2, Award } from "lucide-react";
import type { Certification } from "../../store/profile";

interface Props {
  value: Certification[];
  onChange: (rows: Certification[]) => void;
}

/**
 * Repeatable list of certifications — Coursera, AWS, PMP, GATE, etc.
 * Same visual language as ExperienceList / ProjectsList.
 */
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;
const MAX_YEAR = CURRENT_YEAR + 5;

export function CertificationsList({ value, onChange }: Props) {
  const add = () =>
    onChange([
      ...value,
      { name: "", issuer: "", issuedYear: undefined, expiryYear: undefined, credentialId: "", credentialUrl: "" },
    ]);

  const update = (i: number, patch: Partial<Certification>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {value.map((cert, i) => (
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
                <Award size={12} /> Certification {i + 1}
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
                label="Certification name"
                value={cert.name}
                onChange={(v) => update(i, { name: v })}
                placeholder="e.g. AWS Certified Solutions Architect"
                required
              />
              <Field
                label="Issuer"
                hint="(optional)"
                value={cert.issuer ?? ""}
                onChange={(v) => update(i, { issuer: v })}
                placeholder="e.g. AWS, Coursera, PMI"
              />

              <YearField
                label="Issued year"
                hint="(optional)"
                value={cert.issuedYear}
                onChange={(v) => update(i, { issuedYear: v })}
              />
              <YearField
                label="Expiry year"
                hint="(optional)"
                value={cert.expiryYear}
                onChange={(v) => update(i, { expiryYear: v })}
              />

              <Field
                label="Credential ID"
                hint="(optional)"
                value={cert.credentialId ?? ""}
                onChange={(v) => update(i, { credentialId: v })}
                placeholder="e.g. ABC-123-XYZ"
              />

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Credential URL <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="url"
                    value={cert.credentialUrl ?? ""}
                    onChange={(e) => update(i, { credentialUrl: e.target.value })}
                    placeholder="https://verify..."
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
                  />
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
        <Plus size={16} /> Add certification
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}

function YearField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
        {hint && <span className="ml-1 font-normal text-zinc-500">{hint}</span>}
      </label>
      <input
        type="number"
        min={MIN_YEAR}
        max={MAX_YEAR}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n = Number(raw);
          if (Number.isNaN(n)) return;
          onChange(n);
        }}
        placeholder={`${CURRENT_YEAR}`}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}
