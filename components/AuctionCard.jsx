'use client';
import CarThumb from './CarThumb';
import Countdown from './Countdown';
import { STATUS, jod, fuelTone, vehicleTitle } from '@/lib/format.mjs';

export function StatusBadge({ status, className = '' }) {
  const s = STATUS[status] || STATUS.live;
  const tone =
    status === 'live'
      ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-600/30'
      : status === 'upcoming'
      ? 'bg-gold-400/20 text-gold-700 ring-gold-600/30'
      : 'bg-ink-500/15 text-ink-500 ring-ink-500/30';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone} ${className}`}>
      {status === 'live' && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>}
      {s.label}
    </span>
  );
}

export default function AuctionCard({ auction: a, index = 0 }) {
  return (
    <a
      href={`./auction/${a.id}/`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-900/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
          <CarThumb auction={a} priority={index < 4} />
        </div>
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={a.status} />
        </div>
        {a.bids > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-ink-900/75 px-2 py-1 text-[11px] font-semibold text-white ltr-nums">
            {a.bids} مزايدة
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-extrabold text-ink-900">{vehicleTitle(a)}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{a.court}{a.city ? ` · ${a.city}` : ''}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {a.fuel && <Chip className={fuelTone(a.fuel)}>{a.fuel}</Chip>}
          {a.gearbox && <Chip>{a.gearbox}</Chip>}
          {a.engineCap ? <Chip>{a.engineCap} سي سي</Chip> : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink-100 pt-3">
          <div>
            <div className="text-[11px] text-ink-400">القيمة الابتدائية</div>
            <div className="text-lg font-extrabold text-ink-900 ltr-nums">{jod(a.startValue)}</div>
          </div>
          <Countdown start={a.startDate} end={a.endDate} status={a.status} compact />
        </div>
      </div>
    </a>
  );
}

function Chip({ children, className = 'bg-ink-100 text-ink-600 ring-ink-500/20' }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${className}`}>
      {children}
    </span>
  );
}
