# Abhishek Dhariyal — Portfolio

A premium, dark, 3D-accented developer portfolio built with Next.js 15 (App
Router), React 19, TypeScript, Tailwind CSS, Framer Motion, React Three
Fiber, and Lenis smooth scroll.

## If the site didn't open before

An earlier version of `package.json` pinned `@react-three/fiber@^8` and
`@react-three/postprocessing@^2`, both of which only officially support
**React 18** — but this project uses **React 19**. That mismatch causes
`npm install` to fail outright with an `ERESOLVE` peer-dependency error (so
`node_modules` never gets created, and `next dev`/`next start` then fails
with something like `'next' is not recognized` or `Cannot find module`).

This has been fixed: dependencies now use `@react-three/fiber@^9` and
`@react-three/drei@^10`, which support React 19, and the fragile
postprocessing/bloom dependency has been removed entirely (see the
"Feature notes / scope" section below for what replaced it).

**To pick up the fix**, make sure you're using this updated zip, then do a
clean install:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

If `npm install` still errors, run it with `--legacy-peer-deps` and paste
the exact error back — that tells us precisely which package is
conflicting:

```bash
npm install --legacy-peer-deps
```

## If admin login wasn't working

Two separate issues, both fixed:

1. **The login page had no visible link anywhere on the site** — it
   existed at `/admin/login`, but nothing pointed to it, so the only way
   in was typing that URL by hand. There's now a small "Admin" link in
   the site footer.
2. **Login required the entire backend to be configured first.** Admin
   credentials (`ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`)
   used to be validated together with all the Firebase/Resend variables
   in one combined check — so if you hadn't finished the rest of that
   setup yet, login would fail with a misleading "not configured" error
   that had nothing to do with your actual admin credentials. Fixed by
   validating admin login and the Firebase/Resend backend completely
   independently (`getAdminEnv()` vs. `getBackendEnv()` in
   `src/lib/env.ts`) — see "Set the admin credentials" below.

Also new: login now requires **both an email and a password**
(`ADMIN_EMAIL` + `ADMIN_PASSWORD`), not password alone — see that same
section for why.

## Stack

- **Next.js 15** / **React 19** / **TypeScript**
- **Tailwind CSS** for styling
- **Framer Motion** for section, hover, and page-level animation
- **Three.js + React Three Fiber + Drei** for the animated hero scene
- **Lenis** for smooth scrolling
- **Lucide** for icons
- **Firebase Admin SDK + Firestore** for contact submissions and project
  listings (server-only — no client Firebase SDK or config is ever
  shipped to the browser)
- **Cloudinary** for resume PDF storage (signed, server-side uploads only)
- **Resend** for the email notification
- **Zod** for request validation, shared between the client form and the
  API route

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Viewing it on your phone

- **Real URL, works anywhere**: deploy to Vercel (see below) and open the
  link on your phone.
- **Local dev server, same WiFi only**:
  ```bash
  npm run dev -- -H 0.0.0.0
  ```
  then find your computer's local IP (`ipconfig` / `ifconfig` / `ip a` —
  something like `192.168.x.x`) and open `http://192.168.x.x:3000` on your
  phone's browser.

### Build for production

```bash
npm run build
npm start
```

## Project structure

