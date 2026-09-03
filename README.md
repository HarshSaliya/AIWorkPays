# AI Work Pays

A referral site listing platforms that pay people to train AI, plus individual job referrals.
Visitors click referral links; the site owner earns when they sign up.

**Primary goal:** referral earnings.
**Secondary goal:** a live full-stack project with a backend that can be explained honestly in an interview.

Wordmark renders lowercase (`aiworkpays`); the full name in titles and OG tags is **AI Work Pays**.

---

## Running it locally

`fetch()` does not work over `file://`, so use a server:

```bash
cd frontend
python3 -m http.server 8000
# open http://localhost:8000
```

---

## Repo layout

```
frontend/
  index.html              # hero + the full platforms ledger
  quiz.html               # 7 questions -> top 3 cards + everything else ranked
  jobs.html               # individual job referrals
  guides.html             # guide index
  guides/                 # 8 written guides + 2 listed as "coming next"
  disclosure.html         # referrals & disclosure policy
  about.html
  404.html
  assets/style.css        # ledger stylesheet, light + dark
  assets/app.js           # getData(), renderers, trackClick(), theme, SITE config
  assets/quiz.js          # question set + scoring engine
  data/platforms.json     # 15 platforms
  data/jobs.json          # 4 sample jobs (placeholder — replace before launch)
  data/guides.json        # guide index metadata
  robots.txt  sitemap.xml
backend/                  # Phase 2 — empty
```

No build step, no dependencies. Deploys as static files (Vercel).

---

## Phase 1 — done

Static site, data in local JSON shaped like a future API response.

### The one swap point

All data access goes through `getData()` in `assets/app.js`. Phase 2 is a change to one object:

```js
const ENDPOINTS = {
  platforms: 'data/platforms.json',   // -> '/api/platforms/'
  jobs:      'data/jobs.json',        // -> '/api/jobs/'
  guides:    'data/guides.json'       // -> '/api/guides/'
};
```

Nothing else in the frontend touches a URL.

### Honesty rules baked into the UI

- **`status: paid` means "this platform pays its contributors and is operating"** — judged from
  published terms and public worker reports on the month in `last_checked`. It is **not** a personal
  earnings claim and not a promise of acceptance. This is stated on the homepage and in full on
  `disclosure.html`.
- **Pay figures are labelled `advertised`**, with the month checked, never "verified".
- **`disclosed: true`** renders a filled green button, `rel="noopener nofollow sponsored"`, and the
  referral disclosure line. **`disclosed: false`** renders an outlined button,
  `rel="noopener nofollow"`, and the line "Direct link — no referral relationship, so this listing
  earns nothing."
- **`honest_note`** puts each platform's catch (withdrawal minimums, maturity holds, unpaid exams)
  next to its pay figure rather than leaving it out.
- Country pages state that they are compiled from published terms, not written from personal
  experience of working from that country.

### The quiz

Seven single-select questions — experience, education, country, hours, pay preference, entry-gate
tolerance, strength. Every platform is scored and ranked; **nothing is eliminated**, so a picky set
of answers can never produce an empty result. Top 3 get full cards, the rest are listed ranked below.

Weights live in `scorePlatform()` in `assets/quiz.js`. Country eligibility carries the most weight
(±30) because it is the real dealbreaker. Gate tolerance is treated as a ceiling, not an equality:
someone willing to do a video interview is also willing to do a written test or no gate at all.

Reason bullets come from each platform's authored `reasons` map, keyed by `dimension:answer`. Where
no authored line exists for a matched dimension, `genericReason()` supplies a factual fallback built
from that platform's own tags, so a strong match never shows a single thin bullet.

---

## Updating the data

Edit the JSON, commit, redeploy. Manual, and fine at this size.

### Adding a referral link to a platform

Only four fields change:

```json
"url": "https://your-referral-link",
"disclosed": true,
"referral_terms": "You get a $4 welcome credit through my link.",
"honest_note": "$25 minimum withdrawal, and earnings sit in a 20-day hold."
```

`referral_terms` replaces the default disclosure line when set. Leave it empty to use the standard
"Referral link — I earn a bonus if you sign up through it. It never changes your pay."

### Platform schema

```jsonc
{
  "slug": "dataannotation",
  "name": "DataAnnotation",
  "status": "paid",              // paid | waiting | rejected | untested
  "last_checked": "2026-09",
  "blurb": "One line, shown in the ledger row.",
  "detail": "Longer paragraph, shown when the row is expanded.",
  "pay": { "display": "$20–30/hr", "as_of": "2026-09", "source": "advertised" },
  "url": "https://…",
  "disclosed": false,
  "referral_terms": "",          // shown on the listing and in the referral hub
  "referral_threshold": "",      // what has to happen before the referral counts
  "honest_note": "",
  "tags": {
    "experience": ["none","side","pro"],
    "education":  ["none","college","bachelors","advanced"],
    "countries":  ["us","ca","uk","in","ph","ng","ke","other"],
    "hours":      ["under5","5-10","10-20","20+"],
    "pay_style":  "steady",       // steady | ceiling | either
    "gate":       "written",      // none | written | video
    "strength":   ["generalist","coding","professional"]
  },
  "reasons": { "gate:written": "The entry gate is a written assessment, not a résumé." }
}
```

`tags` drives the quiz scoring. `countries` is still used for the ledger's "Open to" filter.

---

## Outstanding before launch

- [ ] Real referral links — set `url`, `disclosed`, `referral_terms` per platform
- [ ] Replace the four placeholder entries in `data/jobs.json`
- [ ] Write the "Who runs it" paragraph on `about.html`
- [ ] Buy the domain, then update `SITE.url` in `app.js`, the `<link rel="canonical">` in each page,
      `robots.txt` and `sitemap.xml` (currently `aiworkpays.example`)
- [ ] Create a GoatCounter account and set `SITE.goatcounter` in `app.js`, then add the GoatCounter
      script tag. `trackClick()` is already wired to every outbound link and no-ops until then.

---

## Phase 2 — backend (later)

- FastAPI, models for Platform and JobPost, read-only public endpoints.
- Postgres on Railway/Render.
- Admin route for weekly entries (SQLAdmin or Swagger).
- Frontend change: the `ENDPOINTS` object above. Nothing else.
