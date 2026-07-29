'use client';

import { useState } from 'react';

interface SystemFeature {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const SYSTEM_FEATURES: SystemFeature[] = [
  {
    id: 'schedules',
    title: 'Fixture Schedules',
    desc: 'Auto-reconcile CCT, Wattage, DALI drivers, beam angles, and manufacturer codes across all room zones.',
    icon: 'bx bx-table',
  },
  {
    id: 'ai-assistant',
    title: 'AI Studio Assistant',
    desc: 'Smart luminaire substitution recommendations, energy code compliance checks, and cost optimization.',
    icon: 'bx bx-bot',
  },
  {
    id: 'approvals',
    title: '1-Click Approvals',
    desc: 'Share live passwordless fixture review links with clients and architects for instant digital sign-off.',
    icon: 'bx bx-check-shield',
  },
  {
    id: 'financials',
    title: 'Studio Invoicing',
    desc: 'Track project margins, automate milestone billing, and manage studio cash flow with bank reconciliation.',
    icon: 'bx bx-wallet',
  },
  {
    id: 'cad-sync',
    title: 'CAD & Revit Sync',
    desc: 'Import fixture tags directly from DWG, BIM, and Figma files into structured BOQ line items.',
    icon: 'bx bx-layer',
  },
  {
    id: 'roles',
    title: 'Role Access Control',
    desc: 'Dedicated workspaces and permission controls tailored for Admins, Designers, Architects, and Clients.',
    icon: 'bx bx-user-check',
  },
  {
    id: 'revisions',
    title: 'Revision Tracking',
    desc: 'Complete audit logs for spec modifications, luminaire version changes, and sign-off timestamps.',
    icon: 'bx bx-revision',
  },
  {
    id: 'exports',
    title: 'PDF Spec Sheet',
    desc: 'Export beautifully styled, brand-customized PDF luminaire schedules for contractors and clients.',
    icon: 'bx bx-export',
  },
];

export default function StudioPlatformShowcase() {
  const [activeFeatureId, setActiveFeatureId] = useState<string>('schedules');

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]">
          The must-have platform for running your
          <span className="text-amber-500 block font-extrabold mt-1 sm:mt-2">
            Lighting Design Studio
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base lg:text-lg text-neutral-500 leading-relaxed font-sans max-w-2xl mx-auto">
          LightMap provides complete fixture scheduling, AI recommendations, CAD sync, and client approvals — all in one unified studio system.
        </p>
      </div>

      {/* 2. Clean 4x2 Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {SYSTEM_FEATURES.map((feature) => {
          const isActive = feature.id === activeFeatureId;

          return (
            <div
              key={feature.id}
              onClick={() => setActiveFeatureId(feature.id)}
              className={`group p-6 sm:p-7 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] sm:min-h-[230px] ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-white text-neutral-900 border border-neutral-200/90 hover:border-amber-400/50 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Top Circular Icon Badge */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl mb-4 sm:mb-5 transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-700'
                  }`}
                >
                  <i className={feature.icon} />
                </div>

                {/* Card Title */}
                <h3
                  className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${
                    isActive ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {feature.title}
                </h3>

                {/* Card Description */}
                <p
                  className={`text-xs sm:text-sm leading-relaxed font-sans ${
                    isActive ? 'text-amber-50/95' : 'text-neutral-500'
                  }`}
                >
                  {feature.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
