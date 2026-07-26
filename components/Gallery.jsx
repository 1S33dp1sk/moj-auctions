'use client';
import { useEffect, useState } from 'react';
import { CarPlaceholder } from './CarThumb';

export default function Gallery({ auction }) {
  const imgs = auction.hasImages ? auction.images : [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') setActive((i) => (i + 1) % imgs.length);
      if (e.key === 'ArrowRight') setActive((i) => (i - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, imgs.length]);

  if (imgs.length === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-ink-200">
        <CarPlaceholder auction={auction} />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-200"
      >
        <img src={imgs[active]} alt={auction.type} className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-lg bg-ink-900/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          تكبير الصورة ⤢
        </span>
      </button>

      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === active ? 'ring-gold-500' : 'ring-transparent hover:ring-ink-300'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <img src={imgs[active]} alt={auction.type} className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightbox(false)} aria-label="إغلاق">✕</button>
          {imgs.length > 1 && (
            <>
              <NavBtn side="right" onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + imgs.length) % imgs.length); }} />
              <NavBtn side="left" onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % imgs.length); }} />
            </>
          )}
          <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white ltr-nums">{active + 1} / {imgs.length}</span>
        </div>
      )}
    </div>
  );
}

function NavBtn({ side, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${side === 'right' ? 'right-4' : 'left-4'} grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20`}
      aria-label={side === 'right' ? 'السابق' : 'التالي'}
    >
      {side === 'right' ? '›' : '‹'}
    </button>
  );
}
