import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Search, Github, Globe, Linkedin, Mail, Code2, Sparkles, Twitter, Layers, Pencil, RotateCcw, Sun, Moon, ExternalLink } from "lucide-react";
import sourceProLogo from "@/assets/suraj-profile.jpeg.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Source Pro — AI Sourcing Assistant for Recruiters" },
      {
        name: "description",
        content:
          "Source Pro instantly generates optimized Boolean and X-Ray searches for GitHub, Google, and LinkedIn. Built for recruiters and talent sourcers.",
      },
      { property: "og:title", content: "Source Pro — AI Sourcing Assistant for Recruiters" },
      {
        property: "og:description",
        content:
          "Build powerful Boolean searches. Source better talent, faster. GitHub & Google X-Ray, LinkedIn-friendly Boolean.",
      },
    ],
  }),
  component: SourcePro,
});

const DEFAULT_QUERY = "";

function normalizeBoolean(input: string): string {
  // Collapse whitespace/newlines into single spaces while preserving quoted strings
  return input.replace(/\s+/g, " ").trim();
}

function toLinkedInBoolean(input: string): string {
  // LinkedIn supports AND OR NOT (), quotes. Just normalize.
  return normalizeBoolean(input);
}

function wrapIfNeeded(q: string): string {
  if (!q) return "";
  // If already wrapped in an outer paren pair, don't double-wrap.
  if (q.startsWith("(") && q.endsWith(")")) return q;
  return `(${q})`;
}

function toGoogleStyle(q: string): string {
  // Google X-Ray transform — token-based, case-sensitive:
  //   AND (uppercase)  -> ignored  (whitespace = implicit AND)
  //   NOT (uppercase)  -> "-" prefix on the next token/group  (exclusion)
  //   OR  (uppercase)  -> kept as explicit OR node
  //   "or" (lowercase) -> treated as a plain keyword
  //   quoted phrases   -> preserved verbatim
  //   parentheses      -> preserved when they contain an OR, otherwise stripped
  //   search operators (site:, filetype:, intitle:, etc.) -> preserved as keywords

  // 1. Tokenize while preserving quoted phrases and parens as their own tokens.
  const tokens: string[] = [];
  const re = /"[^"]*"|\(|\)|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q)) !== null) tokens.push(m[0]);

  // 2. Transform token stream per the rules above.
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "AND") continue;                    // ignore
    if (t === "NOT") {                            // exclusion prefix on next token
      const next = tokens[i + 1];
      if (next !== undefined) {
        out.push(`-${next}`);
        i++;
      }
      continue;
    }
    // Uppercase OR is the only OR operator. Lowercase "or" falls through as keyword.
    out.push(t);
  }

  // 3. Join, then strip redundant parens (groups without an explicit OR).
  let s = out.join(" ");
  const quotes: string[] = [];
  s = s.replace(/"[^"]*"/g, (mm) => {
    quotes.push(mm);
    return `\u0000${quotes.length - 1}\u0000`;
  });
  let prev: string;
  do {
    prev = s;
    s = s.replace(/\(([^()]*)\)/g, (mm, inner) =>
      /\bOR\b/.test(inner) ? mm : ` ${inner} `,
    );
  } while (s !== prev);
  // Tidy: fix "- foo" -> "-foo" from token join, tighten parens,
  // ensure spaces around OR (only in Google X-Ray), then restore quotes.
  s = s.replace(/-\s+/g, "-");
  s = s.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  s = s.replace(/\s*OR\s*/g, " OR ");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, idx) => quotes[Number(idx)]);
  return s.replace(/\s+/g, " ").trim();
}

function toGitHubXRay(input: string): string {
  const q = normalizeBoolean(input);
  if (!q) return "";
  return `site:github.com ${toGoogleStyle(q)}`;
}

function toGoogleXRay(input: string): string {
  const q = normalizeBoolean(input);
  if (!q) return "";
  return `site:linkedin.com/in ${toGoogleStyle(q)}`;
}

