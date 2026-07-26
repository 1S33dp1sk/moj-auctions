'use client';
import { useEffect, useState } from 'react';
import { CarPlaceholder } from './CarThumb';

/**
 * Tabbed media viewer mirroring the source's detail tabs:
 *   الصور (photos) · الاعلان (announcement) · تقرير الخبرة (report)
 * Each tab shows a main image, a thumbnail strip, and a fullscreen lightbox.
 */
export default function Gallery({ auction }) {
  const tabs = [
    { key: 'photos', label: 'الصور', imgs: auction.photos || auction.images || [] },
    { key: 'announcement', label: 'الاعلان', imgs: auction.announcement || [] },
    { key: 'report', label: 'تقرير الخبرة', imgs: auction.report || [] },
  ].filter((t) => t.imgs.length > 0);

  const [tab, setTab] = useState(tabs[0]?.key || 'photos');
  const current = tabs.find((t) => t.key === tab) || tabs[0];

  // No media at all → branded placeholder.
  if (tabs.length === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-ink-200">
        <CarPlaceholder auction={auction} />
      </div>
    );
  }

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-3 inline-flex rounded-xl bg-white p-1 ring-1 ring-ink-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t.key ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {t.label}
              <span className={`ms-1.5 tabular-nums ${tab === t.key ? 'text-white/60' : 'text-ink-400'}`}>{t.imgs.length}</span>
            </button>
          ))}
        </div>
      )}
      <Viewer key={current.key} images={current.imgs} alt={auction.type} isReport={current.key === 'report'} />
    </div>
  );
}

function Viewer({ images, alt, isReport }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') setActive((i) => (i + 1) % images.length);
      if (e.key === 'ArrowRight') setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  return (
    <div>
      <button
        onClick={() => setLightbox(true)}
        className={`group relative block w-full overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-200 ${
          isReport ? 'aspect-[3/4] sm:aspect-[4/3]' : 'aspect-[4/3]'
        }`}
      >
        <img src={images[active]} alt={alt} className={`h-full w-full ${isReport ? 'object-contain bg-white' : 'object-cover'}`} />
        <span className="absolute bottom-2 left-2 rounded-lg bg-ink-900/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          تكبير ⤢
        </span>
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === active ? 'ring-gold-500' : 'ring-transparent hover:ring-ink-300'
              }`}
            >
              <img src={src} alt="" className={`h-full w-full ${isReport ? 'object-contain bg-white' : 'object-cover'}`} />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setLightbox(false)}>
          <img src={images[active]} alt={alt} className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightbox(false)} aria-label="إغلاق">✕</button>
          {images.length > 1 && (
            <>
              <NavBtn side="right" onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + images.length) % images.length); }} />
              <NavBtn side="left" onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % images.length); }} />
            </>
          )}
          <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white ltr-nums">{active + 1} / {images.length}</span>
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
