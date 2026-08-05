/// Skill matching — Dart port of web/src/lib/skillSynonyms.ts.
///
/// Same algorithm on both platforms so employer + candidate see identical
/// match results whether they're on web or mobile:
///
///   1. Normalise both sides (trim + lowercase).
///   2. Resolve through the synonym map (`js` → `javascript`, `react.js`
///      → `react`, `ml` → `machine learning`, etc.).
///   3. If canonical forms are equal → match.
///   4. Otherwise, word-boundary containment either direction. This lets
///      "React Native" match "React" but STOPS "JavaScript" from matching
///      "Java" (the old naïve substring bug).
///
/// Keep this file in sync with web/src/lib/skillSynonyms.ts — add new
/// (alias, canonical) pairs to both.
library;

const List<List<String>> _synonyms = [
  // ---- Frontend / JavaScript ecosystem
  ['javascript', 'js', 'ecmascript'],
  ['typescript', 'ts'],
  ['react', 'reactjs', 'react.js'],
  ['react native', 'reactnative'],
  ['angular', 'angularjs', 'angular.js'],
  ['vue', 'vuejs', 'vue.js'],
  ['node', 'nodejs', 'node.js'],
  ['next.js', 'nextjs', 'next js'],
  ['nuxt', 'nuxtjs', 'nuxt.js'],
  ['html', 'html5'],
  ['css', 'css3'],
  ['sass', 'scss'],
  ['jquery'],

  // ---- Backend / databases
  ['mongodb', 'mongo'],
  ['postgresql', 'postgres', 'psql'],
  ['mysql'],
  ['sql server', 'mssql', 'microsoft sql server'],
  ['oracle', 'oracle db', 'oracledb'],
  ['redis'],
  ['dynamodb', 'dynamo'],
  ['cassandra'],
  ['elasticsearch', 'elastic search', 'elastic'],
  ['graphql'],
  ['rest api', 'restful api', 'rest'],
  ['grpc'],

  // ---- Languages
  ['python', 'py'],
  ['java'],
  ['c#', 'csharp', 'c sharp', 'dotnet', '.net'],
  ['c++', 'cpp'],
  ['golang', 'go'],
  ['ruby'],
  ['php'],
  ['kotlin'],
  ['swift'],
  ['dart'],
  ['rust'],
  ['scala'],
  ['r'],
  ['matlab'],

  // ---- Cloud / DevOps
  ['aws', 'amazon web services'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['azure', 'microsoft azure'],
  ['kubernetes', 'k8s'],
  ['docker'],
  ['terraform'],
  ['ansible'],
  ['jenkins'],
  ['github actions'],
  ['ci/cd', 'cicd', 'ci cd', 'continuous integration'],
  ['linux'],
  ['nginx'],

  // ---- Data / ML / AI
  ['machine learning', 'ml'],
  ['deep learning', 'dl'],
  ['artificial intelligence', 'ai'],
  ['natural language processing', 'nlp'],
  ['computer vision', 'cv'],
  ['data science', 'ds'],
  ['business intelligence', 'bi'],
  ['power bi', 'powerbi'],
  ['tableau'],
  ['pandas'],
  ['numpy'],
  ['tensorflow', 'tf'],
  ['pytorch'],
  ['etl', 'extract transform load'],

  // ---- Mobile
  ['flutter'],
  ['react native'],
  ['ionic'],

  // ---- Non-IT roles / departments
  ['human resources', 'hr'],
  ['quality assurance', 'qa'],
  ['quality control', 'qc'],
  ['business analyst', 'ba'],
  ['product manager', 'product mgmt', 'product management'],
  ['project manager', 'project mgmt', 'project management'],
  ['ui/ux', 'ui ux', 'user interface', 'user experience'],
  ['graphic design', 'graphic designer'],
  ['digital marketing', 'digital mkt'],
  ['search engine optimization', 'seo'],
  ['search engine marketing', 'sem'],
  ['social media marketing', 'smm'],
  ['content writing', 'content writer', 'copywriting'],
  ['accounts', 'accounting', 'accountant'],
  ['chartered accountant', 'ca'],
  ['cost accountant', 'cma'],
  ['company secretary', 'cs'],
  ['gst'],
  ['tally'],
  ['sales'],
  ['business development', 'bd', 'biz dev'],
  ['customer support', 'customer service', 'cs support'],
  ['operations', 'ops'],
  ['logistics'],
  ['supply chain', 'scm'],
  ['procurement'],

  // ---- Vocational / trades
  ['electrician'],
  ['plumber'],
  ['welder', 'welding'],
  ['carpenter', 'carpentry'],
  ['mason', 'masonry'],
  ['driver'],
  ['security guard', 'security'],
  ['housekeeping'],
  ['nursing', 'nurse'],
];

/// Flattened alias → canonical lookup, built once at load time.
final Map<String, String> _aliasToCanonical = () {
  final out = <String, String>{};
  for (final row in _synonyms) {
    if (row.isEmpty) continue;
    final canonical = row.first.toLowerCase().trim();
    for (final alias in row) {
      out[alias.toLowerCase().trim()] = canonical;
    }
  }
  return out;
}();

/// Normalise + canonicalise a skill string.
String canonicalize(String skill) {
  final n = skill.toLowerCase().trim();
  return _aliasToCanonical[n] ?? n;
}

/// Escape a string for safe inclusion inside a RegExp.
String _escapeRegex(String s) {
  return s.replaceAllMapped(
    RegExp(r'[.*+?^${}()|[\]\\]'),
    (m) => '\\${m[0]}',
  );
}

/// True when [a] mentions [b] as a whole word (or vice-versa) after both
/// sides have been canonicalised.
///
/// Examples:
///   skillsMatch('JavaScript', 'JS')          → true   (alias)
///   skillsMatch('React.js', 'React')         → true   (alias + WB)
///   skillsMatch('React Native', 'React')     → true   (WB contains)
///   skillsMatch('JavaScript', 'Java')        → false  (no \bjava\b)
///   skillsMatch('Node.js', 'Node')           → true   (alias)
///   skillsMatch('Machine Learning', 'ML')    → true   (alias)
bool skillsMatch(String a, String b) {
  final ca = canonicalize(a);
  final cb = canonicalize(b);
  if (ca.isEmpty || cb.isEmpty) return false;
  if (ca == cb) return true;

  try {
    final aWord = RegExp('\\b${_escapeRegex(cb)}\\b', caseSensitive: false);
    if (aWord.hasMatch(ca)) return true;
    final bWord = RegExp('\\b${_escapeRegex(ca)}\\b', caseSensitive: false);
    if (bWord.hasMatch(cb)) return true;
  } catch (_) {
    return ca == cb;
  }
  return false;
}

/// True when the candidate's skill pool contains something matching
/// [needed].
bool candidateHasSkill(List<String> pool, String needed) {
  for (final have in pool) {
    if (skillsMatch(have, needed)) return true;
  }
  return false;
}
