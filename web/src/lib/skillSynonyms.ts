/**
 * Skill matching — the primitive both matcher.ts (candidate → job) and
 * employerFilters.ts (employer → candidate) build on.
 *
 * WHY this file exists:
 *   The previous logic used naïve substring matching (`a.includes(b) ||
 *   b.includes(a)`), which produced false positives — a candidate with
 *   "JavaScript" matched a "Java" requirement because
 *   "javascript".includes("java") is true. This module fixes that with
 *   word-boundary regex + a canonical-form pass through a synonym map.
 *
 * How the algorithm works:
 *   1. Both sides are normalised (trim + lowercase).
 *   2. Both are looked up in ALIAS_TO_CANONICAL — "js" → "javascript",
 *      "react.js" → "react", "ml" → "machine learning", etc. That reduces
 *      "JS", "React.js", "Node.js" all to their canonical form.
 *   3. If canonical forms are equal → match.
 *   4. Otherwise, word-boundary containment either direction:
 *        a contains b as a whole word, OR b contains a as a whole word.
 *      This lets "React Native" match "React", but STOPS "JavaScript"
 *      from matching "Java" (there's no `\bjava\b` inside "javascript").
 *
 * Extending: add new (alias, canonical) pairs to SYNONYMS below. Keep
 * canonical forms unambiguous — don't map "pm" to "product manager" if
 * you also want it to mean "project manager"; pick one and drop the
 * other. Ambiguous abbreviations are worse than no abbreviation.
 */

/**
 * Bidirectional synonym pairs. First entry in each row is the canonical
 * form; every other entry is an alias that resolves to it. The map is
 * flattened into ALIAS_TO_CANONICAL at load time — pairs stay readable
 * here, lookups stay O(1) at runtime.
 */
const SYNONYMS: string[][] = [
  // ---- Frontend / JavaScript ecosystem
  ["javascript", "js", "ecmascript"],
  ["typescript", "ts"],
  ["react", "reactjs", "react.js"],
  ["react native", "reactnative"],
  ["angular", "angularjs", "angular.js"],
  ["vue", "vuejs", "vue.js"],
  ["node", "nodejs", "node.js"],
  ["next.js", "nextjs", "next js"],
  ["nuxt", "nuxtjs", "nuxt.js"],
  ["html", "html5"],
  ["css", "css3"],
  ["sass", "scss"],
  ["jquery"],

  // ---- Backend / databases
  ["mongodb", "mongo"],
  ["postgresql", "postgres", "psql"],
  ["mysql"],
  ["sql server", "mssql", "microsoft sql server"],
  ["oracle", "oracle db", "oracledb"],
  ["redis"],
  ["dynamodb", "dynamo"],
  ["cassandra"],
  ["elasticsearch", "elastic search", "elastic"],
  ["graphql"],
  ["rest api", "restful api", "rest"],
  ["grpc"],

  // ---- Languages
  ["python", "py"],
  ["java"],
  ["c#", "csharp", "c sharp", "dotnet", ".net"],
  ["c++", "cpp"],
  ["golang", "go"],
  ["ruby"],
  ["php"],
  ["kotlin"],
  ["swift"],
  ["dart"],
  ["rust"],
  ["scala"],
  ["r"],
  ["matlab"],

  // ---- Cloud / DevOps
  ["aws", "amazon web services"],
  ["gcp", "google cloud", "google cloud platform"],
  ["azure", "microsoft azure"],
  ["kubernetes", "k8s"],
  ["docker"],
  ["terraform"],
  ["ansible"],
  ["jenkins"],
  ["github actions"],
  ["ci/cd", "cicd", "ci cd", "continuous integration"],
  ["linux"],
  ["nginx"],

  // ---- Data / ML / AI
  ["machine learning", "ml"],
  ["deep learning", "dl"],
  ["artificial intelligence", "ai"],
  ["natural language processing", "nlp"],
  ["computer vision", "cv"],
  ["data science", "ds"],
  ["business intelligence", "bi"],
  ["power bi", "powerbi"],
  ["tableau"],
  ["pandas"],
  ["numpy"],
  ["tensorflow", "tf"],
  ["pytorch"],
  ["etl", "extract transform load"],

  // ---- Mobile
  ["flutter"],
  ["react native"],
  ["ionic"],

  // ---- Non-IT roles / departments
  ["human resources", "hr"],
  ["quality assurance", "qa"],
  ["quality control", "qc"],
  ["business analyst", "ba"],
  ["product manager", "product mgmt", "product management"],
  ["project manager", "project mgmt", "project management"],
  ["ui/ux", "ui ux", "user interface", "user experience"],
  ["graphic design", "graphic designer"],
  ["digital marketing", "digital mkt"],
  ["search engine optimization", "seo"],
  ["search engine marketing", "sem"],
  ["social media marketing", "smm"],
  ["content writing", "content writer", "copywriting"],
  ["accounts", "accounting", "accountant"],
  ["chartered accountant", "ca"],
  ["cost accountant", "cma"],
  ["company secretary", "cs"],
  ["gst"],
  ["tally"],
  ["sales"],
  ["business development", "bd", "biz dev"],
  ["customer support", "customer service", "cs support"],
  ["operations", "ops"],
  ["logistics"],
  ["supply chain", "scm"],
  ["procurement"],

  // ---- Vocational / trades
  ["electrician"],
  ["plumber"],
  ["welder", "welding"],
  ["carpenter", "carpentry"],
  ["mason", "masonry"],
  ["driver"],
  ["security guard", "security"],
  ["housekeeping"],
  ["nursing", "nurse"],
];

