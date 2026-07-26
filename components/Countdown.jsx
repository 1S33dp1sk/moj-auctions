'use client';
import { useEffect, useState } from 'react';
import { breakdown } from '@/lib/format.mjs';

/**
 * Live countdown. For live auctions counts down to `end`; for upcoming ones
 * counts down to `start` with a "يبدأ بعد" prefix. Compact variant for cards.
 */
export default function Countdown({ start, end, status, compact = false }) {
  const target = status === 'upcoming' ? start : end;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return null;
  const ms = new Date(target).getTime() - now;
  const b = breakdown(ms);
  const prefix = status === 'upcoming' ? 'يبدأ بعد' : 'ينتهي بعد';

  if (b.done) {
    return (
      <span className={compact ? 'text-xs font-semibold text-ink-400' : 'text-sm font-semibold text-ink-400'}>
        {status === 'upcoming' ? 'يبدأ الآن' : 'انتهى المزاد'}
      </span>
    );
  }

  const urgent = ms < 3600_000 * 6 && status !== 'upcoming';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 tabular-nums text-xs font-bold ltr-nums ${
          urgent ? 'text-red-600' : 'text-ink-700'
        }`}
        title={prefix}
      >
        <ClockIcon className="h-3.5 w-3.5 opacity-70" />
        {b.days > 0 && <span>{b.days}ي</span>}
        <span>{pad(b.hours)}:{pad(b.minutes)}:{pad(b.seconds)}</span>
      </span>
    );
  }

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-ink-500">{prefix}</div>
      <div className="flex gap-2 ltr-nums" dir="ltr">
        {b.days > 0 && <TimeCell v={b.days} l="يوم" urgent={urgent} />}
        <TimeCell v={pad(b.hours)} l="ساعة" urgent={urgent} />
        <TimeCell v={pad(b.minutes)} l="دقيقة" urgent={urgent} />
        <TimeCell v={pad(b.seconds)} l="ثانية" urgent={urgent} />
      </div>
    </div>
  );
}

function TimeCell({ v, l, urgent }) {
  return (
    <div
      className={`min-w-[3.25rem] rounded-xl px-2 py-1.5 text-center ${
        urgent ? 'bg-red-50 ring-1 ring-red-200' : 'bg-ink-50 ring-1 ring-ink-200'
      }`}
    >
      <div className={`text-xl font-extrabold tabular-nums ${urgent ? 'text-red-600' : 'text-ink-900'}`}>{v}</div>
      <div className="text-[10px] text-ink-400">{l}</div>
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
