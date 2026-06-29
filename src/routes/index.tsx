import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Search, Github, Globe, Linkedin, Mail, Code2, Sparkles, Twitter, Layers, Pencil, RotateCcw, Sun, Moon, ExternalLink } from "lucide-react";


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
  // Google X-Ray style:
  // - AND -> space (implicit)
  // - NOT term -> -term
  // - Keep OR and quoted phrases intact
  // - Remove redundant parens around single tokens / non-OR groups
  let s = q.replace(/\bAND\b/g, " ");
  s = s.replace(/\bNOT\s+/g, "-");

  // Strip parens around groups that contain no OR (e.g. "(Surat)" -> "Surat").
  // Mask quoted phrases first so quoted parens/OR aren't touched.
  const quotes: string[] = [];
  s = s.replace(/"[^"]*"/g, (m) => {
    quotes.push(m);
    return `\u0000${quotes.length - 1}\u0000`;
  });

  let prev: string;
  do {
    prev = s;
    s = s.replace(/\(([^()]*)\)/g, (m, inner) =>
      /\bOR\b/.test(inner) ? m : ` ${inner} `,
    );
  } while (s !== prev);

  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => quotes[Number(i)]);
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
  // Nested Search: raw nested boolean. Removes the space between OR/AND
  // and a following quoted term (e.g. `OR "Staff"` -> `OR"Staff"`), per
  // the reference style. No site: prefix.
  const q = normalizeBoolean(input);
  if (!q) return "";
  return q.replace(/\b(OR|AND)\s+"/g, '$1"');
}

const LOCATION_OPTIONS = ["Surat", "Gujarat", "India"];
const EDUCATION_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Computer Application",
  "Computer Engineering",
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

function composeQuery(base: string, locations: string[], education: string[]): string {
  const segments = [base.trim()].filter(Boolean);
  const loc = buildGroup(locations);
  const edu = buildGroup(education);
  if (loc) segments.push(loc);
  if (edu) segments.push(edu);
  return segments.join(" AND ");
}

function SourcePro() {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [locations, setLocations] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const composed = useMemo(
    () => composeQuery(query, locations, education),
    [query, locations, education],
  );

  const github = useMemo(() => toGitHubXRay(composed), [composed]);
  const google = useMemo(() => toGoogleXRay(composed), [composed]);
  const linkedin = useMemo(() => toLinkedInBoolean(composed), [composed]);
  const nested = useMemo(() => toNestedSearch(composed), [composed]);

  const scrollToBuilder = () => {
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Search className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">Source Pro</span>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-accent"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={scrollToBuilder}
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Generate Boolean
            </button>
          </div>
        </div>
      </header>

      {/* Connect bar */}
      <div className="border-b border-border/60 bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6 py-3 md:justify-end">
          <ConnectChip
            href="mailto:sharmasoorajd@gmail.com"
            icon={<Mail className="h-3.5 w-3.5 text-sky-500" />}
            label="sharmasoorajd@gmail.com"
          />
          <ConnectChip
            href="https://x.com/soorajdsharma"
            icon={<Twitter className="h-3.5 w-3.5 text-sky-500" />}
            label="x.com/soorajdsharma"
          />
          <ConnectChip
            href="https://github.com/soorajdsharma"
            icon={<Github className="h-3.5 w-3.5" />}
            label="github.com/soorajdsharma"
          />
          <ConnectChip
            href="https://soorajdsharma.lovable.app"
            icon={<Globe className="h-3.5 w-3.5 text-sky-500" />}
            label="soorajdsharma.lovable.app"
          />
        </div>
      </div>




      {/* Builder */}
      <section id="builder" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-6">
          <div className="mb-6 text-center">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl text-yellow-500 dark:text-yellow-400">
              {"Find the right talent, instantly.".split(" ").map((word, i) => (
                <span
                  key={i}
                  className="inline-block opacity-0 animate-fade-in-up mr-[0.25em]"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "forwards" }}
                >
                  {word}
                </span>
              ))}
            </h2>
            <p className="mt-1 text-muted-foreground">Paste or write your Boolean query below.</p>
          </div>


          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-1">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  <span>Your Boolean</span>
                  <button
                    onClick={() => setQuery("")}
                    className="rounded px-2 py-1 transition hover:bg-accent"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  spellCheck={false}
                  placeholder='e.g. ("Software Engineer" OR "Backend Developer") AND (Node.js OR Golang) NOT Intern'
                  className="h-40 w-full resize-none bg-transparent p-4 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: Use quotes for exact matches and parentheses to group terms.
              </p>

              <FilterGroup
                label="Location"
                options={LOCATION_OPTIONS}
                selected={locations}
                onToggle={(v) => toggle(locations, setLocations, v)}
                onClear={() => setLocations([])}
              />
              <FilterGroup
                label="Education"
                options={EDUCATION_OPTIONS}
                selected={education}
                onToggle={(v) => toggle(education, setEducation, v)}
                onClear={() => setEducation([])}
              />
            </div>

            <div className="space-y-4 lg:col-span-3">
              <h3 className="text-sm font-medium text-muted-foreground">Generated Searches</h3>
              <ResultCard
                title="LinkedIn Boolean"
                description="LinkedIn-compatible Boolean syntax."
                icon={<Linkedin className="h-4 w-4" />}
                value={linkedin}
                searchUrl={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedin)}`}
              />
              <ResultCard
                title="Google X-Ray"
                description="Optimized Google X-Ray query."
                icon={<Globe className="h-4 w-4" />}
                value={google}
                searchUrl={`https://www.google.com/search?q=${encodeURIComponent(google)}`}
              />
              <ResultCard
                title="GitHub X-Ray"
                description="Ready-to-use GitHub X-Ray search."
                icon={<Github className="h-4 w-4" />}
                value={github}
                searchUrl={`https://www.google.com/search?q=${encodeURIComponent(github)}`}
              />
              <ResultCard
                title="Nested Search"
                description='Raw nested boolean with no space after OR/AND before quotes (e.g. OR"Staff").'
                icon={<Layers className="h-4 w-4" />}
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
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold">Source Pro</span>
              </div>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Developed by a Recruiter, for Recruiters.
              </p>
              <p className="mt-1 text-sm font-medium">Suraj Sharma</p>
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
                <li>
                  <a className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground" href="https://soorajdsharma.lovable.app" target="_blank" rel="noreferrer">
                    <Globe className="h-4 w-4" /> soorajdsharma.lovable.app
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent"
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
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
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
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
    >
      {icon}
      <span>{label}</span>
      {isExternal && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
    </a>
  );
}