```
src/
  middleware.ts          # protects /admin and /api/admin behind a session cookie
  app/
    fonts.ts              # shared next/font loaders (used by both root layouts)
    globals.css
    robots.ts / sitemap.ts
    (site)/               # the public portfolio — its own root layout
      layout.tsx           # fonts, metadata, PageShell wrapper
      page.tsx              # composes all sections
    (admin)/               # the admin dashboard — a separate, minimal root
                           # layout with no cursor/particles/cookie consent.
                           # Two root layouts via route groups, since a
                           # protected data dashboard shouldn't inherit the
                           # public site's decorative chrome.
      layout.tsx
      admin/
        page.tsx            # redirects to /admin/messages
        login/page.tsx
        messages/page.tsx    # contact submissions
        projects/page.tsx    # add/edit/delete/publish projects
        other-projects/page.tsx # add/edit/delete simple link-out projects
        resumes/page.tsx     # upload + select active resume
        achievements/page.tsx # add/edit/delete/show-hide achievements
        contests/page.tsx    # add/edit/delete/publish contest profile links
    api/
      contact/route.ts      # public: validate, store, email
      projects/route.ts      # public: published projects (Firestore, seed fallback)
      other-projects/route.ts # public: all entries (Firestore only, no fallback)
      resume/route.ts         # public: redirects to the active resume's Cloudinary URL
      achievements/route.ts    # public: visible achievements (Firestore only, no fallback)
      contests/route.ts        # public: published contest links (Firestore, seed fallback)
      admin/
        login/route.ts
        logout/route.ts
        messages/route.ts            # GET: list with filter/sort/pagination
        messages/[id]/route.ts        # PATCH: status, DELETE: remove
        projects/route.ts              # GET: list all, POST: create
        projects/[id]/route.ts          # PATCH: update, DELETE: remove
        projects/seed/route.ts           # POST: one-time import of seed data
        other-projects/route.ts           # GET: list all, POST: create
        other-projects/[id]/route.ts       # PATCH: update, DELETE: remove
        resumes/route.ts                    # GET: list, POST: upload to Cloudinary
        resumes/[id]/route.ts                # PATCH: set active, DELETE: remove
        achievements/route.ts                 # GET: list all, POST: create
        achievements/[id]/route.ts              # PATCH: update, DELETE: remove
        contests/route.ts                        # GET: list all, POST: create
        contests/[id]/route.ts                    # PATCH: update, DELETE: remove
  lib/                    # server-only utilities — the actual backend logic
    env.ts                 # validates all required env vars up front
    firebase-admin.ts       # Firebase Admin SDK singleton (Firestore only)
    firestore-messages.ts   # typed Firestore reads/writes for contact_messages
    firestore-projects.ts    # typed Firestore reads/writes for projects
    firestore-other-projects.ts # typed Firestore reads/writes for other_projects
    firestore-resumes.ts      # Firestore metadata for resumes (Cloudinary-backed)
    firestore-achievements.ts  # typed Firestore reads/writes for achievements
    firestore-contests.ts       # typed Firestore reads/writes for contest links
    cloudinary.ts                 # signed server-side Cloudinary upload/delete
    email.ts                       # Resend sender + email template
    contact-schema.ts               # Zod schema shared by client form + API route
    project-schema.ts                # Zod schema shared by admin form + API routes
    other-project-schema.ts           # Zod schema, incl. "at least one link" rule
    achievement-schema.ts              # Zod schema + fixed category enum
    contest-schema.ts                   # Zod schema shared by admin form + API routes
    sanitize.ts                          # strips markup from free-text fields
    rate-limit.ts                         # in-memory rate limiter (see caveat below)
    request-meta.ts                        # IP / user-agent extraction
    admin-auth.ts                           # signed session cookie (Web Crypto, Edge-safe)
  components/
    layout/             # Loader, Navbar (incl. mobile nav panel), Footer,
                         # CustomCursor, CommandPalette, ScrollProgress,
                         # ThemeProvider,
                         # SoundProvider, AmbientBackground, ParticleField,
                         # CookieConsent, Terminal, AIAssistant,
                         # FloatingDock, EasterEggs, SkipLink,
                         # SmoothScrollProvider, PageShell
    three/
      HeroScene.tsx      # ZUI-style "Infinite Tunnel" R3F hero background —
                         # theme-aware,
                         # device-aware, WebGL-fallback-aware. See "3D hero
                         # scene" further down for details.
      useSceneCapability.ts  # useIsMobile() / useWebglSupported() hooks
    sections/            # Hero, About, Skills, Projects (+ ProjectCard,
                         # ProjectModal — now fetched from /api/projects),
                         # OtherProjects (fetched from /api/other-projects),
                         # Journey, Achievements (fetched from
                         # /api/achievements), Github, CodingProfiles
                         # (fetched from /api/contests), Contact
    admin/                # AdminHeader, ProjectForm, MessageDetailModal
    ui/                  # GlassCard, MagneticButton, AnimatedCounter, Toast
  data/                  # skills.ts, timeline.ts — edit directly.
                         # projects.ts is now also the seed/fallback source
                         # for /api/projects — see "No-fabrication policy"
public/
  resume/                # not used — resumes are managed at /admin/resumes
```

## No-fabrication policy

This build follows one hard rule throughout: **nothing on the page is a
placeholder number or an invented claim.**

- There's no counters-style "Achievements" section with numbers like
  "350+ problems solved" — those were never real. There IS a real
  **Achievements** section now (`/admin/achievements`), but it's a
  proper CMS: every entry is something you typed in yourself and can
  edit or remove at any time, sourced 100% from Firestore with **no
  fallback/seed data at all** — stricter than Projects or Contests,
  which do have a bundled fallback for a brand-new deployment. An empty
  achievements collection means the section simply doesn't render,
  never a placeholder.
- There's no "Experience"/internship section — none exists, so instead
  there's a **Journey** section (`Journey.tsx` / `journeySteps` in
  `src/data/timeline.ts`) that traces what was learned and built, in
  order, without implying employment history.
- The **GitHub section** only ever shows numbers it actually fetched from
  the public GitHub REST API at request time (repo count, followers,
  aggregate stars, per-repo stats, language breakdown computed from real
  repos). If the fetch fails or is rate-limited, it shows a link to the
  profile instead of a stale or fake number — never a fallback mock.
- The **Coding Profiles** section links straight to whatever profiles
  you add at `/admin/contests` (LeetCode, Codeforces, CodeChef, etc.)
  rather than displaying stats, because there's no reliable public API
  for most competitive-programming platforms' data, and unofficial
  scrapers break without notice.
- Project **architecture / challenges & solutions / highlights** fields
  (`src/lib/project-schema.ts`) are empty by default and the UI hides
  those sections entirely when empty. Fill them in yourself with real
  detail — via `/admin/projects` — don't let anything (including an AI
  assistant) invent plausible-sounding architecture notes for you.
- **Projects now come from Firestore, editable at `/admin/projects`,** not
  a static file. The one deliberate exception: `/api/projects` falls back
  to the bundled `src/data/projects.ts` content when Firestore has no
  projects yet (a brand-new deployment). That's a fallback for
  *availability* — so the site isn't blank before you've logged in even
  once — not fabricated data: it's the same real project info from
  before, just not yet migrated into the editable store. "Import default
  projects" on `/admin/projects` does that migration in one click.

If you extend this project, keep that pattern: hide a section instead of
filling it with a placeholder.

