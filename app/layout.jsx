import './globals.css';
import data from '@/data/auctions.json';

export const metadata = {
  title: 'مزادات المركبات — نسخة سريعة',
  description:
    'تصفّح سريع وحديث لمزادات المركبات الإلكترونية (وزارة العدل) — كل المركبات المطروحة حالياً أو التي ستُطرح، بتفاصيلها الكاملة وصورها.',
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#132030',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  const { meta } = data;
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`:root{--font-arabic:'Tajawal'}`}</style>
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <SiteHeader meta={meta} />
        <main className="flex-1">{children}</main>
        <SiteFooter meta={meta} />
      </body>
    </html>
  );
}

function SiteHeader({ meta }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/10 bg-ink-900/95 backdrop-blur supports-[backdrop-filter]:bg-ink-900/80 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="./" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-900 shadow-lg shadow-gold-500/20">
              <GavelIcon className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight">مزادات المركبات</span>
              <span className="block text-[11px] text-ink-200/80">نسخة سريعة · بيانات وزارة العدل</span>
            </span>
          </a>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <HeaderStat value={meta.activeCount} label="مزاد نشط" />
            <span className="h-8 w-px bg-white/10" />
            <a
              href="https://auctions.moj.gov.jo/AuctionsList.aspx"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg px-3 py-1.5 text-ink-100 ring-1 ring-white/15 hover:bg-white/10 transition"
            >
              الموقع الرسمي ↗
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderStat({ value, label }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-lg font-extrabold text-gold-300 tabular-nums">{value}</span>
      <span className="text-ink-200/80">{label}</span>
    </span>
  );
}

function SiteFooter({ meta }) {
  const snapshot = meta.snapshotAt
    ? new Intl.DateTimeFormat('ar-JO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Amman' }).format(new Date(meta.snapshotAt))
    : '—';
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-sm text-ink-500 space-y-2">
        <p>
          هذه واجهة عرض غير رسمية تهدف لتسريع تصفّح مزادات المركبات. المصدر الرسمي والوحيد المعتمد هو{' '}
          <a className="text-ink-700 underline hover:text-gold-600" href="https://auctions.moj.gov.jo/AuctionsList.aspx" target="_blank" rel="noreferrer noopener">
            موقع المزادات الإلكترونية — وزارة العدل
          </a>.
        </p>
        <p className="text-ink-400">
          آخر تحديث للبيانات: <span className="ltr-nums">{snapshot}</span>
          {meta.isSeed ? ' · لقطة تجريبية (بدون صور)' : ''}
        </p>
      </div>
    </footer>
  );
}

function GavelIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14 3l7 7-3 3-7-7 3-3z" fill="currentColor" opacity=".9" />
      <path d="M3 21h9M6 18l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 8.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
