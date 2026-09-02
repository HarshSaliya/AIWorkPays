
# AI Work Log — Project Plan

A referral site listing AI-work platforms and job posts. Visitors click referral links; I earn when they sign up.

**Primary goal:** referral earnings.
**Secondary goal:** a live full-stack project I can show in interviews and honestly explain the backend of.

---

## Repo

One repo, two folders. Frontend built now, backend added in Phase 2.

```
ai-work-log/
  frontend/
    index.html          # Platforms page
    jobs.html           # Job referrals page
    assets/style.css     # shared styles
    assets/app.js        # fetch + render logic
    data/platforms.json  # editable platform list (temporary data source)
    data/jobs.json       # editable job list (temporary data source)
  backend/               # Phase 2 — empty for now
  README.md
```

---

## Phase 1 — Frontend (NOW)

Static site. Data lives in JSON files. No backend yet. The JSON is shaped like a future API response, so swapping to a live API later is a one-line change (`fetch('./data/platforms.json')` → `fetch('/api/platforms/')`).

**Pages**

1. **Platforms** (`index.html`) — directory of AI-work platforms with honest status (paid / waiting / rejected), pay range, referral link. Referral links disclosed.
2. **Job referrals** (`jobs.html`) — job posts I hold a referral link for. Title, company, short note, apply link.

**Data shape**

`data/platforms.json`

```json
[
  {
    "name": "Mindrift",
    "pay": "task-based",
    "status": "paid",
    "desc": "Crowdtesting/QA for AI agents. The one that actually paid me.",
    "url": "https://your-referral-link",
    "disclosed": false,
    "region": ""
  }
]
```

`data/jobs.json`

```json
[
  {
    "title": "Backend Developer (Python)",
    "company": "Example Co",
    "desc": "Remote, Django/DRF. Referral link — I earn if you're hired.",
    "url": "https://your-referral-link",
    "disclosed": true,
    "posted": "2026-09-01"
  }
]
```

**Rules baked into the UI**

- Referral links marked where `disclosed: true`. Never claim a link I don't hold.
- Status shown honestly, including rejections.
- All apply links: `target="_blank" rel="noopener nofollow sponsored"`.
- Responsive, works on mobile (most traffic will be from Instagram bio clicks).

**Update flow (Phase 1):** edit the JSON file, commit, redeploy. Manual — fine for now.

**Deploy:** Netlify Drop or GitHub Pages (static hosting is enough for Phase 1).

---

## Phase 2 — Backend (LATER)

Add when Phase 1 is live. Goal: stop editing JSON by hand; serve data from a database via an API.

- FastAPI (learning goal) — models for Platform + JobPost, read-only public endpoints.
- Postgres on Railway/Render.
- An admin way to add entries weekly (SQLAdmin, or via Swagger docs).
- Frontend swaps its `fetch()` URLs from local JSON to the live API. Nothing else changes.

*Not building this yet.*

---

## One prompt for Claude in VS Code (Phase 1 only)

> Build the **frontend** of a referral site called "The AI Work Log". Static site, no backend yet — data comes from local JSON files.
>
> **Structure:** `frontend/index.html` (platforms page), `frontend/jobs.html` (job referrals page), `frontend/assets/style.css`, `frontend/assets/app.js`, `frontend/data/platforms.json`, `frontend/data/jobs.json`.
>
> **Platforms page:** fetch `data/platforms.json` and render each as an entry with name, pay range, an honest status tag (`paid` = green, `waiting` = amber, `rejected` = red), description, and an Apply link. If `disclosed: true`, show a small note: "Referral link — I earn a bonus if you sign up. It never changes your pay." Show a short header explaining the site is a working dev's honest log.
>
> **Jobs page:** same layout, fetch `data/jobs.json`, render title, company, description, posted date, Apply link, with the same disclosure rule.
>
> **Data shapes:** [paste the two JSON examples above]. Include 3–4 sample entries in each JSON file.
>
> **Design:** honest editorial / working-log feel. Serif display font (Newsreader), IBM Plex Sans body, IBM Plex Mono for status tags and pay figures. Warm off-white background (#FBFAF7), deep ink text (#1A1D24), green/amber/red status colors. Not generic SaaS cards — ledger-style rows. Fully responsive (mobile-first, since traffic comes from Instagram bio links). Accessible focus states, respect prefers-reduced-motion.
>
> **Important:** keep the `fetch()` calls isolated in one function so I can later swap `./data/platforms.json` for a live API URL without touching anything else.
>
> Both pages share a header with links to Platforms and Jobs, and a footer with a referral disclosure line.

---

**Next step:** paste the prompt into Claude in VS Code → build → test locally (run a local server, not `file://`, so `fetch` works: `python -m http.server`) → deploy to Netlify.
