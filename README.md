# Win Talents — AI Sourcing Assistant for Recruiters

Win Talents instantly turns a plain search into optimized **Boolean** and **X-Ray** search strings for **GitHub**, **Google**, and **LinkedIn**. It's built for recruiters and talent sourcers who want to go from "I need a backend engineer in Surat who knows DSA" to a ready-to-paste search query in seconds.

Live query builder → GitHub X-Ray, Google X-Ray, LinkedIn Boolean, and a "nested" LinkedIn-optimized format, all generated from one query, with quick-pick filters for location, competitive programming platforms, and education background.

---

## Features

- **One query, four formats** — type or build a query once and get it transformed into:
  - **GitHub X-Ray** (`site:github.com ...`)
  - **Google X-Ray** (`site:linkedin.com/in ...`)
  - **LinkedIn Boolean** (normalized AND/OR/NOT syntax)
  - **Nested Search** — an auto-quoted, LinkedIn-friendly format that kicks in automatically once a query passes a complexity threshold (more than 5 operators)
- **Guided filters** — quick toggle groups for:
  - Location (Surat, Gujarat, India)
  - Competitive programming platforms (LeetCode, CodeChef, Codeforces, HackerRank, HackerEarth, GeeksforGeeks, DSA, etc.)
  - Education background (Computer Engineering, CSE, IT, BCA, MCA, MBA)
- **Smart query composition** — selected filters are automatically grouped with `OR` and combined with the base query using `AND`
- **Search history** — the last 5 composed queries are saved locally and can be restored, removed, or cleared
- **Copy-to-clipboard** for every generated query format
- **Light/dark theme toggle**
- **Authentication** — email/password and Google OAuth sign-in/sign-up, backed by Supabase (via Lovable Cloud), including password reset flow
- **Responsive, animated UI** built with Tailwind CSS and Radix UI primitives

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing via TanStack Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, `tw-animate-css`, `class-variance-authority` |
| UI Components | Radix UI primitives + shadcn/ui-style components (`src/components/ui`) |
| Forms | React Hook Form + Zod |
| Data / Charts | TanStack Query, Recharts |
| Auth & Backend | Supabase (`@supabase/supabase-js`), Lovable Cloud auth (`@lovable.dev/cloud-auth-js`) |
| Icons | Lucide React |
| Build Tool | Vite (via `@lovable.dev/vite-tanstack-config`, Nitro for SSR builds) |
| Package Manager | Bun (also compatible with npm — both lockfiles are present) |

