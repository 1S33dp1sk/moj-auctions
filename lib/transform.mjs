// Shared, pure transforms that turn a raw scraped card (Arabic label/value
// strings) into a clean, typed record the website can render and filter.
// Used by BOTH the live scraper (scraper/scrape.mjs) and the seed builder
// (scripts/build-seed.mjs) so the data shape can never drift between them.

// Jordan observes UTC+3 year-round (no DST since 2022).
const JORDAN_OFFSET = '+03:00';

/** Convert Arabic-Indic digits to Western and keep only number-ish chars. */
export function toNumber(raw) {
  if (raw == null) return null;
  const western = String(raw)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  const m = western.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/** Parse "DD/MM/YYYY" or "DD/MM/YYYY HH:mm:ss" → ISO string (Jordan tz). */
export function toISO(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!m) return null;
  const [, d, mo, y, h = '00', mi = '00', s = '00'] = m;
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${JORDAN_OFFSET}`;
}

// Best-effort brand detection from the free-text vehicle type. Jordanian
// listings are hand-typed and inconsistent, so we match on keywords and fall
// back to the raw text. `latin` powers filtering + a clean chip label.
const BRANDS = [
  { latin: 'Hyundai', ar: 'Hyundai', kw: ['هونداي', 'هوانداي', 'هواندي', 'هيونداي'] },
  { latin: 'Honda', ar: 'Honda', kw: ['هوندا'] },
  { latin: 'Toyota', ar: 'Toyota', kw: ['تويوتا', 'تيوتا'] },
  { latin: 'Kia', ar: 'Kia', kw: ['كيا'] },
  { latin: 'Tesla', ar: 'Tesla', kw: ['تسلا'] },
  { latin: 'Chevrolet', ar: 'Chevrolet', kw: ['شفر', 'شيفر', 'شفرول', 'شيفرول', 'اوبترا'] },
  { latin: 'Ford', ar: 'Ford', kw: ['فورد'] },
  { latin: 'Volkswagen', ar: 'Volkswagen', kw: ['فوكس', 'فولكس', 'فوكسفاجن', 'id4', 'id.4'] },
  { latin: 'BAIC', ar: 'BAIC', kw: ['baic', 'بايك'] },
  { latin: 'Changan', ar: 'Changan', kw: ['شانجان', 'changan', 'شنجان'] },
  { latin: 'Mitsubishi', ar: 'Mitsubishi', kw: ['ميتسوبيشي', 'متسوبيشي'] },
  { latin: 'Peugeot', ar: 'Peugeot', kw: ['بيجو', 'بيجيو'] },
  { latin: 'Isuzu', ar: 'Isuzu', kw: ['اسوزو', 'ايسوزو'] },
  { latin: 'Land Rover', ar: 'Land Rover', kw: ['رنج روفر', 'لاند روفر', 'رنج'] },
  { latin: 'Mercedes', ar: 'Mercedes', kw: ['مرسيدس', 'مرسدس'] },
  { latin: 'BMW', ar: 'BMW', kw: ['بي ام', 'bmw', 'بمو'] },
  { latin: 'Nissan', ar: 'Nissan', kw: ['نيسان'] },
  { latin: 'MG', ar: 'MG', kw: ['ام جي', 'mg '] },
];

export function detectBrand(typeRaw) {
  const t = (typeRaw || '').toLowerCase();
  for (const b of BRANDS) {
    if (b.kw.some((k) => t.includes(k.toLowerCase()))) return b.latin;
  }
  return null;
}

// Fuel normalization for clean filter chips.
export function normalizeFuel(raw) {
  const t = (raw || '').trim();
  if (/كهرب/.test(t)) return 'كهرباء';
  if (/هجين|هايبرد/.test(t)) return 'هايبرد';
  if (/ديزل/.test(t)) return 'ديزل';
  if (/بنزين/.test(t)) return 'بنزين';
  return t || null;
}

// Pull a coarse governorate/city out of the court or holding-yard text.
const CITIES = ['عمان', 'الزرقاء', 'اربد', 'المفرق', 'مادبا', 'البلقاء', 'معان', 'الكرك', 'العقبة', 'جرش', 'عجلون', 'الطفيلة', 'السلط', 'الوسطية', 'بني عبيد', 'بني كنانة'];
export function detectCity(...texts) {
  const joined = texts.filter(Boolean).join(' ');
  for (const c of CITIES) if (joined.includes(c)) return c;
  return null;
}

/**
 * Derive auction lifecycle status relative to `nowISO`.
 *  - upcoming: start date in the future
 *  - live:     started, not yet ended
 *  - ended:    end date in the past
 */
export function deriveStatus(startISO, endISO, nowISO) {
  const now = new Date(nowISO).getTime();
  const start = startISO ? new Date(startISO).getTime() : null;
  const end = endISO ? new Date(endISO).getTime() : null;
  if (end != null && now > end) return 'ended';
  if (start != null && now < start) return 'upcoming';
  return 'live';
}

/**
 * Transform one raw card { id, dataId, title, bids, s:{...specs}, g:{...gov} }
 * into a clean record. `nowISO` controls status derivation (defaults to build time).
 */
export function transformRecord(raw, nowISO = new Date().toISOString()) {
  const s = raw.s || {};
  const g = raw.g || {};
  const startISO = toISO(g.startDate);
  const endISO = toISO(g.endDate);
  const status = deriveStatus(startISO, endISO, nowISO);

  const images = Array.isArray(raw.images) ? raw.images : [];

  return {
    id: String(raw.id),
    dataId: raw.dataId ? String(raw.dataId) : null,
    slug: String(raw.id),

    // vehicle
    type: s.type || null,
    brand: detectBrand(s.type),
    year: toNumber(s.year),
    color: s.color || null,
    chassis: s.chassis || null,
    plate: s.plate || null,
    vehClass: s.vehClass || null,
    engineNo: s.engineNo || null,
    fuel: normalizeFuel(s.fuel),
    fuelRaw: s.fuel || null,
    gearbox: s.gearbox || null,
    engineCap: toNumber(s.engineCap),
    location: s.location || null,

    // court / auction
    court: g.court || null,
    city: detectCity(g.court, s.location),
    caseNo: g.caseNo || null,
    adType: g.adType || null,
    startDate: startISO,
    endDate: endISO,
    startDateRaw: g.startDate || null,
    endDateRaw: g.endDate || null,
    publishDate: toISO(g.publishDate),
    startValue: toNumber(g.startValue),
    estValue: toNumber(g.estValue),
    minIncrement: toNumber(g.minIncrement),
    officialStatus: g.status || null, // e.g. "قيد التنفيذ"
    newspaper: g.newspaper || null,
    issue: g.issue || null,

    // engagement
    bids: toNumber(raw.bids) ?? 0,

    // derived
    status, // live | upcoming | ended
    images,
    hasImages: images.length > 0,
  };
}

/** Keep only live + upcoming (drop finished auctions), then sort ending-soonest first. */
export function filterActive(records) {
  return records
    .filter((r) => r.status !== 'ended')
    .sort((a, b) => {
      const ax = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const bx = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return ax - bx;
    });
}