## Content you should personalize

- **Resume**: upload it at `/admin/resumes` — see "Managing your resume"
  above. `public/resume/` is not used.
- **Projects**: manage the main "Selected Work" grid at `/admin/projects`
  — see "Managing projects" above.
- **Other projects** (the lighter link-out grid): manage at
  `/admin/other-projects` — see "Managing other projects" above. Not
  static anymore — `src/data/projects.ts` still has the `otherProjects`
  array in it, but nothing reads from it.
- **Coding profiles** (LeetCode, Codeforces, CodeChef, etc.): manage at
  `/admin/contests` — see "Managing contest links" above.
- **Achievements**: manage at `/admin/achievements` — see "Managing
  achievements" above. The section only appears once you've added at
  least one visible entry; there's nothing to disable if you'd rather
  leave it empty for now.
- **Skills, journey, about**: edit the files in `src/data/`.
- **Social links**: `src/components/sections/Contact.tsx` (`SOCIALS`
  array) and `CommandPalette.tsx`.
- **GitHub username**: set `NEXT_PUBLIC_GITHUB_USERNAME` in `.env.local` —
  the GitHub section fetches live repo/user data from the public GitHub
  API. There is no mock fallback; if the fetch fails, the section shows a
  link to the profile instead.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Used for metadata, OG tags, and the sitemap |
| `NEXT_PUBLIC_GITHUB_USERNAME` | Powers the GitHub stats/repo section — defaults to `ABHISHEK-DHARIYAL` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK — required, powers contact messages and projects (Firestore only — no Cloud Storage) |
| `RESEND_API_KEY` | Required — sends the email notification for each contact submission |
| `CONTACT_RECIPIENT_EMAIL` | Optional, defaults to `dhariyalabhi@gmail.com` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required — signed server-side resume PDF uploads |
| `ADMIN_EMAIL` | Required — the one email address allowed to log in |
| `ADMIN_PASSWORD` | Required — password for `/admin/login` |
| `ADMIN_SESSION_SECRET` | Required — random string that signs admin session cookies |

All of these are validated on server startup (`src/lib/env.ts`) — if one is
missing or malformed, you get a specific error naming exactly which
variable is wrong, rather than a vague crash somewhere inside Firebase or
Resend's SDKs.

## Setting up the backend (Firebase, Resend, Cloudinary, admin dashboard)

Contact submissions and project listings run through Firestore. Your
resume PDF runs through Cloudinary instead of Firebase Storage (see
"Setting up Cloudinary" below for why). All of it goes through
server-side SDKs only — **no Firebase client SDK, Cloudinary config, or
any other credential is ever shipped to the browser**; the browser only
ever talks to your own `/api/*` routes.

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) →
   **Add project** (the free Spark plan is enough for this).
2. Go to **Build → Firestore Database → Create database**. Start in
   **production mode** — the Admin SDK bypasses security rules entirely
   (it authenticates as a service account, not a user), so the default
   rules are fine and there's no client-side Firestore access to lock
   down.
3. Go to **Project Settings (gear icon) → Service Accounts → Generate new
   private key**. This downloads a JSON file — copy three values out of
   it:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste the whole
     `-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----` block,
     `\n` sequences and all — `src/lib/firebase-admin.ts` normalizes them)

That's it — **Cloud Storage is not used anywhere in this project** and
doesn't need to be enabled. It's the one Firebase product this project
deliberately avoids: enabling it requires a plan/setup step that isn't
available in every Firebase project, so resume storage uses Cloudinary
instead (see below), which needs nothing beyond a free account.

**Keep that JSON file out of git** — it's a full-access credential.
`.gitignore` already excludes `.env*`, which is where these values belong.

### 2. Set up Cloudinary

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. Your **Cloud Name**, **API Key**, and **API Secret** are all shown
   right on the dashboard home page after signup — no separate product
   to enable, unlike Firebase Storage.
