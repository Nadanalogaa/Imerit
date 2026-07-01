import { useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
 value?: string;
 onChange: (dataUrl?: string) => void;
}

export function PhotoUpload({ value, onChange }: Props) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [error, setError] = useState<string | null>(null);

 const handleFile = (file: File) => {
 setError(null);
 if (!file.type.startsWith("image/")) {
 setError("Please choose an image file");
 return;
 }
 if (file.size > 4 * 1024 * 1024) {
 setError("Image must be under 4 MB");
 return;
 }
 const reader = new FileReader();
 reader.onload = () => onChange(reader.result as string);
 reader.readAsDataURL(file);
 };

 return (
 <div className="flex flex-col items-center gap-4 sm:flex-row">
 <motion.div
 whileHover={{ scale: 1.02 }}
 className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950"
 >
 {value ? (
 <img src={value} alt="Profile" className="h-full w-full object-cover" />
 ) : (
 <Camera size={36} className="text-zinc-400" />
 )}
 </motion.div>

 <div className="flex-1 text-center sm:text-left">
 <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Passport-size photo</p>
 <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
 A clear front-facing photo against a plain background works best. PNG or JPG, up to 4 MB.
 </p>

 <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
 <button
 type="button"
 onClick={() => inputRef.current?.click()}
 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
 >
 <Upload size={13} />
 {value ? "Replace" : "Upload photo"}
 </button>
 {value && (
 <button
 type="button"
 onClick={() => onChange(undefined)}
 className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-zinc-700 dark:hover:bg-rose-500/10"
 >
 <Trash2 size={13} />
 Remove
 </button>
 )}
 </div>
 {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
 </div>

 <input
 ref={inputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => {
 const f = e.target.files?.[0];
 if (f) handleFile(f);
 e.target.value = "";
 }}
 />
 </div>
 );
}
