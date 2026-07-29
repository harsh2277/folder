'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PricingPlan {
  name: string;
  badgeIcon: string;
  desc: string;
  monthlyPrice: string;
  yearlyPrice: string;
  unit: string;
  features: { text: string; isBold?: boolean }[];
  highlighted: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Basic Plan',
    badgeIcon: 'bx bx-bolt',
    desc: 'Perfect for small teams and startups.',
    monthlyPrice: '$10',
    yearlyPrice: '$8',
    unit: 'Per User',
    features: [
      { text: 'Task Management', isBold: true },
      { text: 'AI Summary' },
      { text: 'Progress Tracking' },
      { text: 'Smart Labels' },
    ],
    highlighted: false,
  },
  {
    name: 'Pro Plan',
    badgeIcon: 'bx bx-flag',
    desc: 'Ideal for growing teams and projects.',
    monthlyPrice: '$25',
    yearlyPrice: '$20',
    unit: '20 Users',
    features: [
      { text: 'Everything in Basic Plan +', isBold: true },
      { text: 'Team Collaboration' },
      { text: 'Bulk Actions' },
      { text: '2-way Translation' },
      { text: 'Advanced Reporting' },
      { text: 'Customizable Dashboards' },
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise Plan',
    badgeIcon: 'bx bx-star',
    desc: 'Built for large organizations needs.',
    monthlyPrice: '$39',
    yearlyPrice: '$31',
    unit: '50 Users',
    features: [
      { text: 'Everything in Pro Plan +', isBold: true },
      { text: 'SAML SSO' },
      { text: 'Dedicated Account Manager' },
      { text: 'Enterprise Integrations' },
      { text: 'Data Analytics' },
      { text: 'Security Enhancements' },
      { text: 'Priority Support' },
    ],
    highlighted: false,
  },
];

export default function PricingShowcase() {
  const [isYearly, setIsYearly] = useState<boolean>(false);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full mb-4">
            <i className="bx bx-dollar-circle text-amber-600" />
            Pricing &amp; Plans
          </span>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-900 leading-[1.15]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Affordable Pricing Plans
          </h2>

          <p className="mt-3 text-sm sm:text-base font-medium text-neutral-500 max-w-xl leading-relaxed">
            Flexible, transparent pricing to support your studio’s productivity and growth at every stage.
          </p>
        </div>
      </div>

      {/* 2. 3 Pricing Cards matching Current Brand Colors (Warm Amber & Dark Neutrals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl flex flex-col justify-between transition-all duration-300 ${plan.highlighted
                  ? 'bg-amber-500 border-2 border-amber-500 shadow-2xl scale-[1.02] z-10'
                  : 'bg-white border border-neutral-200/90 shadow-sm hover:shadow-md'
                }`}
            >
              {/* Recommendation Header Banner — Seamless Top Bar with NO White Gap */}
              {plan.highlighted && (
                <div className="w-full py-3 text-center text-xs font-bold text-white uppercase tracking-wider bg-amber-500 flex items-center justify-center gap-1.5 border-b border-amber-400/40">
                  <span>Our Recommendation</span>
                  <i className="bx bxs-star text-white text-xs" />
                </div>
              )}

              <div className={`p-7 sm:p-8 flex flex-col justify-between flex-1 space-y-6 ${plan.highlighted ? 'bg-white rounded-b-[14px]' : ''}`}>
                {/* Header Icon, Title & Price */}
                <div className="space-y-5">

                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500 leading-snug">{plan.desc}</p>
                  </div>

                  {/* Price & User Pill */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight">
                      {price}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium text-white bg-neutral-900 rounded-full flex items-center gap-1 shrink-0">
                      <i className="bx bx-user text-[10px]" /> {plan.unit}
                    </span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-neutral-100" />

                {/* Feature List */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-600">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${plan.highlighted
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-neutral-900/10 text-neutral-900'
                          }`}
                      >
                        <i className="bx bx-check" />
                      </div>
                      <span className={f.isBold ? 'font-semibold text-neutral-900' : 'text-neutral-600'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="pt-4 space-y-2.5">
                  <Link
                    href="/signup"
                    className={`w-full py-3.5 text-center text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${plan.highlighted
                        ? 'text-white bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 border-t border-white/20 shadow-lg font-bold'
                        : 'bg-[#F0EEEF] hover:bg-[#E5E2E3] text-[#111111]'
                      }`}
                  >
                    <span>Get Started</span>
                    <i className="bx bx-chevron-right text-base" />
                  </Link>

                  <p className="text-center text-xs text-neutral-400">
                    Renews automatically. Cancel anytime.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