/**
 * Flatten SYNONYMS into an alias → canonical lookup. Every entry in a
 * row (including the canonical) maps to the canonical (index 0), so
 * canonicalize("JS") and canonicalize("JavaScript") both return
 * "javascript".
 */
const ALIAS_TO_CANONICAL: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const row of SYNONYMS) {
    if (row.length === 0) continue;
    const canonical = row[0]!.toLowerCase().trim();
    for (const alias of row) {
      out[alias.toLowerCase().trim()] = canonical;
    }
  }
  return out;
})();

/** Normalise + canonicalise a skill string. */
export function canonicalize(skill: string): string {
  const n = skill.toLowerCase().trim();
  return ALIAS_TO_CANONICAL[n] ?? n;
}

/** Escape a string for safe inclusion inside a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when `a` mentions `b` as a whole word (or vice-versa) after both
 * sides have been canonicalised. This is the workhorse — it powers both
 * candidate-side and employer-side matching so the two views stay
 * consistent.
 *
 * Examples:
 *   skillsMatch("JavaScript", "JS")          → true   (alias)
 *   skillsMatch("React.js", "React")         → true   (alias + WB)
 *   skillsMatch("React Native", "React")     → true   (WB contains)
 *   skillsMatch("JavaScript", "Java")        → false  (no \bjava\b in js)
 *   skillsMatch("Node.js", "Node")           → true   (alias)
 *   skillsMatch("Angular", "AngularJS")      → true   (alias)
 *   skillsMatch("Machine Learning", "ML")    → true   (alias)
 */
export function skillsMatch(a: string, b: string): boolean {
  const ca = canonicalize(a);
  const cb = canonicalize(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;

  // Word-boundary containment. `\b` matches between a word char (letter,
  // digit, underscore) and a non-word char — `\breact\b` matches "react.js"
  // (react followed by dot) but not "reactivate" (react followed by 'i').
  //
  // For skills that include punctuation ("c++", "c#", ".net") the
  // canonical form already carries the punctuation, so an exact-equal
  // hit above handles them; the regex path only runs on more general
  // strings where WB semantics are what we want.
  try {
    const aWord = new RegExp(`\\b${escapeRegex(cb)}\\b`, "i");
    if (aWord.test(ca)) return true;
    const bWord = new RegExp(`\\b${escapeRegex(ca)}\\b`, "i");
    if (bWord.test(cb)) return true;
  } catch {
    // Escaped strings can't produce an invalid regex in practice — the
    // try/catch is defence-in-depth against a future canonical form
    // accidentally containing a regex meta-character.
    return ca === cb;
  }
  return false;
}

/**
 * True when the candidate's skill pool contains something matching
 * `needed`. Pool is the union of the candidate's declared skills across
 * the four buckets we surface on their profile.
 */
export function candidateHasSkill(pool: string[], needed: string): boolean {
  for (const have of pool) {
    if (skillsMatch(have, needed)) return true;
  }
  return false;
}
