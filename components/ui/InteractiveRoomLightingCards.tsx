'use client';

import Link from 'next/link';

interface CardData {
  id: string;
  badge: string;
  title: string;
  imageSrc: string;
  href: string;
}

const CARDS: CardData[] = [
  {
    id: 'concept',
    badge: 'Basic Plan',
    title: 'Bring Every Fixture Plan to Life',
    imageSrc: '/images/room_concept.jpg',
    href: '#pricing',
  },
  {
    id: 'reviews',
    badge: 'Pro Plan',
    title: 'One Link for Sign-Off, No Chaos',
    imageSrc: '/images/room_review.jpg',
    href: '#pricing',
  },
  {
    id: 'invoicing',
    badge: 'Enterprise Plan',
    title: 'Get Paid the Moment You Deliver',
    imageSrc: '/images/room_invoicing.jpg',
    href: '#pricing',
  },
];

export default function InteractiveRoomLightingCards() {
  return (
    <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {CARDS.map((card) => {
        return (
          <div
            key={card.id}
            className="group relative overflow-hidden rounded-2xl h-[420px] sm:h-[450px] shadow-xl flex flex-col items-center justify-between p-8 border border-white/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
          >
            {/* Room Background Image with Subtle Lighting Effect */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={card.imageSrc}
                alt={card.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Overlay for Vignette & Contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75" />

              {/* Room Lighting Warm Ambient Glow */}
              <div
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl transition-opacity duration-700 opacity-60 group-hover:opacity-90"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.35)' }}
              />
            </div>

            {/* Top Center: Badge Pill & Heading Title */}
            <div className="relative z-10 w-full flex flex-col items-center text-center gap-4 pt-1 px-2">
              <span className="px-4 py-1.5 text-sm font-medium text-white border border-white/80 rounded-full backdrop-blur-md bg-black/20 shadow-sm">
                {card.badge}
              </span>

              <h3
                className="text-2xl sm:text-3xl leading-[1.25] text-white font-serif drop-shadow-lg tracking-tight max-w-[280px]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {card.title}
              </h3>
            </div>

            {/* Bottom Center: View Details Pill Action Button */}
            <div className="relative z-10 w-full flex justify-center pt-2">
              <Link
                href={card.href}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-900 bg-white rounded-full shadow-lg transition-all duration-300 hover:bg-neutral-100 hover:shadow-xl group-hover:scale-[1.03]"
              >
                <span>View Details</span>
                <i className="bx bx-right-arrow-alt text-lg transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