function toNestedSearch(input: string): string {
  // LinkedIn Free Boolean Optimizer.
  // Step 1: Tokenize. Step 2: Count AND/OR/NOT. Step 3: if <=5 return original.
  // Steps 4-9: quote keywords, format OR as ` OR"x"`, keep AND/NOT padded,
  // preserve parentheses and logic.
  if (!input.trim()) return "";

  type Tok =
    | { type: "op"; val: "AND" | "OR" | "NOT" }
    | { type: "paren"; val: "(" | ")" }
    | { type: "phrase"; val: string } // already quoted
    | { type: "kw"; val: string }; // bare keyword, no quotes

  const q = input.replace(/\s+/g, " ").trim();
  const tokens: Tok[] = [];
  let i = 0;
  while (i < q.length) {
    const c = q[i];
    if (c === " ") { i++; continue; }
    if (c === "(" || c === ")") { tokens.push({ type: "paren", val: c }); i++; continue; }
    if (c === '"') {
      let j = i + 1;
      while (j < q.length && q[j] !== '"') j++;
      tokens.push({ type: "phrase", val: q.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < q.length && !' ()"'.includes(q[j])) j++;
    const w = q.slice(i, j);
    if (w === "AND" || w === "OR" || w === "NOT") {
      tokens.push({ type: "op", val: w });
    } else {
      tokens.push({ type: "kw", val: w });
    }
    i = j;
  }

  const opCount = tokens.filter((t) => t.type === "op").length;
  if (opCount <= 5) return input.trim();

  // Render with formatting rules.
  let out = "";
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    const prev = tokens[k - 1];

    // Determine the textual value of this token (quote keywords/phrases).
    let val = "";
    if (t.type === "phrase") val = `"${t.val}"`;
    else if (t.type === "kw") val = `"${t.val}"`;
    else val = t.val;

    // Determine separator between prev and current.
    let sep = "";
    if (prev) {
      if (t.type === "paren" && t.val === ")") {
        sep = "";
      } else if (prev.type === "paren" && prev.val === "(") {
        sep = "";
      } else if (prev.type === "op" && prev.val === "OR") {
        // OR has space before, no space after → no separator before next token.
        sep = "";
      } else if (t.type === "op" && t.val === "OR") {
        // space before OR
        sep = " ";
      } else {
        // AND/NOT and general case: single space.
        sep = " ";
      }
    }
    out += sep + val;
  }
  return out;
}


const LOCATION_OPTIONS = ["Surat", "Gujarat", "India"];
const COMPETITIVE_PROGRAMMING_OPTIONS = [
  "LeetCode",
  "CodeChef",
  "Codeforces",
  "HackerRank",
  "HackerEarth",
  "GeeksforGeeks",
  "DSA",
  "Data Structures and Algorithms",
  "Competitive Programming",
];
const EDUCATION_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Computer Application",
  "Computer Engineering",
  "CSE",
  "BCA",
  "MCA",
  "MBA",
];

function buildGroup(values: string[]): string {
  const parts = values.map((v) => (/\s/.test(v) ? `"${v}"` : v));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `(${parts.join(" OR ")})`;
}

function countOperators(input: string): number {
  if (!input) return 0;
  // Only AND, OR, NOT count as operators. Ignore anything inside quotes.
  const unquoted = input.replace(/"[^"]*"/g, " ");
  let count = 0;
  count += (unquoted.match(/\bAND\b/g) || []).length;
  count += (unquoted.match(/\bOR\b/g) || []).length;
  count += (unquoted.match(/\bNOT\b/g) || []).length;
  return count;
}

function composeQuery(base: string, locations: string[], competitive: string[], education: string[]): string {
  const segments = [base.trim()].filter(Boolean);
  const loc = buildGroup(locations);
  const cp = buildGroup(competitive);
  const edu = buildGroup(education);
  if (loc) segments.push(loc);
  if (cp) segments.push(cp);
  if (edu) segments.push(edu);
  return segments.join(" AND ");
}

