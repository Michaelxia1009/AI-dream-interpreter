'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Carousel({ urls }: { urls: string[] }) {
  // Show 2 images per page
  const pageCount = Math.ceil(urls.length / 2);
  const [page, setPage] = useState(0);
  const prev = () => setPage(v => Math.max(0, v - 1));
  const next = () => setPage(v => Math.min(pageCount - 1, v + 1));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black">
      {/* Slides — each "page" shows 2 images side-by-side */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${page * 100}%)` }}
      >
        {Array.from({ length: pageCount }).map((_, pg) => {
          const left = urls[pg * 2];
          const right = urls[pg * 2 + 1];
          return (
            <div key={pg} className="flex h-full w-full flex-shrink-0 gap-1 p-1">
              <div className="h-full flex-1 overflow-hidden rounded-xl bg-zinc-900">
                <img src={left} alt={`Scene ${pg * 2 + 1}`} className="h-full w-full object-cover" />
              </div>
              {right ? (
                <div className="h-full flex-1 overflow-hidden rounded-xl bg-zinc-900">
                  <img src={right} alt={`Scene ${pg * 2 + 2}`} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Left arrow */}
      {page > 0 && (
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Right arrow */}
      {page < pageCount - 1 && (
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Page dots */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {Array.from({ length: pageCount }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx)}
            aria-label={`Page ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === page ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/80 backdrop-blur">
        {page * 2 + 1}–{Math.min(page * 2 + 2, urls.length)} / {urls.length}
      </div>
    </div>
  );
}
