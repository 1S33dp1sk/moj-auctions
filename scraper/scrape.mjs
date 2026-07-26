#!/usr/bin/env node
/**
 * MOJ auctions scraper.
 *
 * The source (auctions.moj.gov.jo) is ASP.NET WebForms: a ViewState-driven
 * Repeater where pagination, "details" and images are all __doPostBack calls,
 * and the whole site is gated behind a session `token` minted by the MOJ portal.
 * So we drive a real browser (Playwright) rather than replay HTTP by hand.
 *
 * Flow:
 *   1. Open the tokened list URL. If it bounces (missing/expired token) we abort
 *      WITHOUT touching data.json, so the site keeps serving the last good snapshot.
 *   2. Walk every list page, extracting the specs + court/gov blocks that are
 *      already embedded in each card's DOM (.row > .col-xs-5 label / .col-xs-7 value).
 *   3. Keep only live + upcoming auctions (drop finished ones).
 *   4. For each kept auction, open its detail view (postback) and pull the
 *      base64 car photos out of #tabImage, downscaling with sharp to web sizes.
 *   5. Write data/auctions.json (same shape as the seed) + public/car-images/<id>/*.jpg.
 *
 * Config (env):
 *   MOJ_AUCTIONS_URL  full tokened list URL (preferred), OR
 *   MOJ_TOKEN         just the token value (URL is built for you)
 *   SCRAPE_IMAGES     "0" to skip photo download (data only). Default "1".
 *   SCRAPE_ANNOUNCEMENT "1" to also save the sale-notice image. Default "0".
 *   SCRAPE_MAX_PAGES  cap pages (debug). Default: all.
 *   HEADLESS          "0" to watch it run. Default headless.
 *   NOW_ISO           override "now" for status derivation. Default: run time.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { transformRecord, filterActive } from '../lib/transform.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TOKEN = process.env.MOJ_TOKEN || '';
const LIST_URL =
  process.env.MOJ_AUCTIONS_URL ||
  (TOKEN ? `https://auctions.moj.gov.jo/AuctionsList.aspx?token=${TOKEN}` : '');
const WANT_IMAGES = process.env.SCRAPE_IMAGES !== '0';
const WANT_ANNOUNCE = process.env.SCRAPE_ANNOUNCEMENT === '1';
const MAX_PAGES = process.env.SCRAPE_MAX_PAGES ? parseInt(process.env.SCRAPE_MAX_PAGES, 10) : Infinity;
const HEADLESS = process.env.HEADLESS !== '0';
const NOW_ISO = process.env.NOW_ISO || new Date().toISOString();

if (!LIST_URL) {
  console.error('✖ No token. Set MOJ_AUCTIONS_URL (full tokened URL) or MOJ_TOKEN.');
  process.exit(2);
}

// --- Browser-side extractor, injected into every list page --------------------
const PAGE_EXTRACTOR = () => {
  const SPEC = { 'نوع المركبة': 'type', 'سنة الصنع': 'year', 'اللون': 'color', 'رقم الشاصي': 'chassis', 'رقم اللوحة': 'plate', 'صفة المركبة': 'vehClass', 'رقم المحرك': 'engineNo', 'نوع الوقود': 'fuel', 'ناقل الحركة': 'gearbox', 'مكان الحجز': 'location', 'سعة المحرك': 'engineCap' };
  const GOV = { 'المحكمة / الدائرة': 'court', 'رقم الدعوى': 'caseNo', 'الإعلان': 'adType', 'تاريخ بداية الاعلان': 'startDate', 'تاريخ انتهاء الاعلان': 'endDate', 'القيمة الابتدائية للمزاد': 'startValue', 'القيمة التقديرية': 'estValue', 'الحد الأدنى لقيمة الزيادة': 'minIncrement', 'حالة المزاد': 'status', 'الصحيفة': 'newspaper', 'العدد': 'issue', 'تاريخ النشر': 'publishDate' };
  const rows = (el, map) => {
    const o = {};
    if (!el) return o;
    el.querySelectorAll('.row').forEach((r) => {
      const c = r.querySelectorAll('[class*="col-xs"]');
      if (c.length >= 2) { const k = map[c[0].textContent.trim()]; if (k) o[k] = c[1].textContent.trim(); }
    });
    return o;
  };
  const html = document.documentElement.innerHTML;
  const idmap = {}; let m; const re = /SetCurrentAuctionID\((\d+)\);SetAuctionData\((\d+)/g;
  while ((m = re.exec(html))) idmap[m[1]] = m[2];
  const ids = Array.from(document.querySelectorAll('[id^="tabDetails_"]')).map((e) => e.id.replace('tabDetails_', ''));
  return ids.map((id) => {
    const spec = document.getElementById('tabDetails_' + id);
    const gov = document.getElementById('tabGovInfo_' + id);
    let card = spec; for (let i = 0; i < 7 && card; i++) card = card.parentElement;
    const ct = card ? card.innerText : '';
    const title = ((ct.match(/رقم المزاد\s*:?\s*([^\n]+)/) || [])[1] || '').trim();
    const bids = (ct.match(/عدد المزاودات\s*:?\s*([0-9]+)/) || [])[1] || '';
    return { id, dataId: idmap[id] || '', title, bids, s: rows(spec, SPEC), g: rows(gov, GOV) };
  });
};

const firstCardId = () => {
  const el = document.querySelector('[id^="tabDetails_"]');
  return el ? el.id : null;
};

async function looksLikeList(page) {
  return page.evaluate(() => !!document.querySelector('[id^="tabDetails_"]'));
}

async function waitAdvance(page, prevFirstId, timeout = 15000) {
  await page.waitForFunction(
    (prev) => {
      const el = document.querySelector('[id^="tabDetails_"]');
      return el && el.id !== prev;
    },
    prevFirstId,
    { timeout }
  ).catch(() => {});
}

// Click a pager link by its visible label ("2".."10" or "»"). Returns true if clicked.
async function clickPager(page, label) {
  return page.evaluate((lbl) => {
    const a = Array.from(document.querySelectorAll('a')).find(
      (x) => /lbPaging|lbNext/.test(x.getAttribute('href') || '') && x.textContent.trim() === lbl
    );
    if (!a) return false;
    a.click();
    return true;
  }, label);
}

async function main() {
  console.log(`▶ Launching browser (headless=${HEADLESS})`);
  const browser = await chromium.launch({
    headless: HEADLESS,
    executablePath: process.env.CHROME_PATH || undefined,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  console.log('▶ Opening list page…');
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  if (!(await looksLikeList(page))) {
    console.error('✖ The list page did not load any auctions — the token is missing or expired.');
    console.error('  data.json was NOT modified; the site keeps its previous snapshot.');
    await browser.close();
    process.exit(3);
  }

  // --- Phase A: paginate + collect every card -------------------------------
  const all = [];
  let pageNum = 1;
  while (pageNum <= MAX_PAGES) {
    const cards = await page.evaluate(PAGE_EXTRACTOR);
    cards.forEach((c) => (c._page = pageNum));
    all.push(...cards);
    console.log(`  · page ${pageNum}: +${cards.length} (total ${all.length})`);

    const prevFirst = await page.evaluate(firstCardId);
    // Prefer the numbered link; fall back to » for windows beyond 10.
    let advanced = await clickPager(page, String(pageNum + 1));
    if (!advanced) advanced = await clickPager(page, '»');
    if (!advanced) break;
    await waitAdvance(page, prevFirst);
    const nowFirst = await page.evaluate(firstCardId);
    if (nowFirst === prevFirst) break; // no real advance → done
    pageNum++;
  }
  console.log(`▶ Collected ${all.length} auctions across ${pageNum} page(s).`);

  // --- Transform + keep active ---------------------------------------------
  let records = all.map((c) => transformRecord(c, NOW_ISO));
  // carry page index for image navigation
  records.forEach((r, i) => (r._page = all[i]._page));
  const active = filterActive(records);
  console.log(`▶ ${active.length} active (live/upcoming) of ${records.length} total.`);

  // --- Phase B: images ------------------------------------------------------
  const imagesDir = join(ROOT, 'public', 'car-images');
  if (WANT_IMAGES) {
    await mkdir(imagesDir, { recursive: true });
    let done = 0;
    for (const rec of active) {
      try {
        const saved = await scrapeImages(page, rec);
        rec.images = saved;
        rec.hasImages = saved.length > 0;
      } catch (err) {
        console.warn(`  ! images failed for ${rec.id}: ${err.message}`);
        rec.images = [];
        rec.hasImages = false;
      }
      done++;
      if (done % 5 === 0 || done === active.length) console.log(`  · images ${done}/${active.length}`);
    }
  }

  // --- Write dataset --------------------------------------------------------
  const dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      snapshotAt: NOW_ISO,
      source: 'https://auctions.moj.gov.jo/AuctionsList.aspx',
      isSeed: false,
      pagesScraped: pageNum,
      totalCaptured: records.length,
      activeCount: active.length,
      withImages: active.filter((a) => a.hasImages).length,
    },
    auctions: active.map(stripInternal),
  };
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(join(ROOT, 'data', 'auctions.json'), JSON.stringify(dataset, null, 2));
  await writeFile(join(ROOT, 'scraper', 'last-raw.json'), JSON.stringify({ capturedAt: NOW_ISO, cards: all }, null, 2));

  // Drop image folders for auctions that are no longer active, so the snapshot
  // repo doesn't accumulate photos of finished auctions forever.
  if (WANT_IMAGES) {
    const keep = new Set(active.map((a) => a.id));
    try {
      const { readdir } = await import('node:fs/promises');
      const entries = await readdir(imagesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory() && !keep.has(e.name)) {
          await rm(join(imagesDir, e.name), { recursive: true, force: true });
          console.log(`  · pruned stale images for ${e.name}`);
        }
      }
    } catch { /* dir may not exist yet */ }
  }

  console.log(`✔ Wrote data/auctions.json — ${active.length} active, ${dataset.meta.withImages} with photos.`);
  await browser.close();
}