function SourcePro() {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [locations, setLocations] = useState<string[]>([]);
  const [competitive, setCompetitive] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const composed = useMemo(
    () => composeQuery(query, locations, competitive, education),
    [query, locations, competitive, education],
  );

  const github = useMemo(() => toGitHubXRay(composed), [composed]);
  const google = useMemo(() => toGoogleXRay(composed), [composed]);
  const linkedin = useMemo(() => toLinkedInBoolean(composed), [composed]);
  const nested = useMemo(() => toNestedSearch(composed), [composed]);
  const operatorCount = useMemo(() => countOperators(composed), [composed]);

  const scrollToBuilder = () => {
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [theme, setTheme] = useState<"dark" | "light">("light");
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full ring-1 ring-border overflow-hidden">
              <img src={sourceProLogo.url} alt="Source Pro" className="h-full w-full object-cover" />
            </div>
            <span className="text-base font-semibold tracking-tight">Source Pro</span>
          </a>
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
            <div className="pointer-events-auto flex items-center gap-2">
              <ConnectChip
                href="https://www.linkedin.com/in/soorajdsharma/"
                icon={<Linkedin className="h-4 w-4 text-sky-500" />}
                label="LinkedIn"
              />
              <ConnectChip
                href="https://github.com/soorajdsharma"
                icon={<Github className="h-4 w-4" />}
                label="GitHub"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-accent"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            
          </div>

        </div>
      </header>





      {/* Builder */}
      <section id="builder" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 pt-3 pb-6">
          <div className="mb-4 text-center">

            <h2 className="font-display text-4xl tracking-tight md:text-5xl text-yellow-500 dark:text-yellow-400">
              {"Talent Sourcing Assistant".split(" ").map((word, i) => (
                <span
                  key={i}
                  className="inline-block opacity-0 animate-fade-in-up mr-[0.25em]"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "forwards" }}
                >
                  {word}
                </span>
              ))}
            </h2>
            <p className="mt-1 text-muted-foreground">Write your Boolean query below.</p>
          </div>


          <div className="space-y-6">
            <div>
              <div className="rounded-xl border border-border bg-card p-1">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  <span>Your Boolean</span>
                  <div className="flex items-center gap-3">
                    <span
                      aria-live="polite"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 font-medium text-foreground"
                      title="Total AND / OR / NOT / parentheses / quotes / wildcards / proximity operators in your current query"
                    >
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      Operators Used: <span className="tabular-nums">{operatorCount}</span>
                    </span>
                    <button
                      onClick={() => setQuery("")}
                      className="rounded px-2 py-1 transition hover:bg-accent"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  spellCheck={false}
                  placeholder=""
                  className="h-40 w-full resize-none bg-transparent p-4 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: Use quotes for exact matches and parentheses to group terms.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FilterGroup
                  label="Location"
                  options={LOCATION_OPTIONS}
                  selected={locations}
                  onToggle={(v) => toggle(locations, setLocations, v)}
                  onClear={() => setLocations([])}
                />
                <FilterGroup
                  label="Competitive Programming"
                  options={COMPETITIVE_PROGRAMMING_OPTIONS}
                  selected={competitive}
                  onToggle={(v) => toggle(competitive, setCompetitive, v)}
                  onClear={() => setCompetitive([])}
                />
              </div>
              <FilterGroup
                label="Education"
                options={EDUCATION_OPTIONS}
                selected={education}
                onToggle={(v) => toggle(education, setEducation, v)}
                onClear={() => setEducation([])}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Generated Searches</h3>
              <ResultCard
                title="LinkedIn Boolean"
                description="LinkedIn-compatible Boolean syntax."
                icon={<LinkedInBrandIcon className="h-5 w-5" />}
                value={linkedin}
                searchUrl={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedin)}`}
              />
              <ResultCard
                title="Google X-Ray"
                description="Optimized Google X-Ray query."
                icon={<GoogleGIcon className="h-5 w-5" />}
                value={google}
                searchUrl={`https://www.google.com/search?q=${encodeURIComponent(google)}`}
              />
              <ResultCard
                title="GitHub X-Ray"
                description="Ready-to-use GitHub X-Ray search."
                icon={<GitHubBrandIcon className="h-5 w-5" />}
                value={github}
                searchUrl={`https://www.google.com/search?q=${encodeURIComponent(github)}`}
              />
              <ResultCard
                title="LinkedIn Leakage"
                description="Bypass LinkedIn Limitation"
                icon={<LinkedInBrandIcon className="h-5 w-5" />}
                value={nested}
                searchUrl={`https://www.google.com/search?q=${encodeURIComponent(nested)}`}
              />

            </div>
          </div>


        </div>
      </section>


      {/* Connect / Footer */}
      <footer id="connect" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full ring-1 ring-border overflow-hidden">
                  <img src={sourceProLogo.url} alt="Source Pro" className="h-full w-full object-cover" />
                </div>
                <span className="text-base font-semibold">Source Pro</span>
              </div>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Developed by a Recruiter, for Recruiters.
              </p>
              <a
                href="https://www.linkedin.com/in/soorajdsharma/"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:text-primary transition"
              >
                Suraj Sharma <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div>
              <h3 className="text-sm font-medium">Connect</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground" href="mailto:sharmasoorajd@gmail.com">
                    <Mail className="h-4 w-4" /> sharmasoorajd@gmail.com
                  </a>
                </li>
                <li>
                  <a className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground" href="https://x.com/soorajdsharma" target="_blank" rel="noreferrer">
                    <Twitter className="h-4 w-4" /> x.com/soorajdsharma
                  </a>
                </li>
                <li>
                  <a className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground" href="https://github.com/soorajdsharma" target="_blank" rel="noreferrer">
                    <Github className="h-4 w-4" /> github.com/soorajdsharma
                  </a>
                </li>


              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Source Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}




