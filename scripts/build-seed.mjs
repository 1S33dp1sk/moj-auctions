// Builds data/auctions.json (the dataset the website renders) from the bundled
// real snapshot in scraper/raw-seed.json. The live scraper writes the SAME
// file shape, so `npm run scrape` transparently replaces this seed.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { transformRecord, filterActive } from '../lib/transform.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const raw = JSON.parse(await readFile(join(root, 'scraper', 'raw-seed.json'), 'utf8'));
// Use the capture time as "now" so the seed's live/upcoming split is stable.
const nowISO = raw.capturedAt || new Date().toISOString();

const records = raw.cards.map((c) => transformRecord(c, nowISO));
const active = filterActive(records);

const dataset = {
  meta: {
    generatedAt: new Date().toISOString(),
    snapshotAt: raw.capturedAt,
    source: 'https://auctions.moj.gov.jo/AuctionsList.aspx',
    isSeed: true,
    pagesScraped: raw.sourcePagesScraped || null,
    totalCaptured: records.length,
    activeCount: active.length,
    note: raw.note || null,
  },
  auctions: active,
};

await mkdir(join(root, 'data'), { recursive: true });
await writeFile(join(root, 'data', 'auctions.json'), JSON.stringify(dataset, null, 2), 'utf8');

console.log(
  `✔ Built data/auctions.json — ${active.length} active of ${records.length} captured (snapshot ${raw.capturedAt}).`
);