This project is connected to **[Lovable](https://lovable.dev)** — changes pushed to the connected branch sync back to the Lovable editor.

---

## Project Structure

```
wintalent-main/
├── public/                      # Static assets (favicon, etc.)
├── src/
│   ├── assets/                  # Image assets (logo, avatar, theme toggle)
│   ├── components/
│   │   ├── AuthProvider.tsx     # Supabase auth context (session, user, signOut)
│   │   ├── UserMenu.tsx         # Account dropdown menu
│   │   └── ui/                  # shadcn/ui-style component library (buttons, dialogs, etc.)
│   ├── hooks/
│   │   └── use-mobile.tsx       # Responsive/mobile breakpoint hook
│   ├── integrations/
│   │   ├── lovable/             # Lovable Cloud auth integration
│   │   └── supabase/            # Supabase client, auth middleware, generated types
│   ├── lib/
│   │   ├── error-capture.ts     # Client-side error capture
│   │   ├── error-page.ts        # Error page rendering
│   │   ├── lovable-error-reporting.ts
│   │   └── utils.ts             # Shared utilities (e.g. `cn` classname helper)
│   ├── routes/                  # File-based routes (TanStack Router)
│   │   ├── __root.tsx           # App shell / root layout
│   │   ├── index.tsx            # Main Boolean/X-Ray search builder page
│   │   ├── auth.tsx              # Sign in / sign up page
│   │   ├── reset-password.tsx   # Password reset page
│   │   └── README.md            # Routing conventions
│   ├── routeTree.gen.ts         # Auto-generated route tree (do not edit)
│   ├── router.tsx                # Router instance
│   ├── server.ts                  # SSR server entry
│   ├── start.ts                   # App start entry
│   └── styles.css                 # Global styles (Tailwind)
├── supabase/
│   └── config.toml               # Supabase project configuration
├── AGENTS.md                     # Notes for AI coding agents / Lovable sync
├── components.json               # shadcn/ui configuration
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

> **Routing convention:** This project uses TanStack Start's file-based routing. Every `.tsx` file under `src/routes/` defines a route (e.g. `index.tsx` → `/`, `auth.tsx` → `/auth`). Do not create Next.js/Remix-style directories like `src/pages/` or `app/layout.tsx`. See `src/routes/README.md` for full conventions.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+ with npm
- A [Supabase](https://supabase.com/) project (or a Lovable Cloud-connected Supabase instance) for authentication

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wintalent-main

# Install dependencies (Bun)
bun install

# or with npm
npm install
```

### Environment Variables

Create a `.env` (or `.env.local`) file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

> If these are connected via Lovable Cloud, they may be injected automatically at build/dev time.

### Development

```bash
bun run dev
# or
npm run dev
```

This starts the Vite dev server for the TanStack Start app.

### Build

```bash
bun run build
# or
npm run build
```

Use `build:dev` for a development-mode build:

```bash
bun run build:dev
```

### Preview a production build

```bash
bun run preview
```

### Linting & Formatting

```bash
bun run lint      # ESLint
bun run format    # Prettier — writes formatted files in place
```

---

## How the Query Builder Works

1. **Type a base query** (plain keywords, or Boolean syntax with `AND` / `OR` / `NOT` and parentheses).
2. **Optionally select filters** for location, competitive programming platforms, and education — each selected group is combined with `OR` and wrapped in parentheses, then joined to the base query with `AND`.
3. The composed query is transformed in real time into:
   - **GitHub X-Ray:** prefixes `site:github.com` and rewrites the query into Google-style search syntax (`AND` implicit via whitespace, `NOT` becomes a `-` prefix, `OR` groups preserved).
   - **Google X-Ray:** same transformation, prefixed with `site:linkedin.com/in` for sourcing LinkedIn profiles via Google.
   - **LinkedIn Boolean:** the composed query normalized (whitespace collapsed, structure preserved) for direct use in LinkedIn Recruiter/Search.
   - **Nested Search:** once the query exceeds 5 Boolean operators, keywords are automatically quoted and reformatted into LinkedIn's recommended "nested" Boolean style for better search performance.
4. Every generated format can be copied to the clipboard with one click, and the composed query is automatically saved to a local search history (last 5 entries).

---

## Authentication

Authentication is handled through Supabase, with an additional Lovable Cloud OAuth layer for Google sign-in:

- Email/password sign up and sign in
- Google OAuth sign-in
- Password reset flow (`/reset-password`)
- Session state is exposed app-wide via `AuthProvider` (`src/components/AuthProvider.tsx`) and consumed via the `useAuth()` hook

---

## Notes for Contributors

- This repo is connected to **Lovable**. Avoid rewriting published git history (no force-push, rebase, amend, or squash of already-pushed commits) — see `AGENTS.md` for details. Commits pushed to the connected branch sync back into the Lovable editor.
- `src/routeTree.gen.ts` is auto-generated by the TanStack Router plugin — do not edit it by hand.
- `src/integrations/supabase/client.ts` and `types.ts` are auto-generated — do not edit directly.
- `vite.config.ts` is preconfigured by `@lovable.dev/vite-tanstack-config`; avoid manually adding plugins it already provides (TanStack Start, React, Tailwind, tsconfig paths, Nitro, component tagger, env injection, etc.).

---