function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.9 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function LinkedInBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path fill="#fff" d="M7.1 9.5h2.6V18H7.1V9.5zM8.4 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.4 9.5h2.5v1.2h.04c.35-.66 1.2-1.36 2.47-1.36 2.64 0 3.13 1.74 3.13 4v4.66h-2.6v-4.13c0-.99-.02-2.26-1.38-2.26-1.38 0-1.6 1.08-1.6 2.19V18h-2.6V9.5z"/>
    </svg>
  );
}

function GitHubBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#181717" fillRule="evenodd" clipRule="evenodd" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}


function ResultCard({
  title,
  description,
  icon,
  value,
  searchUrl,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  searchUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = draft !== null ? draft : value;
  const liveSearchUrl = draft !== null
    ? searchUrl.replace(/q=[^&]*/, `q=${encodeURIComponent(draft)}`).replace(/keywords=[^&]*/, `keywords=${encodeURIComponent(draft)}`)
    : searchUrl;

  const copy = async () => {
    if (!displayValue) return;
    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const startEdit = () => {
    setDraft(displayValue);
    setIsEditing(true);
  };

  const resetEdit = () => {
    setDraft(null);
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-border">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold">
              {title}
              {draft !== null && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  Edited
                </span>
              )}
              <span
                className="ml-2 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                title="AND / OR / NOT operators used"
              >
                Operators: <span className="tabular-nums text-foreground">{countOperators(displayValue)}</span>
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {draft !== null && (
            <button
              onClick={resetEdit}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button
            onClick={() => (isEditing ? setIsEditing(false) : startEdit())}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
          >
            {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {isEditing ? "Done" : "Edit"}
          </button>
          <a
            href={displayValue ? liveSearchUrl : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!displayValue}
            className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent ${!displayValue ? "pointer-events-none opacity-50" : ""}`}
          >
            <Search className="h-3.5 w-3.5" /> Open
          </a>
          <button
            onClick={copy}
            disabled={!displayValue}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={draft ?? ""}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="mt-4 h-40 w-full resize-none rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground outline-none ring-1 ring-primary/40 focus:ring-2 focus:ring-primary"
        />
      ) : (
        <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
          {displayValue || "—"}
        </pre>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">
          {label}
        </h4>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-md border border-border bg-card p-2 text-foreground transition hover:border-primary/40 hover:bg-accent"
    >
      {icon}
    </a>
  );
}