3. Copy them into `.env.local`:
   ```bash
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

That's the entire setup. Uploads happen server-side and signed
(`src/lib/cloudinary.ts`) — the API secret never reaches the browser, and
there's no client-side upload widget, upload preset, or unsigned-upload
configuration involved anywhere.

### 3. Set up Resend

1. Sign up at [resend.com](https://resend.com) using **the same email
   address you want notifications sent to** (`dhariyalabhi@gmail.com` by
   default) — this lets you send from Resend's shared `onboarding@resend.dev`
   sender without verifying your own domain first.
2. Create an API key in the dashboard → `RESEND_API_KEY`.
3. Once you have a domain verified in Resend, switch the `from` address in
   `src/lib/email.ts` to send from it instead of `onboarding@resend.dev`.

### 4. Set the admin credentials

```bash
# ADMIN_EMAIL — the one email allowed to log in (doesn't need to be a
#   real inbox, it's just a credential)
# ADMIN_PASSWORD — anything you don't reuse elsewhere, 8+ characters
# ADMIN_SESSION_SECRET — generate with:
openssl rand -hex 32
```

Put all three in `.env.local`. This is the one account that logs into
`/admin/login` — there's no per-user system, no sign-up flow, just this
single fixed email+password pair, matching how a one-person portfolio's
admin access actually needs to work. **The configured `ADMIN_EMAIL` is
never displayed anywhere** — not on the login page, not in any API
response, not in an error message. A wrong email and a wrong password
produce the exact same generic "Invalid email or password" response, so
there's no way to probe the login form and learn what the real address
is or which field you got wrong.

**Important:** these three admin variables are validated completely
independently from the Firebase/Resend variables above
(`getAdminEnv()` vs. `getBackendEnv()` in `src/lib/env.ts`). Admin login
works the moment these three are set — it does **not** require Firebase
or Resend to be configured. If login wasn't working before, this was
almost certainly why: an earlier version of this code validated every
env var together, so a missing Firebase key made login fail too, with a
misleading "not configured" error that had nothing to do with your admin
credentials.

### 5. Run it

```bash
npm install
npm run dev
```

Submit the contact form — the message should land in Firestore (check
the Firebase Console → Firestore Database → `contact_messages`) and in
your inbox within a few seconds. Then log into `/admin/login` and try
adding a project and uploading a resume.

**Finding the login page**: there's no link to it anywhere on the public
site, by request — go to `/admin/login` directly. Middleware
(`src/middleware.ts`) protects everything past that page exactly as
before; this only affects discoverability, not security. (An earlier
version had a small "Admin" link in the footer — removed.)

Every admin page and every `/api/admin/*` route is protected by the same
mechanism: `/admin/login` checks the submitted email+password against
`ADMIN_EMAIL`/`ADMIN_PASSWORD` and, on success, sets a signed HTTP-only
session cookie (`src/lib/admin-auth.ts`, good for 7 days).
`src/middleware.ts` verifies that cookie — not the email/password again —
before any admin page or API route runs; there's one shared login for
all six admin sections (Messages, Projects, Other Projects, Resume,
Achievements, Contests), not separate logins per section.

### Managing contact messages: `/admin/messages`

Lists every stored message, newest first by default.

- **Filter** by read/unread, **sort** newest/oldest, and **paginate** —
  all three happen server-side via Firestore queries.
- **Search** filters the *currently loaded page* client-side. Firestore
  has no built-in full-text search, so this is an honest limitation, not
  a bug: a true search-across-everything would need a dedicated search
  index (Algolia, Typesense, or a Cloud Function that mirrors writes into
  one). Fine at portfolio-contact-form volume; worth upgrading if this
  ever needs to search thousands of messages.
- **Mark as read/unread** and **delete** are available both inline in the
  table and inside the full message view.

### Managing projects: `/admin/projects`

**Getting there**: log in at `/admin/login`, then click the **"Projects"**
tab at the top of any admin page (next to "Messages," "Other Projects,"
"Resume," "Achievements," and "Contests" — `AdminHeader.tsx`), or go
straight to `/admin/projects`. Once there, there's an **"Add project"**
button in the top-right of the page.

The main "Selected Work" grid on the public site (`Projects.tsx`) fetches
from `/api/projects`, which serves published Firestore documents — add,
edit, publish/unpublish, reorder, or delete projects here and the live
site reflects it immediately, no redeploy needed.

- **New projects render with the exact same card, tilt, spotlight, and
  detail-modal component as the existing ones** (`ProjectCard.tsx` /
  `ProjectModal.tsx`) — the admin form just fills in the same fields
  (features, stack, architecture, challenges/solutions, highlights,
  accent color, live/GitHub links) that those components already render.
  There's no separate "admin project" visual style to keep in sync.
- **Draft vs. published**: uncheck "Published" to work on a project
  without showing it on the live site yet.
- **Order**: lower numbers display first. Ties fall back to Firestore's
  default ordering.
- **First-time setup**: if the `projects` collection is empty (a fresh
  Firebase project), `/api/projects` falls back to the four projects
  bundled in `src/data/projects.ts` so the site isn't blank — but that
  fallback isn't stored or editable. Click **"Import default projects"**
  on `/admin/projects` once to copy them into Firestore as real, editable
  documents. This only runs on an empty collection, so it won't create
  duplicates if you click it again later.
- The lighter **"Other projects"** link-out grid underneath is a
  **separate, simpler admin-managed system** — see "Managing other
  projects" right below — not part of this Projects collection at all
  (deliberately kept as two distinct collections; see that section for
  why).

### Managing other projects: `/admin/other-projects`

A lighter-weight sibling to the main Projects grid, for work that
doesn't need the full case-study treatment — just a name and one or two
links. Deliberately a **separate Firestore collection** (`other_projects`,
not merged into `projects`), so the two stay conceptually distinct:
Projects is "detailed case studies," Other Projects is "here are some
other things I've built."

- **Fields, minimal on purpose**: name, an optional website URL, an
  optional GitHub URL. No description, image, category, tech stack,
  date, icon, or manual ordering — see `other-project-schema.ts`.
- **At least one link is required** — a project with neither a website
  nor a GitHub URL isn't useful to show (nothing to click through to).
  Enforced client-side for instant feedback and, more importantly,
  server-side too (`firestore-other-projects.ts`): editing one link on a
  project validates the *merged result* still has at least one link, not
  just the field you happened to submit — so clearing a website URL on a
  project that only has a website (no GitHub) correctly gets rejected,
  even though the PATCH request itself only mentions `websiteUrl`.
- **Cards only ever show the buttons for links that actually exist** —
  a project with just a GitHub link shows one button, not a disabled or
  empty "Website" button next to it.
- **No visibility/draft flag at all** on this collection (unlike
  Projects, Achievements, and Contests) — every document that exists is
  shown, per spec. If you want to hold a project back, don't add it yet.
- **No seed/fallback data** — same strict rule as Achievements. This
  replaced a previous version of this section that had four bundled
  example projects (Interview Prep, MediCare Scheduler, StaySpot,
  VitalNode) hardcoded in `src/data/projects.ts`; that array is still in
  the file but nothing reads from it anymore. **If you want those four
  back, you'll need to re-add them yourself at `/admin/other-projects`**
  — they won't reappear automatically.

### Managing your resume: `/admin/resumes`

Upload a PDF and it becomes the active resume immediately — no separate
"set active" step needed for a fresh upload (though you can still switch
back to an older one manually; see below).

- **Getting there**: the "Resume" tab next to "Messages" and "Projects"
  in `AdminHeader.tsx`, or go straight to `/admin/resumes`.
- Only PDFs, 10 MB max, enforced both client- and server-side.
- Shows a real upload progress bar (via `XMLHttpRequest`'s
  `upload.onprogress` — `fetch()` doesn't expose upload progress in a
  widely-supported way), plus a success or error toast when it finishes.
- **Storage is Cloudinary, not Firebase Storage.** Firebase Storage
  requires enabling Cloud Storage on the Firebase project, which isn't
  available on every plan/setup; that was a real, common source of
  friction. Cloudinary needs nothing beyond a free account. Uploads are
  **signed and server-side only**: the API secret lives in
  `src/lib/cloudinary.ts` and is never sent to, or generated in, the
  browser.
- **Delivery URLs are signed, not the plain unsigned URL Cloudinary's
  upload response returns.** Cloudinary blocks the plain URL for raw
  PDF/ZIP files on accounts it flags "untrusted" — the default for new
  accounts — returning 401 `show_original_customer_untrusted` even
  though the file uploaded fine and shows up in the Media Library. It's
  a real, documented Cloudinary security behavior, not a bug in the
  upload step. Fixed by generating a **signed** delivery URL instead
  (`buildSignedDeliveryUrl()` in `src/lib/cloudinary.ts`), which
  Cloudinary trusts regardless of that flag — no dashboard setting
  required (though enabling Console → Settings → Security → "Allow
  delivery of PDF and ZIP files" is a valid alternative/additional fix
  if you'd rather not rely on signed URLs). The signed URL is
  regenerated fresh from the stored `publicId` every time a resume is
  read (`firestore-resumes.ts`), not cached from upload time — so this
  also transparently fixes any resume that was uploaded before this fix
  existed, with no re-upload needed.
- **`publicId` is always stored without its file extension** — e.g.
  `resumes/Abhishek`, never `resumes/Abhishek.pdf`. A prior version of
  this fix hit a second, related bug: for a `resource_type: "raw"`
  upload, passing `format: "pdf"` at upload time makes Cloudinary bake
  ".pdf" directly into the `public_id` it returns — so the stored
  `publicId` already had the extension, and the URL-builder was adding
  it a second time on top, producing `resumes/Abhishek.pdf.pdf` and a
  404. `normalizePublicId()` in `src/lib/cloudinary.ts` strips a
  trailing ".pdf" (case-insensitive) at every point a `publicId` is
  stored, used to build a URL, or used to delete an asset — so the
  extension is applied exactly once, always at delivery/deletion time
  via Cloudinary's `format` option, never by string concatenation. This
  self-heals any resume document from before this fix too (its stored
  `publicId` might still have ".pdf" baked in — normalization strips it
  back out transparently), so no manual Firestore edits are needed.
- **Every "Download Resume" button, the command palette's resume
  shortcut, and the terminal's `resume` command all still point at
  `/api/resume`, unchanged.** That route queries Firestore for whichever
  resume is marked active and redirects (307) straight to its (signed)
  Cloudinary URL. Nothing about how those buttons work changes — only
  where the PDF physically lives.
- **You can upload multiple versions and switch which one is live at any
  time** with the "Set active" button — old ones stay listed (and
  downloadable via the external-link icon, which opens the same signed
  URL directly) until you delete them.
- **Deleting the active resume automatically activates the
  next-newest remaining one**, if any exist — the site is never left
  serving nothing just because you cleaned up the one that happened to
  be active. Deleting the last resume leaves `/api/resume` showing a
  friendly "not available" page instead of a broken link.
- **Firestore document shape** (collection `resumes`):
  ```ts
  {
    fileName: string,
    publicId: string,   // Cloudinary's identifier — the durable source of truth;
                         // the delivery URL is always regenerated from this,
                         // never trusted as a frozen value (see above)
    secureUrl: string,  // written at upload time for reference; not read back —
                         // every read recomputes a fresh signed URL instead
    uploadedAt: Timestamp,
    active: boolean,
  }
  ```
  Enforced everywhere a resume's active status changes (upload, "Set
  active," and the auto-reactivation on delete): every write that sets
  one document's `active` to `true` deactivates every other document in
  the *same* batch — so it's never possible for two resumes, or zero
  resumes among existing ones, to disagree about which one is current.

### Managing achievements: `/admin/achievements`

The "Achievements" section on the public site fetches from
`/api/achievements`, which serves visible Firestore documents, newest
first — add, edit, show/hide, or delete achievements here and the live
site reflects it immediately.

- **Only Title, Category, and Visible are required.** Organization,
  Metric / Result, Description, and Link are all optional — and any left
  blank simply doesn't render on the public card at all. No "Organization:
  —", no empty description block, no dead link button. This is enforced
  in both places: `achievement-schema.ts` stores blanks as empty strings
  (not omitted fields — Firestore's own conventions elsewhere in this
  project already treat "" as "not provided" uniformly, e.g.
  `ProjectFormValues.liveUrl`), and `Achievements.tsx` on the public side
  checks each field's truthiness before rendering its section
  (`achievement.metric && (...)`, etc.) — never a fixed template with
  gaps. No date, no icon, and no manual ordering field — this collection
  is intentionally kept simple. Sorting is always by creation time,
  newest first.
- **`Metric / Result`** is specifically for a measurable outcome —
  "Top 1,000 out of 1.5 lakh+ participants," "95.5 Percentile," "50+ Day
  Coding Streak" — kept visually distinct (bolder, brighter text) from
  the free-form `Description` field underneath it.
- **`Link`** is validated as a real URL only when non-empty — an empty
  string is a valid "no link" state, not a validation failure. When
  present, it renders as a small "View →" link in the corner of the
  card; when absent, that whole row just doesn't appear.
- **Category is a fixed dropdown, not free text** — `ACHIEVEMENT_CATEGORIES`
  in `src/lib/achievement-schema.ts` is the single source of truth for
  the list (Programming, Competitive Programming, Hackathon,
  Certification, Academic, Developer Program, Open Source, Internship /
  Work Experience, OA / Assessment, Competition, Other), shared by both
  the admin dropdown and server-side validation — the API rejects
  anything outside that list even if a request bypasses the dropdown
  entirely.
- **No seed/fallback data.** Unlike Projects and Contests, `/api/achievements`
  never falls back to bundled placeholder content — an empty collection
  returns an empty array, full stop. This is a deliberate difference:
  the achievements spec explicitly requires Firestore to be the only
  source of truth, with nothing hardcoded anywhere in the codebase.
- **Visible vs. hidden**: unchecking "Visible" keeps an achievement in
  the admin list (and in Firestore) without showing it on the public
  site — useful for something you're not ready to announce yet, or want
  to retire without deleting the record.
- If there are zero visible achievements, the public section renders
  nothing at all — no heading, no empty card — so it never looks like a
  broken or unfinished part of the page.

### Managing contest links: `/admin/contests`

The "Coding Profiles" section on the public site (`CodingProfiles.tsx`)
fetches from `/api/contests`, which serves published Firestore documents
— add, edit, publish/unpublish, reorder, or delete links here and the
live site reflects it immediately.

- Not locked to LeetCode/Codeforces/CodeChef specifically — `platform`
  is free text, so add whatever profile links are relevant. Each one
  renders as its own clickable card.
- `handle` is optional and purely cosmetic (shown under the platform
  name on the card) — the link itself is entirely driven by `url`.
- Same **draft vs. published** and **display order** pattern as
  Projects: uncheck "Published" to hold a link back from the live site,
  lower `order` numbers show first.
- **First-time setup / fallback**: if the `contests` collection is
  empty, `/api/contests` falls back to a single bundled LeetCode entry
  (the one this section originally shipped with) so the section isn't
  empty before you've added anything — same "availability fallback, not
  fabricated data" pattern used by `/api/projects` (see the
  no-fabrication policy above). Add a real entry at `/admin/contests`
  to replace it; there's no "import defaults" button here since there's
  only ever one seed entry to begin with.
- If you delete every contest link, the "Coding Profiles" section hides
  itself entirely on the public site rather than showing an empty
  heading with nothing underneath it.

### A note on rate limiting

**Rate limiting is in-memory**, not distributed — see the comment at the
top of `src/lib/rate-limit.ts` for exactly what that means on a
serverless platform like Vercel (short version: it's "best effort per
warm instance," not a hard global cap; swapping in Upstash Redis is a
small, documented change if you need a real global limit later). Both the
contact form and the admin login use it.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add every variable from `.env.example` under **Project Settings →
   Environment Variables**. For `FIREBASE_PRIVATE_KEY` specifically: paste
   the value with its `\n` sequences intact (Vercel's env var editor
   handles multi-line values fine when pasted directly — don't manually
   convert the `\n`s to real line breaks, the app does that normalization
   itself in `src/lib/env.ts`).
5. Deploy. Every push to `main` redeploys automatically.

Or via CLI:

```bash
npm i -g vercel
vercel
```

## Feature notes / scope

**Core:** animated letter-by-letter loader with a progress ring, percentage
readout, and particle burst; a theme- and device-aware 3D ZUI-style
"Infinite Tunnel" hero scene (see "3D hero scene" above) with mouse-reactive parallax;
typewriter subtext; a mobile navigation panel (hamburger toggle below
the `md` breakpoint, closes on link click/outside click/Escape, locks
body scroll while open) alongside the unchanged desktop nav; glass
project cards with
3D tilt + spotlight + inline feature list + a full detail modal
(architecture overview, challenges/solutions, highlights — hidden when
empty, see the no-fabrication policy above); an admin-manageable Other
Projects grid with zero fallback data (see "Managing other projects"
above); an interactive
drag-to-rotate skill "galaxy" (grouped-grid fallback on small screens);
a Journey timeline; an admin-manageable Achievements section with zero
fallback data (see "Managing achievements" above); a GitHub section with
live API data only (no mock fallback); a link-only, admin-manageable
Coding Profiles section (see "Managing contest links" above); a glass
contact form
backed by a real API route (Zod validation, honeypot, rate limiting,
Firestore storage, Resend email, toast feedback — see "Setting up the
contact system" above) and a password-protected admin dashboard at
`/admin/messages`; a
command palette (`Ctrl/Cmd + K`); scroll progress bar; magnetic buttons
with ripple feedback; and a real light/dark theme toggle (see below).

## Light / dark theme

The Sun/Moon button in the navbar switches the whole public site between
dark (the site's original, fully-designed look) and light. The choice is
saved to `localStorage` and restored on the next visit; on a first visit
with nothing saved yet, it follows the OS-level light/dark preference.

**How it's implemented** — worth understanding if you're going to touch
styling: every component already had Tailwind's dark-first utility
classes (`bg-base`, `text-white/60`, `border-white/10`, etc.) written
directly into its JSX, with no per-component "light" variant. Rather than
rewrite those classes across 30+ files, `src/app/globals.css` has a CSS
override block, scoped to `[data-theme="light"]`, that re-colors the
*exact compiled output* of every one of those utility classes.
`ThemeProvider.tsx` just decides which theme is active and writes it to
`<html data-theme="...">`; the actual re-coloring is pure CSS. See the
comment block at the top of that section in `globals.css` for the full
reasoning, including exactly why each color was chosen.

**The hero's 3D scene now themes too**, unlike an earlier version. It
used to be hardcoded dark regardless of site theme (requiring a
`.theme-lock-dark` CSS workaround on Hero.tsx and the navbar to avoid
illegible near-black text on a permanently-dark canvas — see that
class's doc comment in `globals.css` for the history). `HeroScene.tsx`
now reads `useTheme()` directly and derives its background, fog, and
every object color from a `PALETTE` map keyed by theme, so Hero no
longer needs any special-casing — it just follows the theme like every
other section. See "3D hero scene" below for the rest of what changed
there.

**One thing left dark in both themes, on purpose:**
- **Floating overlay chrome** — the command palette, cookie consent
  panel, terminal, and AI assistant panel — uses hardcoded hex colors
  rather than the utility classes the override layer targets, so it
  stays dark regardless of theme. This is a common pattern (lots of apps
  keep dropdowns/modals dark independent of the base theme) and it kept
  this change from having to touch a much larger set of files. If you
  want these themed too later, the pattern is the same one used for
  `ParticleField.tsx`/`AmbientBackground.tsx`/`HeroScene.tsx`: read
  `useTheme()` and branch on it directly, rather than trying to extend
  the CSS override layer to arbitrary hex values.

**One known, minor rough edge**: the loading screen always renders in
dark theme for its first ~2 seconds, even if you have light saved as your
preference — `ThemeProvider` intentionally starts every page load in
"dark" (to keep server-rendered and first-client-rendered HTML
identical, which React requires) and only switches after an effect reads
`localStorage`, which runs after that first render. Fixing this properly
means reading the saved theme before the page paints at all (e.g. a tiny
blocking script in `<head>`), which is a reasonable follow-up but adds
real complexity for a ~2-second cosmetic flash.

## 3D hero scene

Replaced the previous "Orbital Core" motif (a rotating wireframe core
with orbiting node rings) with a **Zooming User Interface (ZUI) style
infinite tunnel**: nested rings continuously moving toward the camera,
creating a sense of diving forward through space, with a small pulsing
wireframe "beacon" fixed at the vanishing point as a focal target.
Camera parallax on mouse movement is unchanged in spirit but noticeably
gentler than before — the forward motion already reads as strongly
directional, so a big mouse-driven tilt on top of it felt disorienting
rather than interactive during design.

- **How the infinite part actually works**: each ring's depth (z
  position) lives in a plain `useRef` array in
  `src/components/three/HeroScene.tsx`, updated every animation frame —
  not React state, since re-rendering React 60 times a second for this
  would be wasteful. Every frame, each ring moves toward the camera;
  once a ring passes a near threshold, its position jumps back by the
  tunnel's total depth, instantly placing it at the far end again. Fog
  (see below) fades rings out well before they'd actually reach that
  threshold, so the jump itself is never visible — it happens off in
  the fog, which is what sells the illusion of an endless tunnel rather
  than a visibly looping one.
- **Theme-aware**: `PALETTE` defines `dark` and `light` entries
  (background, fog, ring colors, sparkle color, light intensities) and
  reads `useTheme()` to pick one — every color in the scene traces back
  to that map, nothing is hardcoded. This is also what made it possible
  to remove the `.theme-lock-dark` workaround described above.
- **Device-aware**: `useIsMobile()` (`useSceneCapability.ts`) reduces
  ring count, ring spacing, and forward speed together (so the tunnel
  stays proportionally "the same shape," just smaller and cheaper to
  render), plus fewer sparkles, lower device pixel ratio, and disabled
  antialiasing on small/touch screens.
- **WebGL fallback**: `useWebglSupported()` checks whether the browser
  can actually create a WebGL context before mounting the R3F `<Canvas>`
  at all. If it can't (older devices, locked-down browsers, some
  embedded webviews), the hero renders a plain animated CSS gradient
  instead — never a blank section or a thrown error.



**The admin dashboard has light/dark mode too**, not just the public
site — a Sun/Moon toggle in `AdminHeader.tsx` (present on every
authenticated admin page) and a smaller one in the top corner of
`/admin/login`. Both use the exact same `ThemeProvider` and CSS override
layer as the public site — no separate admin-specific theming code was
needed, since every admin page already used the same plain utility
classes (`text-white/60`, `border-white/10`, `bg-white/[0.03]`,
`bg-base`, etc.) the override layer already targets. Because the admin
dashboard and public site share an origin, they also share the same
`site-theme` localStorage key — pick light mode on either one and it's
already in effect on the other, with no extra wiring. The one thing that
stays dark in both admin themes, consistent with the public site's own
pattern: components using hardcoded hex colors instead of those
utilities (e.g. `MessageDetailModal`'s `bg-[#0A0F24]` panel).

**Added in this pass:** a GDPR-style cookie consent panel (Accept All /
Necessary Only / Customize, preferences stored in `localStorage`); a
cursor-reactive particle constellation field; a layered ambient background
(aurora blobs, drifting mesh gradient, stars, film-grain noise); an
enhanced custom cursor (trail, glow, per-element hover states, click
pulses); a scroll-spy navbar; a global content fade/blur-in after the
loader (the closest sensible equivalent of a "route transition" on a
single-page site — see note below); an interactive terminal (`help`,
`about`, `skills`, `projects`, `journey`, `github`, `leetcode`, `contact`,
`resume`, `whoami`, `clear`, with autocomplete and history); a floating
assistant panel with canned, keyword-matched answers about the projects/
skills/journey/contact info; synthesized UI sound effects (Web Audio
oscillators, muted by default, toggle in the dock); and a Konami-code
easter egg (`↑↑↓↓←→←→ba`) that triggers a matrix-rain overlay and a
confetti burst, plus a console message hinting at it.

**Deliberately out of scope / simplified — noted so nothing is assumed to
silently work:**
- **Multi-page transitions**: this is a single-page portfolio (one route),
  so there's no router-level transition to animate between pages. What's
  implemented instead is a single cinematic fade/blur/scale-in of the page
  content right after the loader. If you split sections into real routes
  later, wrap them in a shared layout and use `AnimatePresence` +
  `usePathname()` for per-route transitions.
- **HDRI lighting, bloom, ambient occlusion, and depth of field** are not
  implemented. An earlier draft of this project added
  `@react-three/postprocessing` for a bloom pass, but that package (and
  post-processing effects generally) is notoriously version-sensitive
  against the exact `three`/`@react-three/fiber` versions in use, and
  getting the pairing wrong is a common cause of a blank page or a runtime
  crash. It was removed to keep the 3D scene reliable; the hero uses
  bright, self-lit (`meshBasicMaterial`) objects and per-theme color
  tuning instead to get most of the visual richness without the fragile
  dependency. If you want real bloom, add `@react-three/postprocessing`
  yourself and pin it to a version documented as compatible with the
  `@react-three/fiber` major version in `package.json` — check their
  README before upgrading either.
- **The AI assistant is a scripted, keyword-matching panel, not a real
  LLM.** It says so in its own header. Wiring it to an actual model (e.g.
  the Claude API) is straightforward — swap the `respond()` function in
  `AIAssistant.tsx` for a `fetch` to your own API route.
- **Sound effects are synthesized**, not audio files, so there's nothing to
  license or host — but they're simple tones, not produced SFX. Swap in
  real audio files under `public/sounds/` and update `SoundProvider.tsx` if
  you want higher production value.
- **Cookie consent preferences are stored in `localStorage` only.** For
  actual GDPR compliance you'd also want a consent log server-side and to
  gate any real analytics/marketing scripts behind the `analytics`/
  `preferences` flags this component already produces.
- Background music, a persisted visitor counter, and resume-download
  analytics still need a backend or third-party service to be meaningful —
  natural follow-ups once you've picked a database/analytics provider.

## Performance & accessibility

- Fonts loaded via `next/font` (self-hosted, no layout shift).
- Hero 3D scene is dynamically imported client-side only.
- Respects `prefers-reduced-motion`.
- Visible focus states on interactive elements.
- Semantic landmarks (`section` per area, single `h1` in the hero).

## License

Personal portfolio code — feel free to use the structure as a reference for
your own site.

## Portfolio chatbot

The floating bot icon opens the **Portfolio Guide**. It answers from the site's own data files (`src/data/*`) — projects, skills, journey, contact — and never invents facts.

- **Built-in engine** (`src/lib/chat-engine.ts`): instant, free, works with no setup. Understands project/skill names (with typo tolerance), returns action buttons (scroll to a section, open a repo/live demo, download the resume) and contextual follow-up suggestions. Achievements and coding profiles are read live from `/api/achievements` and `/api/contests`.
- **Optional AI mode** (`src/app/api/chat/route.ts`): set `ANTHROPIC_API_KEY` in `.env.local` and questions the built-in engine can't answer are sent to an Anthropic model, instructed to answer *only* from the portfolio's facts (`src/lib/chat-knowledge.ts`). Rate-limited per IP; the key stays server-side. Any failure falls back to the built-in engine. Override the model with `CHAT_MODEL`.
- To change what the bot knows, edit the data files — both modes update automatically.
