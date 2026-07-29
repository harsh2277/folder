'use client';

import { useState } from 'react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'LightMap completely eliminated back-and-forth emails for fixture sign-offs. Our clients review specs and approve with a single click.',
    name: 'Ananya Rao',
    role: 'Principal Architect • Studio Aura',
    initials: 'AR',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    quote: 'Auto-reconciling CCT, Wattage, and DALI driver specs across 40+ room zones saved us 15+ hours per project. Indispensable tool.',
    name: 'Devraj Mehta',
    role: 'Senior Lighting Designer • Lumen Co.',
    initials: 'DM',
    gradient: 'from-neutral-700 to-neutral-900',
  },
  {
    quote: 'We track fixture procurement costs and link them directly to milestone invoices. Studio cash flow improved by 34% in 60 days.',
    name: 'Priya Nair',
    role: 'Studio Director • Nair & Co.',
    initials: 'PN',
    gradient: 'from-amber-600 to-rose-600',
  },
];

export default function TestimonialsShowcase() {
  const [activeDot, setActiveDot] = useState<number>(0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 1. Clean Trustpilot Header */}
      <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-900"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Nothing less than excellent
        </h2>

        <div className="mt-4 flex items-center justify-center gap-2.5">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="w-6 h-6 bg-[#00b67a] flex items-center justify-center rounded-xs shadow-2xs">
                <i className="bx bxs-star text-white text-sm" />
              </span>
            ))}
          </div>
          <span className="text-base font-bold text-neutral-900 ml-1">Trustpilot</span>
        </div>

        <p className="mt-2 text-xs sm:text-sm font-medium text-neutral-500">
          Reviews 4,317 • <span className="font-bold text-neutral-800">Excellent</span>
        </p>
      </div>

      {/* 2. Clean 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={t.name}
            className="p-7 sm:p-8 bg-white border border-neutral-200/90 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div>
              {/* Trustpilot Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="w-5 h-5 bg-[#00b67a] flex items-center justify-center rounded-xs">
                    <i className="bx bxs-star text-white text-xs" />
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans font-medium">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Author */}
            <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs`}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 leading-tight">{t.name}</p>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Clean Dots & Arrow Navigation */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          onClick={() => setActiveDot((prev) => (prev - 1 + 3) % 3)}
          type="button"
          aria-label="Previous testimonials"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-900 hover:text-white transition-colors shadow-2xs"
        >
          <i className="bx bx-left-arrow-alt text-lg" />
        </button>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveDot(i)}
              className={`rounded-full transition-all ${
                i === activeDot ? 'w-6 h-2 bg-neutral-900' : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveDot((prev) => (prev + 1) % 3)}
          type="button"
          aria-label="Next testimonials"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-900 hover:text-white transition-colors shadow-2xs"
        >
          <i className="bx bx-right-arrow-alt text-lg" />
        </button>
      </div>
    </div>
  );
}
