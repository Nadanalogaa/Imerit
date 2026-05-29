import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Check } from "lucide-react";
import type { Education, EducationLevel } from "../../store/profile";

interface LevelMeta {
  id: EducationLevel;
  label: string;
  hint?: string;
}

const LEVELS: LevelMeta[] = [
  { id: "10th", label: "10th Standard" },
  { id: "12th", label: "12th Standard" },
  { id: "diploma", label: "Diploma" },
  { id: "ug", label: "Undergraduate (UG)" },
  { id: "pg", label: "Postgraduate (PG)" },
  { id: "mphil", label: "M.Phil" },
  { id: "phd", label: "Ph.D" },
  { id: "other", label: "Other Courses" },
];

const yearNow = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => yearNow - i);

interface Props {
  value: Education[];
  onChange: (next: Education[]) => void;
}

export function EducationStep({ value, onChange }: Props) {
  const map = new Map(value.map((e) => [e.level, e]));

  const update = (level: EducationLevel, patch: Partial<Education>) => {
    const existing = map.get(level) ?? { level, enabled: false };
    const next: Education = { ...existing, ...patch };
    const others = value.filter((e) => e.level !== level);
    onChange([...others, next].sort(byLevelOrder));
  };

  const toggle = (level: EducationLevel) => {
    const existing = map.get(level);
    if (!existing) {
      update(level, { enabled: true });
    } else {
      update(level, { enabled: !existing.enabled });
    }
  };

  const enabledCount = value.filter((e) => e.enabled).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-gradient-to-r from-brand-50 to-amber-50 px-4 py-3 dark:border-zinc-800 dark:from-brand-500/10 dark:to-amber-500/5">
        <div className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-200">
          <GraduationCap size={18} className="text-brand-600 dark:text-brand-400" />
          <span>Tick every level you have, then add the details.</span>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-400">
          {enabledCount} added
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {LEVELS.map((meta) => {
          const edu = map.get(meta.id);
          const enabled = edu?.enabled ?? false;
          return (
            <LevelCard
              key={meta.id}
              meta={meta}
              edu={edu}
              enabled={enabled}
              onToggle={() => toggle(meta.id)}
              onChange={(p) => update(meta.id, p)}
            />
          );
        })}
      </div>
    </div>
  );
}

function LevelCard({
  meta,
  edu,
  enabled,
  onToggle,
  onChange,
}: {
  meta: LevelMeta;
  edu: Education | undefined;
  enabled: boolean;
  onToggle: () => void;
  onChange: (p: Partial<Education>) => void;
}) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={[
        "overflow-hidden rounded-2xl border transition",
        enabled
          ? "border-brand-300 bg-white shadow-md shadow-brand-500/10 dark:border-brand-500/40 dark:bg-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <motion.div
          animate={{
            backgroundColor: enabled ? "#f97316" : "#ffffff",
            borderColor: enabled ? "#f97316" : "#d4d4d8",
          }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2"
        >
          {enabled && <Check size={13} strokeWidth={3} className="text-white" />}
        </motion.div>
        <span
          className={[
            "flex-1 text-sm font-semibold",
            enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300",
          ].join(" ")}
        >
          {meta.label}
        </span>
        {!enabled && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            <Plus size={14} className="inline" /> Add
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="grid gap-3 border-t border-zinc-200 px-4 py-4 sm:grid-cols-3 dark:border-zinc-800">
              <NumField
                label="Percentage"
                value={edu?.percentage}
                onChange={(v) => onChange({ percentage: v })}
                placeholder="e.g. 85"
                suffix="%"
                max={100}
              />
              <YearSelect
                label="Year passed"
                value={edu?.passedOutYear}
                onChange={(y) => onChange({ passedOutYear: y })}
              />
              <TextInput
                label="Institution / Board"
                value={edu?.institution ?? ""}
                onChange={(v) => onChange({ institution: v })}
                placeholder="School / college name"
              />
              {meta.id === "phd" && (
                <div className="sm:col-span-3">
                  <TextInput
                    label="Thesis title"
                    value={edu?.thesis ?? ""}
                    onChange={(v) => onChange({ thesis: v })}
                    placeholder="e.g. Multi-modal AI for low-resource languages"
                  />
                </div>
              )}
              {meta.id === "other" && (
                <div className="sm:col-span-3">
                  <TextInput
                    label="Course name"
                    value={edu?.courseName ?? ""}
                    onChange={(v) => onChange({ courseName: v })}
                    placeholder="e.g. PG Diploma in Data Science"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  max,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            if (v !== undefined && max !== undefined && v > max) return;
            onChange(v);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function YearSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (y: number | undefined) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <option value="">Select year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}

const LEVEL_ORDER: EducationLevel[] = ["10th", "12th", "diploma", "ug", "pg", "mphil", "phd", "other"];
const byLevelOrder = (a: Education, b: Education) =>
  LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
