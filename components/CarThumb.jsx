'use client';
import { useState } from 'react';

/**
 * Shows the first real photo when the scraper has populated images; otherwise a
 * polished branded placeholder (so the demo looks intentional, not broken).
 */
export default function CarThumb({ auction, className = '', priority = false }) {
  const [failed, setFailed] = useState(false);
  const src = auction.hasImages && !failed ? auction.images[0] : null;

  if (src) {
    return (
      <img
        src={src}
        alt={auction.type || 'مركبة'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return <CarPlaceholder auction={auction} className={className} />;
}

export function CarPlaceholder({ auction, className = '' }) {
  return (
    <div className={`relative h-full w-full placeholder-grid grid place-items-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900/[0.03] to-gold-500/[0.06]" />
      <div className="relative flex flex-col items-center gap-2 text-center px-4">
        <CarIcon className="h-16 w-16 text-ink-300" />
        <span className="text-sm font-bold text-ink-500">{auction.brand || auction.type}</span>
        {auction.plate && (
          <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-semibold text-ink-600 ring-1 ring-ink-200 ltr-nums">
            {auction.plate}
          </span>
        )}
      </div>
      <span className="absolute bottom-2 left-2 rounded-full bg-ink-900/70 px-2 py-0.5 text-[10px] text-white/90">
        بانتظار الصور
      </span>
    </div>
  );
}

function CarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 13l1.5-4.5A3 3 0 017.35 6.5h9.3a3 3 0 012.85 2L21 13m-18 0v4a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-4m-18 0h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="13.5" r="1.25" fill="currentColor" />
      <circle cx="16.5" cy="13.5" r="1.25" fill="currentColor" />
    </svg>
  );
}
