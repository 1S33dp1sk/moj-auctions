import data from '@/data/auctions.json';
import Gallery from '@/components/Gallery';
import Countdown from '@/components/Countdown';
import { StatusBadge } from '@/components/AuctionCard';
import { jod, dateTime, dateOnly, vehicleTitle, fuelTone } from '@/lib/format.mjs';

export function generateStaticParams() {
  return data.auctions.map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }) {
  const a = data.auctions.find((x) => x.id === params.id);
  return { title: a ? `${vehicleTitle(a)} — مزاد` : 'مزاد' };
}

export default function AuctionPage({ params }) {
  const a = data.auctions.find((x) => x.id === params.id);
  if (!a) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-ink-900">المزاد غير موجود</h1>
        <a href="../../" className="mt-4 inline-block rounded-lg bg-ink-900 px-4 py-2 text-white">العودة للقائمة</a>
      </div>
    );
  }

  const savingsPct = a.estValue && a.startValue ? Math.round((1 - a.startValue / a.estValue) * 100) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <a href="../../" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <span>→</span> كل المزادات
      </a>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: gallery + specs */}
        <div>
          <Gallery auction={a} />

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-900/[0.04]">
            <h2 className="mb-4 text-lg font-extrabold text-ink-900">مواصفات المركبة</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="نوع المركبة" value={a.type} strong />
              <Field label="سنة الصنع" value={a.year} nums />
              <Field label="اللون" value={a.color} />
              <Field label="رقم اللوحة" value={a.plate} nums />
              <Field label="رقم الشاصي" value={a.chassis} nums />
              <Field label="رقم المحرك" value={a.engineNo} nums />
              <Field label="سعة المحرك" value={a.engineCap ? `${a.engineCap} سي سي` : null} nums />
              <Field label="ناقل الحركة" value={a.gearbox} />
              <Field label="نوع الوقود">
                {a.fuel ? <span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-semibold ring-1 ${fuelTone(a.fuel)}`}>{a.fuel}</span> : '—'}
              </Field>
              <Field label="صفة المركبة" value={a.vehClass} />
              <Field label="مكان الحجز" value={a.location} className="col-span-2 sm:col-span-3" />
            </dl>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-900/[0.04]">
            <h2 className="mb-4 text-lg font-extrabold text-ink-900">معلومات المحكمة والإعلان</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="المحكمة / الدائرة" value={a.court} className="col-span-2" />
              <Field label="رقم الدعوى" value={a.caseNo} nums />
              <Field label="نوع الإعلان" value={a.adType} className="col-span-2" />
              <Field label="حالة المزاد" value={a.officialStatus} />
              <Field label="تاريخ بداية الإعلان" value={dateTime(a.startDate)} />
              <Field label="تاريخ انتهاء الإعلان" value={dateTime(a.endDate)} />
              <Field label="تاريخ النشر" value={dateOnly(a.publishDate)} />
              <Field label="الصحيفة" value={a.newspaper} />
              <Field label="العدد" value={a.issue} nums />
            </dl>
          </div>
        </div>

        {/* Right: sticky auction panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-900/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={a.status} />
              {a.bids > 0 && <span className="text-sm text-ink-500 ltr-nums">{a.bids} مزايدة</span>}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight text-ink-900">{vehicleTitle(a)}</h1>
            <p className="mt-1 text-sm text-ink-500">{a.court}{a.city ? ` · ${a.city}` : ''}</p>

            <div className="mt-5 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
              <Countdown start={a.startDate} end={a.endDate} status={a.status} />
            </div>

            <div className="mt-5 space-y-3">
              <PriceRow label="القيمة الابتدائية للمزاد" value={jod(a.startValue)} big />
              <PriceRow label="القيمة التقديرية" value={jod(a.estValue)} />
              <PriceRow label="الحد الأدنى للزيادة" value={jod(a.minIncrement)} />
              {savingsPct != null && savingsPct > 0 && (
                <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  تبدأ بنسبة {savingsPct}% تحت القيمة التقديرية
                </div>
              )}
            </div>

            <a
              href="https://auctions.moj.gov.jo/AuctionsList.aspx"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 block rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-3 text-center font-extrabold text-white shadow-lg shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-500"
            >
              المشاركة في المزاد على الموقع الرسمي ↗
            </a>
            <p className="mt-3 text-center text-xs text-ink-400">
              المزايدة والدفع تتم حصراً عبر موقع وزارة العدل الرسمي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children, nums, strong, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className={`mt-0.5 ${strong ? 'text-base font-bold' : 'text-sm font-medium'} text-ink-900 ${nums ? 'ltr-nums' : ''}`}>
        {children ?? (value || '—')}
      </dd>
    </div>
  );
}

function PriceRow({ label, value, big }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-500">{label}</span>
      <span className={`ltr-nums font-extrabold text-ink-900 ${big ? 'text-2xl text-gold-600' : 'text-base'}`}>{value}</span>
    </div>
  );
}
