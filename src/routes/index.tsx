import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Check, Search, Github, Globe, Linkedin, Mail, Code2, Sparkles, Twitter, Layers, Pencil, RotateCcw } from "lucide-react";

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

const DEFAULT_QUERY = `("Software Engineer" OR "Backend Developer")
AND
(Node.js OR Golang)
NOT
Intern`;

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
  // Nested Search: raw nested boolean. Removes the space between OR/AND
  // and a following quoted term (e.g. `OR "Staff"` -> `OR"Staff"`), per
  // the reference style. No site: prefix.
  const q = normalizeBoolean(input);
  if (!q) return "";
  return q.replace(/\b(OR|AND)\s+"/g, '$1"');
}

function SourcePro() {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);

  const github = useMemo(() => toGitHubXRay(query), [query]);
  const google = useMemo(() => toGoogleXRay(query), [query]);
  const linkedin = useMemo(() => toLinkedInBoolean(query), [query]);
  const nested = useMemo(() => toNestedSearch(query), [query]);

  const scrollToBuilder = () => {
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#builder" className="transition hover:text-foreground">Builder</a>
            <a href="#connect" className="transition hover:text-foreground">Connect</a>
          </nav>
          <button
            onClick={scrollToBuilder}
            className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Generate Boolean
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(60rem 30rem at 50% -10%, color-mix(in oklch, var(--color-primary) 18%, transparent), transparent), radial-gradient(40rem 20rem at 90% 10%, color-mix(in oklch, var(--color-chart-2) 20%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI Sourcing Assistant for Recruiters
          </div>
          <h1 className="font-display mx-auto max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Build powerful Boolean searches.
            <br />
            <em className="text-primary">Source better talent, faster.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Stop spending time writing complex Boolean strings. Source Pro instantly generates
            optimized Boolean and X-Ray searches for GitHub, Google, and LinkedIn so you can focus
            on finding the right candidates.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={scrollToBuilder}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Generate Boolean
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              See features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">Why Source Pro?</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to source smarter.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Code2 className="h-5 w-5" />, title: "Boolean in seconds", desc: "Build complex Boolean queries instantly." },
              { icon: <Github className="h-5 w-5" />, title: "GitHub X-Ray", desc: "Generate ready-to-use GitHub X-Ray searches." },
              { icon: <Globe className="h-5 w-5" />, title: "Google X-Ray", desc: "Optimized Google X-Ray queries across profiles." },
              { icon: <Linkedin className="h-5 w-5" />, title: "LinkedIn-friendly", desc: "Convert Boolean into LinkedIn-compatible syntax." },
              { icon: <Sparkles className="h-5 w-5" />, title: "Full operator support", desc: 'AND, OR, NOT, (), and Exact Match " ".' },
              { icon: <Search className="h-5 w-5" />, title: "Built for sourcers", desc: "Tech Recruiters, Talent Sourcers, Hiring Teams." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="text-base font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Builder */}
      <section id="builder" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">Boolean Builder</h2>
            <p className="mt-2 text-muted-foreground">Paste or write your Boolean query below.</p>
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
                  placeholder={DEFAULT_QUERY}
                  className="h-80 w-full resize-none bg-transparent p-4 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: Use quotes for exact matches and parentheses to group terms.
              </p>
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

          {/* Example */}
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card/50 p-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Example
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
{`("Software Engineer" OR "Software Developer")
AND
("Native Bridge" OR "Native Modules" OR "Native Flutter" OR "Modules" OR "Channel")`}
            </pre>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">
            Built for recruiters who source every day.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From startup hiring to executive search, Source Pro helps you generate clean, accurate
            Boolean searches in seconds.
          </p>
        </div>
      </section>

      {/* Connect / Footer */}
      <footer id="connect" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-14">
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

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={value ? searchUrl : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!value}
            className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent ${!value ? "pointer-events-none opacity-50" : ""}`}
          >
            <Search className="h-3.5 w-3.5" /> Open
          </a>
          <button
            onClick={copy}
            disabled={!value}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
        {value || "—"}
      </pre>
    </div>
  );
}