function stripInternal(r) {
  const { _page, ...rest } = r;
  return rest;
}

/**
 * Open one auction's detail view and save its car photos.
 * We reload the list, jump to the auction's page, then click the item whose
 * onclick carries SetCurrentAuctionID(<id>) — ctl indices repeat per page, but
 * the auction id is unique, so we match on that.
 */
async function scrapeImages(page, rec) {
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // navigate to the auction's page
  for (let p = 1; p < (rec._page || 1); p++) {
    const prev = await page.evaluate(firstCardId);
    let ok = await clickPager(page, String(p + 1));
    if (!ok) ok = await clickPager(page, '»');
    if (!ok) break;
    await waitAdvance(page, prev);
  }

  // click this auction's "attachments & images" link
  const clicked = await page.evaluate((id) => {
    const a = Array.from(document.querySelectorAll('a')).find(
      (x) => (x.getAttribute('onclick') || '').includes(`SetCurrentAuctionID(${id})`) &&
             /lbtnDetails|lbtnViewAllImages/.test(x.getAttribute('href') || '')
    );
    if (!a) return false;
    a.click();
    return true;
  }, rec.id);
  if (!clicked) throw new Error('details link not found on page');

  await page.waitForURL(/AuctionDetails\.aspx/, { timeout: 20000 });
  await page.waitForTimeout(800);

  // pull base64 car photos (+ optional announcement) from the DOM
  const dataUris = await page.evaluate((wantAnnounce) => {
    const grab = (sel) =>
      Array.from(document.querySelectorAll(`${sel} img`))
        .map((i) => i.currentSrc || i.src)
        .filter((s) => s && s.startsWith('data:image'));
    let list = grab('#tabImage');
    if (list.length === 0) {
      // fallback: any large embedded photo (car photos are ~1200x1600)
      list = Array.from(document.querySelectorAll('img'))
        .filter((i) => i.naturalWidth >= 900 && (i.src || '').startsWith('data:image'))
        .map((i) => i.src);
    }
    if (wantAnnounce) list = list.concat(grab('#tabImageAnnouncment'));
    return list;
  }, WANT_ANNOUNCE);

  if (dataUris.length === 0) return [];

  const dir = join(ROOT, 'public', 'car-images', rec.id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const saved = [];
  for (let i = 0; i < dataUris.length; i++) {
    const b64 = dataUris[i].split(',')[1];
    if (!b64) continue;
    const buf = Buffer.from(b64, 'base64');
    const out = join(dir, `${i + 1}.jpg`);
    await sharp(buf)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(out);
    saved.push(`/car-images/${rec.id}/${i + 1}.jpg`);
  }
  return saved;
}

main().catch((err) => {
  console.error('✖ Scrape failed:', err);
  process.exit(1);
});
