# Mautic Email Dashboard — Restaurant Association

A simple internal dashboard that replaces having to dig through Mautic's own
reports UI. It shows, in one screen: total contacts, form submissions,
category-based interest emails, nurture email A/B performance, weekly
newsletter/blog stats, and bounce/DNC deliverability — all pulled live from
your Mautic instance.

---

## How it works

```
Browser (React dashboard)
        │
        ▼
Vercel Serverless Functions   (/api/*.js — runs on the server, not the browser)
        │
        ▼
Mautic REST API                (your existing Mautic instance)
```

- The **frontend** (`src/`) is a static React app. It never talks to Mautic
  directly — it only calls its own `/api/...` routes.
- The **backend** (`api/`) is a set of small Vercel serverless functions.
  They authenticate with Mautic (OAuth2 client-credentials), call the Mautic
  REST API, and return clean, pre-shaped JSON to the frontend.

This split matters for one reason: **your Mautic Client Secret must never
reach the browser.** Anyone could open dev tools and steal it. Keeping the
Mautic calls server-side (in `/api`) keeps the secret safe in Vercel's
environment variables only.

No database is used. Every page fetches fresh data from Mautic on load —
simplest possible setup, nothing to host or maintain besides Vercel itself
(free tier is enough).

---

## Project structure

```
mautic-dashboard/
├── api/                          → Vercel serverless functions (backend)
│   ├── _lib/
│   │   └── mauticClient.js       → OAuth2 + Mautic API request helper
│   ├── dashboard-summary.js      → top cards on the main Dashboard
│   ├── email-performance.js      → funnel + trend chart (Email ID 77)
│   ├── categories.js             → Email By Category page
│   ├── form-submissions.js       → Form Submissions page
│   ├── nurture-emails.js         → Nurture Emails page (A/B variants)
│   ├── newsletter-blog.js        → Newsletter & Blog page
│   └── deliverability.js         → Bounce/DNC page
│
├── src/
│   ├── config/
│   │   └── mauticMapping.js      → ⭐ every Mautic ID/tag/pattern lives here
│   ├── components/               → Sidebar, Topbar, StatCard, loading/error states
│   ├── hooks/
│   │   └── useApiData.js         → shared fetch-from-/api hook
│   ├── pages/                    → one file per sidebar page
│   ├── App.jsx                   → routes
│   └── main.jsx                  → React entry point
│
├── .env.example                  → copy to .env for local dev
├── vercel.json                   → SPA routing config for Vercel
└── package.json
```

### The one file you'll edit most: `src/config/mauticMapping.js`

Every Mautic email ID, form ID, tag name, and search pattern the dashboard
depends on is defined in this single file — nowhere else. If you add a new
nurture email, rename a tag, or a form ID changes in Mautic, update it here
and every page that uses it updates automatically.

---

## Setup

### 1. Get your Mautic API credentials

In Mautic:
1. **Settings (gear icon) → Configuration → API Settings** → turn **API
   enabled** to Yes → Save.
2. **Settings → API Credentials → New** → create an OAuth2 client
   (any name, redirect URI can be anything for client-credentials flow).
3. Copy the **Client ID**, **Client Secret**, and note your Mautic
   **Base URL** (e.g. `https://g1.restaurantassociation.com`).

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Copy `.env.example` to `.env` and fill in your real values:

```
MAUTIC_BASE_URL=https://your-mautic-instance.com
MAUTIC_CLIENT_ID=your_client_id
MAUTIC_CLIENT_SECRET=your_client_secret
```

**Never commit `.env` to git** — it's already in `.gitignore`.

### 4. Run locally

Because this project uses Vercel serverless functions (`/api`), the plain
`vite dev` server can't run them. Use the Vercel CLI instead, which runs
both the frontend and the `/api` functions together:

```bash
npm install -g vercel
vercel dev
```

This starts the app at `http://localhost:3000` with working `/api` routes.

(If you only want to preview the UI without a working backend, `npm run dev`
still works — the pages will just show a connection error where data would
normally appear, until Mautic credentials are set.)

---

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the
   repo.
3. In **Project → Settings → Environment Variables**, add the same three
   variables from `.env.example` (`MAUTIC_BASE_URL`, `MAUTIC_CLIENT_ID`,
   `MAUTIC_CLIENT_SECRET`) with your real values.
4. Deploy. Vercel auto-detects the Vite frontend and the `/api` functions —
   no extra config needed beyond `vercel.json` (already included).

---

## Data mapping reference

This is what each page shows and where the numbers come from in Mautic.
Full detail is in `src/config/mauticMapping.js`.

| Page | Mautic source |
|---|---|
| Dashboard — top cards | `Sign_Up` tag (contacts), 7 forms (submissions), Email ID 77 (sent/delivered/opened/clicked) |
| Dashboard — funnel & trend | Email ID 77 only |
| Email By Category | 8 fixed email IDs (77, 113, 78, 79, 80, 81, 82, 84), one per category |
| Form Submissions | 7 forms (IDs 6, 10, 11, 12, 13, 14, 15) + confirmation/internal email pairs for 4 of them |
| Nurture Emails | 14 email pairs (IDs 85–112), A/B variant comparison |
| Newsletter | Emails whose name contains "Restaurant Association Newsletter" (searched by name, not fixed ID — a new email is created weekly) |
| Blog | Emails whose name contains "Blogs \| Blog - 2026" (same reasoning) |
| Deliverability | Bounce/DNC counts from Email ID 77 + DNC contact count |

### ⚠️ Before going live, double-check this

The nurture email IDs for steps 2–13 (`Start Exploring`, `Industry News`,
etc.) were filled in following the numbering pattern confirmed for step 1
and step 14. Open Mautic → Emails and confirm each ID in
`src/config/mauticMapping.js` matches the real email before trusting the
Nurture Emails page in production. Only step 1 (85/86) and step 14
(111/112) were explicitly double-checked.

The bounce split (hard vs soft) on the Deliverability page is currently
**estimated** — Mautic's default `/api/emails/{id}` response doesn't break
bounces into hard/soft. If you have real hard/soft bounce data (e.g. via a
Mautic plugin), update `api/deliverability.js` to pull the real numbers.

---

## Adding more data later

- **Contacts page** is a placeholder — the brief didn't require a full
  contact list/table, just the total count. To build it out, add a new
  `/api/contacts.js` function that paginates Mautic's `/api/contacts`
  endpoint.
- **Reports / Email Templates / Tags Management** sidebar links exist but
  don't have pages yet — add new files under `src/pages/` and a route in
  `src/App.jsx` following the same pattern as the existing pages.
