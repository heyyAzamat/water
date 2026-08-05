# AquaVision AI

**Intelligent monitoring of water bodies using computer vision.**

Upload a photograph of a river, lake, reservoir or pond. AquaVision analyses the
image, scores the water body's environmental condition from 0–100, explains what
it found, tracks how the site changes over time, and puts every finding on an
interactive map.

No IoT devices. No sensors. No hardware. The entire platform is digital — a
camera and a browser.

---

## Why this exists

Hardware water monitoring is accurate and expensive. A sensor buoy costs
thousands and covers a single point, which is why the overwhelming majority of
the world's water bodies have no monitoring at all.

AquaVision trades a little precision for orders of magnitude more coverage: any
person with a phone becomes a monitoring station, and a location photographed
monthly by five people produces a trend signal no single lab sample can.

The platform is explicit about that trade-off. It reports what is *visible*, it
reports its confidence, and it says plainly in every report that it cannot
detect dissolved chemistry, heavy metals or bacteria.

---

## Runs with zero configuration

```bash
npm install
npm run dev          # → http://localhost:3000
```

That is the whole setup. With no environment variables the platform boots in
**demo mode**:

| Subsystem | Without keys | With keys |
|---|---|---|
| Database | Bundled dataset — 28 real water bodies, ~200 assessments over 18 months | Supabase Postgres |
| Vision AI | Colourimetric heuristic engine (measures the actual image) | Google Gemini Vision |
| Storage | Uploads embedded in-session | Supabase Storage |
| Auth | Synthetic demo admin | Supabase Auth (email + Google) |

Every page — dashboard, map, trends, leaderboard, moderation queue — is fully
explorable immediately. Uploads you make during a session are genuinely
analysed and appear on the map, the dashboard and the leaderboard.

Add credentials to switch each subsystem to production independently. The
`/profile` page shows which mode each subsystem is currently in.

---

## The AI pipeline

The interesting part is not "send image to model, print number". It's the four
things that make the number defensible.

### 1 · Thirteen independent indicators

The vision model rates each pollution signal separately, with a pixel-level
evidence note: water clarity, plastic waste, floating garbage, oil film, foam,
algal bloom, unnatural colouration, sediment load, industrial discharge, sewage,
dead aquatic life, construction debris, eutrophication.

### 2 · The score is recomputed, not trusted

A single opaque number from a model is not auditable. `src/lib/ai/scoring.ts`
recomputes the composite severity from the indicator matrix using a weighted
mean blended with the **worst single indicator** — so one oil slick in an
otherwise clean frame is not averaged away:

```
matrix  = weightedMean × (1 − peakBias) + worstIndicator × peakBias
score   = matrix × 0.68 + modelOverallGuess × 0.32
```

If the model's own overall guess **diverges** from its indicator matrix, that
divergence is subtracted from the reported confidence rather than quietly
discarded.

### 3 · Trends that don't cry wolf

`src/lib/ai/trend.ts` fits confidence-weighted least squares over a location's
history, so a blurry 41 %-confidence photo cannot swing the verdict as hard as a
crisp 92 % one. Two guards prevent false alarms:

- an explicit **±6-point noise floor** — water photographs genuinely vary with
  light, season and framing, and movement smaller than that is reported as
  *stable*;
- a direction is only declared when the window-mean comparison **and** the
  regression slope agree in sign.

A 30-day projection is only shown when the fit actually explains the variance
(r² ≥ 0.25, at least 3 observations).

### 4 · Honest degradation

With no vision API key the platform still produces a real assessment.
`src/lib/ai/image-features.ts` measures the image in the browser — Sobel edge
density, luminance contrast, hue entropy, green/brown colour casts, specular
ratio — and `src/lib/ai/heuristic.ts` maps those measurements onto the *same*
indicator matrix. Results are flagged `simulated` and labelled "Heuristic
engine" in the UI. A green-dominant frame correctly scores an algal bloom; a
dark iridescent frame correctly scores an oil film.

### Severity bands

