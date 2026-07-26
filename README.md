# مزادات المركبات — a fast mirror of the MOJ electronic auctions

A modern, **fast** front‑end for Jordan's Ministry of Justice electronic
vehicle auctions (`auctions.moj.gov.jo`), plus the scraper that feeds it.

The official site is an ASP.NET WebForms app that ships **megabytes of base64
images inline in every page** and does everything through server postbacks — so
it feels slow. This project decouples the two halves:

- a **scraper** (Playwright) takes a periodic *snapshot* of the auctions, and
- a **static Next.js site** serves that snapshot from a CDN with optimized,
  lazy‑loaded images, instant client‑side search/filter, and live countdowns.


k
The result loads and filters instantly while showing the same data: full vehicle
specs, the court/case block, prices, dates, and photos — for every auction that
is **currently running or upcoming** (finished auctions are dropped).

---

## How it works

```
 auctions.moj.gov.jo                 GitHub Actions (every 6h)              Vercel / Netlify
 ┌──────────────────┐   token URL   ┌───────────────────────────┐  commit  ┌────────────────┐
 │ ASP.NET WebForms │ ────────────► │ scraper/scrape.mjs         │ ───────► │ static export  │
 │ list + details   │               │  · walk all pages          │  data +  │ (out/)         │
 │ (base64 images)  │               │  · keep live + upcoming    │  images  │  → global CDN  │
 └──────────────────┘               │  · pull + optimize photos  │          └────────────────┘
                                     │  → data/auctions.json      │
                                     │  → public/car-images/…     │
                                     └───────────────────────────┘
```

The website only ever reads `data/auctions.json` and `public/car-images/`. It
never talks to the MOJ site at request time, which is what makes it fast and
resilient — if a snapshot fails, the last good one keeps serving.

## Repo layout

```
app/                     Next.js App Router (RTL Arabic)
  page.jsx               home — grid + search/filter/sort
  auction/[id]/page.jsx  detail — gallery, specs, court info, countdown
components/              AuctionCard, HomeClient, Gallery, Countdown, CarThumb
lib/
  transform.mjs          raw scraped card → clean record (SHARED by scraper+seed)
  format.mjs             Arabic number/date/status display helpers
data/auctions.json       the snapshot the site renders (built from seed or scraper)
scraper/
  scrape.mjs             the Playwright scraper (run this on a schedule)
  raw-seed.json          a real captured snapshot of pages 1–3 (2026‑07‑26), no photos
scripts/build-seed.mjs   builds data/auctions.json from raw-seed.json
.github/workflows/scrape.yml   scheduled snapshot + auto‑commit
```

## Quick start (the website)

```bash
npm install
npm run build:seed     # generate data/auctions.json from the bundled real snapshot
npm run dev            # http://localhost:3000
```

Build the static site:

```bash
npm run build          # outputs to ./out  (fully static, deploy anywhere)
```

The repo ships with a **real 30‑vehicle snapshot** (pages 1–3, captured
2026‑07‑26) so the site is populated out of the box. That seed has no photos —
run the scraper to fill them in.

## The scraper

### 1. Get a token

The MOJ auctions subdomain is gated behind a session `token` minted by the MOJ
portal — open the auctions list in your browser and copy the **entire URL**,
including `?token=…`. One token unlocks the whole site (list + all details).

> **Tokens expire.** When they do, the scraper detects it, exits without
> touching your data, and (in CI) posts a warning. Just paste a fresh URL.

### 2. Run it

```bash
# option A: pass the URL inline
MOJ_AUCTIONS_URL="https://auctions.moj.gov.jo/AuctionsList.aspx?token=…" npm run scrape

# option B: put it in a .env file (see .env.example) and use Node's env-file flag
node --env-file=.env scraper/scrape.mjs
```

First time only, install the browser Playwright uses:

```bash
npx playwright install chromium
```

For every kept auction the scraper opens the detail view and captures **all
three media tabs** — الصور (car photos), تقرير الخبرة (the expert valuation report
scans), and الاعلان (the official sale notice) — saving them under
`public/car-images/<id>/{photos,report,announcement}/`. On the site, the detail
page shows them as switchable tabs.

Options (env vars): `SCRAPE_IMAGES=0` (data only, fast), `SCRAPE_REPORT=0` (skip
the heavy report scans), `SCRAPE_MAX_PAGES=2` (cap while testing), `HEADLESS=0`
(watch it run). The scraper walks **every** list page, writes `data/auctions.json`,
and prunes media of auctions that have ended.

## Scheduled snapshots (automation)

`.github/workflows/scrape.yml` runs the scraper every 6 hours, commits the new
snapshot, and that commit triggers your host to redeploy.

Setup: in your GitHub repo, **Settings → Secrets and variables → Actions → New
repository secret**, add `MOJ_AUCTIONS_URL` = your full tokened URL. That's it.
You can also trigger it any time from the **Actions** tab → *Run workflow*.
Adjust the cadence by editing the `cron:` line.

## Deploy

**Vercel** — zero config. Import the repo; Vercel detects Next.js and serves the
static export. Every snapshot commit auto‑redeploys.

**Netlify** — `netlify.toml` is included (`build = npm run build`, `publish =
out`). Import the repo and deploy.

Because the build is a static export, it also drops onto Cloudflare Pages, GitHub
Pages, S3, or any static host.

## Data schema (per auction)

`id`, `dataId`, `type`, `brand` (auto‑detected), `year`, `color`, `chassis`,
`plate`, `vehClass`, `engineNo`, `fuel` + `fuelRaw`, `gearbox`, `engineCap`,
`location`, `court`, `city`, `caseNo`, `adType`, `startDate`/`endDate` (ISO,
Asia/Amman), `publishDate`, `startValue`, `estValue`, `minIncrement`,
`officialStatus`, `newspaper`, `issue`, `bids`, `status` (`live`/`upcoming`),
`photos[]`, `report[]`, `announcement[]` (+ `hasPhotos`/`hasReport`/`hasAnnouncement`),
and `images[]` (alias of `photos`, used for the card thumbnail).

The homepage filters entirely client‑side (instant): free‑text search, live vs
upcoming, and facet filters for **manufacturer**, fuel, and court, plus
**year** and **starting‑price** ranges — with sort by ending‑soon / price / year.

## Notes & disclaimer

This is an **unofficial** convenience viewer. All bidding, payment, and legally
binding information must be confirmed on the official site:
<https://auctions.moj.gov.jo/AuctionsList.aspx>. Every page links back to it.
The scraper reads only the same public auction listings a visitor sees, at a
polite once‑every‑few‑hours cadence.
