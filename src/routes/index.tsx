import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  Search,
  Github,
  Globe,
  Linkedin,
  Mail,
  Layers,
  Pencil,
  RotateCcw,
  Twitter,
} from "lucide-react";

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
          "Build powerful Boolean searches. Source better talent, faster.",
      },
    ],
  }),
  component: SourcePro,
});

const DEFAULT_QUERY = `("Software Engineer" OR "Backend Developer") AND (Node.js OR Golang) NOT Intern`;

function normalizeBoolean(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function toLinkedInBoolean(input: string): string {
  return normalizeBoolean(input);
}

function toGitHubXRay(input: string): string {
  const q = normalizeBoolean(input);
  if (!q) return "";
  return `site:github.com ${q}`;
}

function toGoogleXRay(input: string): string {
  const q = normalizeBoolean(input);
  if (!q) return "";
  return `site:linkedin.com/in ${q}`;
}

function toNestedSearch(input: string): string {
  const q = normalizeBoolean(input);
  if (!q) return "";
  return q.replace(/\b(OR|AND)\s+"/g, '$1"');
}

const LOCATION_OPTIONS = ["Surat", "Gujarat", "India"];
const EDUCATION_OPTIONS = [
  "BE",
  "BTEC",
  "CS",
  "IT",
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
  const [submitted, setSubmitted] = useState(false);

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

  const handleGenerate = () => setSubmitted(true);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar — minimal like Google */}
      <header className="flex items-center justify-end gap-6 px-6 py-4 text-sm text-foreground/80">
        <a
          href="https://github.com/soorajdsharma"
          target="_blank"
          rel="noreferrer"
          className="transition hover:underline"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/soorajdsharma"
          target="_blank"
          rel="noreferrer"
          className="transition hover:underline"
        >
          LinkedIn
        </a>
        <a href="#connect" className="transition hover:underline">
          Connect
        </a>
      </header>

      {/* Centered hero — Google style */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-16 pb-12 md:pt-24">
        {/* Wordmark */}
        <h1 className="select-none text-center text-6xl font-medium tracking-tight md:text-7xl">
          <span className="text-[#4285F4]">S</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">u</span>
          <span className="text-[#4285F4]">r</span>
          <span className="text-[#34A853]">c</span>
          <span className="text-[#EA4335]">e</span>
          <span className="px-2" />
          <span className="text-foreground/80">Pro</span>
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          AI sourcing assistant for recruiters.
        </p>

        {/* Search box */}
        <div className="mt-8 w-full">
          <div className="group flex w-full items-start gap-3 rounded-3xl border border-border bg-background px-5 py-4 shadow-sm transition hover:shadow-md focus-within:shadow-md">
            <Search className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              placeholder='e.g. ("Developer Advocate" OR "DevRel") AND (Video OR YouTube) AND Gujarat'
              rows={2}
              className="min-h-[2.5rem] w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Filters */}
          <div className="mt-5 space-y-3">
            <ChipRow
              label="Location"
              options={LOCATION_OPTIONS}
              selected={locations}
              onToggle={(v) => toggle(locations, setLocations, v)}
            />
            <ChipRow
              label="Education"
              options={EDUCATION_OPTIONS}
              selected={education}
              onToggle={(v) => toggle(education, setEducation, v)}
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleGenerate}
              className="rounded-md bg-[#f8f9fa] px-5 py-2.5 text-sm font-medium text-foreground/80 ring-1 ring-transparent transition hover:ring-border hover:shadow-sm"
            >
              Generate Searches
            </button>
            <button
              onClick={() => {
                setQuery("");
                setLocations([]);
                setEducation([]);
                setSubmitted(false);
              }}
              className="rounded-md bg-[#f8f9fa] px-5 py-2.5 text-sm font-medium text-foreground/80 ring-1 ring-transparent transition hover:ring-border hover:shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {submitted && composed && (
          <div className="mt-12 w-full space-y-4">
            <ResultCard
              title="LinkedIn Boolean"
              icon={<Linkedin className="h-4 w-4" />}
              value={linkedin}
              searchUrl={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedin)}`}
            />
            <ResultCard
              title="Google X-Ray"
              icon={<Globe className="h-4 w-4" />}
              value={google}
              searchUrl={`https://www.google.com/search?q=${encodeURIComponent(google)}`}
            />
            <ResultCard
              title="GitHub X-Ray"
              icon={<Github className="h-4 w-4" />}
              value={github}
              searchUrl={`https://www.google.com/search?q=${encodeURIComponent(github)}`}
            />
            <ResultCard
              title="Nested Search"
              icon={<Layers className="h-4 w-4" />}
              value={nested}
              searchUrl={`https://www.google.com/search?q=${encodeURIComponent(nested)}`}
            />
          </div>
        )}
      </main>

      {/* Footer — Google style */}
      <footer
        id="connect"
        className="border-t border-border bg-[#f2f2f2] text-sm text-muted-foreground"
      >
        <div className="px-6 py-3 text-foreground/70">Suraj Sharma — built for recruiters.</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3">
          <div className="flex flex-wrap items-center gap-5">
            <a className="inline-flex items-center gap-1.5 transition hover:text-foreground" href="mailto:sharmasoorajd@gmail.com">
              <Mail className="h-3.5 w-3.5" /> sharmasoorajd@gmail.com
            </a>
            <a className="inline-flex items-center gap-1.5 transition hover:text-foreground" href="https://x.com/soorajdsharma" target="_blank" rel="noreferrer">
              <Twitter className="h-3.5 w-3.5" /> x.com/soorajdsharma
            </a>
            <a className="inline-flex items-center gap-1.5 transition hover:text-foreground" href="https://github.com/soorajdsharma" target="_blank" rel="noreferrer">
              <Github className="h-3.5 w-3.5" /> github.com/soorajdsharma
            </a>
          </div>
          <div className="text-xs">© {new Date().getFullYear()} Source Pro</div>
        </div>
      </footer>
    </div>
  );
}

function ChipRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
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
                : "border-border bg-background text-foreground/70 hover:border-foreground/30"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ResultCard({
  title,
  icon,
  value,
  searchUrl,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  searchUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = draft !== null ? draft : value;
  const liveSearchUrl =
    draft !== null
      ? searchUrl
          .replace(/q=[^&]*/, `q=${encodeURIComponent(draft)}`)
          .replace(/keywords=[^&]*/, `keywords=${encodeURIComponent(draft)}`)
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

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          {draft !== null && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {draft !== null && (
            <button
              onClick={() => {
                setDraft(null);
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                setDraft(displayValue);
                setIsEditing(true);
              }
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent"
          >
            {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {isEditing ? "Done" : "Edit"}
          </button>
          <a
            href={displayValue ? liveSearchUrl : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!displayValue}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent ${!displayValue ? "pointer-events-none opacity-50" : ""}`}
          >
            <Search className="h-3.5 w-3.5" /> Open
          </a>
          <button
            onClick={copy}
            disabled={!displayValue}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
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
          className="mt-3 h-32 w-full resize-none rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed outline-none ring-1 ring-primary/40 focus:ring-2 focus:ring-primary"
        />
      ) : (
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
          {displayValue || "—"}
        </pre>
      )}
    </div>
  );
}