| Score | Grade | Meaning |
|---|---|---|
| 0–20 | **Excellent** | No visible contamination |
| 21–40 | **Good** | Minor debris or slight turbidity |
| 41–60 | **Moderate** | Noticeable indicators, monitoring advised |
| 61–80 | **Poor** | Significant contamination, intervention advised |
| 81–100 | **Critical** | Severe pollution, immediate response required |

One scale, defined once in `GRADES`, used identically by the score ring, map
markers, chart bands, alert thresholds and the PDF export.

---

## Features

**Analysis** — drag & drop (PNG/JPEG/WEBP), client-side compression to ~1.5 MB
before upload, live colourimetry, staged progress, animated circular score
gauge, indicator matrix with evidence notes, recommendations.

**Map** — Leaflet with severity-coloured markers, density clustering, a heat
layer sharing the same colour ramp, filters (date, region, water body type,
grade, minimum severity), search with autocomplete, click-through report cards.
Critical markers pulse.

**Reports** — full environmental document: coordinates, imagery, findings,
indicator table, AI reasoning, recommendations, trend summary with chart.
Exportable to PDF, printable with dedicated print styles, shareable via a public
link that needs no account.

**Community** — field observations (smell, dead fish, foam, illegal dumping,
nearby factory, discoloured water, oil sheen, excess vegetation) recorded
alongside the AI verdict. Human notes *corroborate* a detection and are capped
so they can never manufacture a critical score alone. Threaded comments with
optimistic posting.

**Dashboard** — personal statistics, score history chart, recent uploads,
network hotspots, leaderboard, seven derived achievements with progress.

**Notifications** — nearby report, pollution increase, critical trend. Fan-out
happens in a Postgres trigger using a great-circle distance filter against each
user's configured monitoring radius.

**Moderation** — assessments scoring ≥ 90 are held for human review before
reaching the public map; a false critical alert costs more credibility than a
slow one. Approve / flag / reject / delete, plus user management.

---

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Radix UI primitives · Framer Motion · Supabase (Postgres + Auth + Storage) ·
Leaflet + markercluster + heat · Recharts · Google Gemini Vision · Zod ·
jsPDF + html2canvas-pro

---

## Architecture

```
src/
├── app/
│   ├── (auth)/            login · signup · server actions
│   ├── (app)/             authenticated shell — force-dynamic
│   │   ├── dashboard/     stats · history · achievements · leaderboard
│   │   ├── upload/        analysis pipeline
│   │   ├── map/           full-screen explorer
│   │   ├── reports/       list + filters, and [id] detail document
│   │   ├── leaderboard/ notifications/ profile/ admin/
│   ├── r/[token]/         public share view, no account needed
│   ├── api/               analyze · reports · comments · notifications ·
│   │                      profile · locations/search · stats · contact
│   └── auth/callback/     OAuth + email confirmation exchange
├── components/
│   ├── ui/                primitives (button, card, field, dialog, …)
│   ├── shared/            score ring, badges, stat tiles, reveal
│   ├── landing/ map/ upload/ reports/ charts/ admin/ app/
├── lib/
│   ├── ai/                scoring · prompt · vision · heuristic ·
│   │                      image-features · trend
│   ├── data/              repository (reads) · write (mutations) ·
│   │                      mappers · demo-store · sample-image
│   ├── supabase/          browser · server · admin · middleware clients
│   ├── auth.ts env.ts navigation.ts utils.ts
└── types/
supabase/
├── migrations/0001_init.sql      schema, views, triggers, RPCs
├── migrations/0002_policies.sql  RLS + storage policies
└── seed.sql                      locations + generated assessments
```

**Key boundaries:**

- **`lib/data/repository.ts` is the only read surface.** Every function has two
  implementations behind one signature — Supabase or the demo dataset. No page
  or route ever branches on which backend is live.
- **`lib/data/write.ts` is the only write surface.** Mutations live apart from
  reads because they need the service-role client: an AI score must never be
  writable from a browser session.
