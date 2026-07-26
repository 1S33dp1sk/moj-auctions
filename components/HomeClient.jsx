'use client';
import { useMemo, useState } from 'react';
import AuctionCard from './AuctionCard';

const SORTS = [
  { key: 'ending', label: 'ينتهي قريباً' },
  { key: 'priceAsc', label: 'الأقل سعراً' },
  { key: 'priceDesc', label: 'الأعلى سعراً' },
  { key: 'yearDesc', label: 'الأحدث صنعاً' },
];

export default function HomeClient({ auctions, meta }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [brands, setBrands] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [cities, setCities] = useState([]);
  const [sort, setSort] = useState('ending');
  const [showFilters, setShowFilters] = useState(false);

  const facets = useMemo(() => {
    const b = new Map(), f = new Map(), c = new Map();
    for (const a of auctions) {
      if (a.brand) b.set(a.brand, (b.get(a.brand) || 0) + 1);
      if (a.fuel) f.set(a.fuel, (f.get(a.fuel) || 0) + 1);
      if (a.city) c.set(a.city, (c.get(a.city) || 0) + 1);
    }
    const sortByCount = (m) => [...m.entries()].sort((x, y) => y[1] - x[1]);
    return { brands: sortByCount(b), fuels: sortByCount(f), cities: sortByCount(c) };
  }, [auctions]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = auctions.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (brands.length && !brands.includes(a.brand)) return false;
      if (fuels.length && !fuels.includes(a.fuel)) return false;
      if (cities.length && !cities.includes(a.city)) return false;
      if (needle) {
        const hay = [a.type, a.brand, a.plate, a.chassis, a.court, a.caseNo, a.city, a.color, a.year]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const t = (x) => (x.endDate ? new Date(x.endDate).getTime() : Infinity);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'priceAsc': return (a.startValue ?? Infinity) - (b.startValue ?? Infinity);
        case 'priceDesc': return (b.startValue ?? -Infinity) - (a.startValue ?? -Infinity);
        case 'yearDesc': return (b.year ?? 0) - (a.year ?? 0);
        default: return t(a) - t(b);
      }
    });
    return list;
  }, [auctions, q, status, brands, fuels, cities, sort]);

  const toggle = (setter, arr) => (v) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeFilterCount = brands.length + fuels.length + cities.length + (status !== 'all' ? 1 : 0);
  const clearAll = () => { setQ(''); setStatus('all'); setBrands([]); setFuels([]); setCities([]); };

  const liveCount = auctions.filter((a) => a.status === 'live').length;
  const upcomingCount = auctions.filter((a) => a.status === 'upcoming').length;

  return (
    <div>
      <Hero meta={meta} live={liveCount} upcoming={upcomingCount} />

      {/* Controls */}
      <div className="sticky top-16 z-30 border-y border-ink-200 bg-ink-50/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالنوع، اللوحة، الشاصي، المحكمة، رقم الدعوى…"
                className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pr-11 pl-3 text-sm shadow-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-ink-200">
              {[['all', 'الكل'], ['live', 'قائم'], ['upcoming', 'قادم']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setStatus(k)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    status === k ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-ink-200 bg-white py-2.5 px-3 text-sm font-semibold text-ink-700 shadow-sm outline-none focus:border-gold-400"
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ring-1 transition ${
                showFilters || activeFilterCount ? 'bg-gold-500 text-white ring-gold-500' : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50'
              }`}
            >
              <FilterIcon className="h-4 w-4" />
              فلاتر
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-xs">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid gap-4 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-3">
              <FacetGroup title="الماركة" items={facets.brands} selected={brands} onToggle={toggle(setBrands, brands)} />
              <FacetGroup title="نوع الوقود" items={facets.fuels} selected={fuels} onToggle={toggle(setFuels, fuels)} />
              <FacetGroup title="المحافظة / المحكمة" items={facets.cities} selected={cities} onToggle={toggle(setCities, cities)} />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            <span className="font-extrabold text-ink-900 ltr-nums">{results.length}</span> مركبة
            {activeFilterCount || q ? ' مطابِقة' : ' معروضة'}
          </p>
          {(activeFilterCount > 0 || q) && (
            <button onClick={clearAll} className="text-sm font-semibold text-gold-600 hover:text-gold-700">
              مسح الفلاتر
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white/50 py-20 text-center">
            <p className="text-ink-500">لا توجد مركبات مطابِقة لبحثك.</p>
            <button onClick={clearAll} className="mt-3 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white">إعادة ضبط</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((a, i) => (
              <div key={a.id} className="animate-fade-up"><AuctionCard auction={a} index={i} /></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Hero({ meta, live, upcoming }) {
  return (
    <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-b from-ink-900 to-ink-800 text-white">
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #c4842f 0, transparent 40%), radial-gradient(circle at 80% 0%, #9fb2c9 0, transparent 35%)' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="max-w-3xl text-2xl sm:text-4xl font-extrabold leading-tight">
          مزادات المركبات الإلكترونية — <span className="text-gold-300">أسرع وأوضح</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink-100/80">
          كل المركبات المطروحة حالياً أو التي ستُطرح للمزاد، بتفاصيلها الكاملة وصورها — بتصفّح فوري بدون انتظار.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <HeroStat value={live} label="مزاد قائم الآن" tone="live" />
          <HeroStat value={upcoming} label="مزاد قادم" tone="upcoming" />
          <HeroStat value={meta.activeCount} label="إجمالي المعروض" tone="total" />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label, tone }) {
  const color = tone === 'live' ? 'text-emerald-300' : tone === 'upcoming' ? 'text-gold-300' : 'text-white';
  return (
    <div className="rounded-2xl bg-white/5 px-5 py-3 ring-1 ring-white/10 backdrop-blur">
      <div className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-ink-100/70">{label}</div>
    </div>
  );
}

function FacetGroup({ title, items, selected, onToggle }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-ink-400">—</span>}
        {items.map(([val, count]) => {
          const on = selected.includes(val);
          return (
            <button
              key={val}
              onClick={() => onToggle(val)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 transition ${
                on ? 'bg-ink-900 text-white ring-ink-900' : 'bg-ink-50 text-ink-600 ring-ink-200 hover:bg-ink-100'
              }`}
            >
              {val}
              <span className={`tabular-nums ${on ? 'text-white/60' : 'text-ink-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchIcon({ className }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
}
function FilterIcon({ className }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
}
