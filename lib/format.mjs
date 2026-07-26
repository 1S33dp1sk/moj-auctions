// Display helpers shared across server + client components.

export const STATUS = {
  live: { label: 'مزاد قائم', tone: 'live' },
  upcoming: { label: 'لم يبدأ بعد', tone: 'upcoming' },
  ended: { label: 'منتهٍ', tone: 'ended' },
};

const nf = new Intl.NumberFormat('en-US');

/** 5125 -> "٥٬١٢٥ د.أ" style but with Western digits for clarity. */
export function jod(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${nf.format(n)} د.أ`;
}

export function num(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return nf.format(n);
}

const dtFull = new Intl.DateTimeFormat('ar-JO', {
  timeZone: 'Asia/Amman',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const dtDate = new Intl.DateTimeFormat('ar-JO', {
  timeZone: 'Asia/Amman',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function dateTime(iso) {
  if (!iso) return '—';
  try { return dtFull.format(new Date(iso)); } catch { return '—'; }
}
export function dateOnly(iso) {
  if (!iso) return '—';
  try { return dtDate.format(new Date(iso)); } catch { return '—'; }
}

/** Fuel → tailwind tone classes for chips. */
export function fuelTone(fuel) {
  switch (fuel) {
    case 'كهرباء': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'هايبرد': return 'bg-teal-50 text-teal-700 ring-teal-600/20';
    case 'ديزل': return 'bg-amber-50 text-amber-800 ring-amber-600/20';
    case 'بنزين': return 'bg-sky-50 text-sky-700 ring-sky-600/20';
    default: return 'bg-ink-100 text-ink-600 ring-ink-500/20';
  }
}

/** Human vehicle title, e.g. "هونداي ايونيك 2022". */
export function vehicleTitle(a) {
  const parts = [a.type];
  if (a.year) parts.push(a.year);
  return parts.filter(Boolean).join(' ');
}

/** Compute ms remaining and a breakdown for a countdown target. */
export function breakdown(ms) {
  const clamped = Math.max(0, ms);
  const s = Math.floor(clamped / 1000);
  return {
    done: ms <= 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