- **Scores are always re-normalised server-side.** `POST /api/reports` runs the
  client-supplied analysis back through `normaliseAnalysis()`, so a crafted
  request cannot publish a forged score.
- **Navigation is centralised** in `lib/navigation.ts`. The sidebar, mobile
  drawer and user menu all read from it, so a role change cannot leave a stale
  path in one component and not another.

---

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the environment template and fill in the keys from **Project settings →
   API**:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server-only, never commit
   ```

3. Run the migrations in order (SQL editor, or `psql`):

   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
   psql "$DATABASE_URL" -f supabase/migrations/0002_policies.sql
   psql "$DATABASE_URL" -f supabase/seed.sql   # optional demo content
   ```

   `0001` creates the schema, the `report_details` read view, the leaderboard
   and stats views, the points and notification triggers, and the geospatial
   RPCs. `0002` enables RLS on every table and creates the storage bucket.

4. **Google sign-in:** Authentication → Providers → Google. Set the redirect URL
   to `<your-origin>/auth/callback`.

5. Promote yourself to admin so the moderation panel opens:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

### Database schema

Normalised to 3NF. One upload has exactly one `ai_analysis` and at most one
`report`, which is what lets the trend engine treat a location's reports as a
clean time series.

```
profiles ──┬─< uploads ──1:1── ai_analysis
           │      │
           │      └──1:1── reports ──< comments
           ├─< locations
           └─< notifications
```

`report_details` denormalises the five-way join every list view needs, so the
query planner's work lives in one place.

**RLS posture:** approved public reports are world-readable — environmental
condition data is a public good, and that openness is what makes the map useful
to the people who can act on it. Everything writable is owner-scoped, with an
admin/moderator escape hatch resolved through `SECURITY DEFINER` helpers so
policies never recurse into `profiles`.

---

## Enabling Gemini Vision

Get a key from [Google AI Studio](https://aistudio.google.com/apikey):

```env
GOOGLE_GENERATIVE_AI_API_KEY=...
VISION_MODEL=gemini-2.5-flash
```

The model is called with a structured JSON response schema and a system
instruction that emphasises conservatism — do not report a bloom when you see
reflected foliage, do not report oil when you see a specular sun reflection. The
client-measured image statistics are passed alongside as corroborating evidence.

If the API fails or times out, the heuristic engine takes over and the result is
flagged `simulated` rather than the upload failing.

---

## Performance & accessibility

Server Components by default, with the map payload streamed behind `Suspense` so
it never blocks the hero. Client-side compression before upload. Pagination on
every list, `chunkedLoading` on marker clusters, capped result windows with the
truncation stated in the UI rather than hidden. `optimizePackageImports` for
lucide/recharts/framer-motion.

Full keyboard navigation with a skip link, a consistent `:focus-visible` ring,
ARIA roles on the score meters, map, filters and tab groups, labelled form
fields with `aria-describedby` wiring, `prefers-reduced-motion` honoured
globally, semantic landmarks and a real `<table>` for the leaderboard.

---

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint (next/core-web-vitals + typescript)
npx tsc --noEmit # type check
```

---

## Known limitations

Stated plainly, because a monitoring tool that overstates itself is worse than
none:

- **Visual assessment only.** Dissolved chemistry, heavy metals, pH and bacteria
  leave no visual trace and are out of scope. Every report says so.
- **Confidence is not a formality.** Low light, motion blur, heavy compression,
  extreme distance and shoreline-dominated frames all measurably reduce it.
- **The contact form validates and logs.** No transactional email provider is
  wired up; `src/app/api/contact/route.ts` is the single integration point.
  Pretending to deliver mail would be worse than a visible seam.
- **Demo mode is in-memory.** Uploads and profile edits persist for the life of
  the server process, not across restarts. Connect Supabase for durability.
- **Two transitive advisories remain** in `npm audit` (`postcss`, `sharp`, both
  reached through `next`). They are build-time/image-processing dependencies and
  are only fixable by moving to Next 16, which the specified stack pins away
  from. Next is on the latest patched 15.x.
