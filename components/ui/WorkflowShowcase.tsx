'use client';

import { useState } from 'react';

interface WorkflowStep {
  stepNum: string;
  title: string;
  badge: string;
  shortDesc: string;
  icon: string;
  roleTag: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNum: '01',
    badge: 'WORKSPACE SETUP',
    title: 'Provision Studio & Roles',
    shortDesc: 'Set up studio workspaces with role-gated permissions for Admins, Designers, Architects, and Clients.',
    icon: 'bx bx-user-check',
    roleTag: 'ADMIN & DESIGNER',
  },
  {
    stepNum: '02',
    badge: 'SPEC GENERATION',
    title: 'Auto-Build Fixture Schedules',
    shortDesc: 'Import CAD/Figma fixture tags to auto-reconcile CCT, Wattage, DALI drivers, and photometrics.',
    icon: 'bx bx-table',
    roleTag: 'LIGHTING DESIGNER',
  },
  {
    stepNum: '03',
    badge: 'AI & REVISIONS',
    title: 'AI Audit & Spec Revisions',
    shortDesc: 'Run real-time AI compliance audits for energy codes, cost savings, and architect revision loops.',
    icon: 'bx bx-bot',
    roleTag: 'AI COPILOT & ARCHITECT',
  },
  {
    stepNum: '04',
    badge: 'SIGN-OFF & BILLING',
    title: '1-Click Sign-Off & Invoicing',
    shortDesc: 'Send passwordless client review links for 1-click digital approvals and automated milestone billing.',
    icon: 'bx bx-check-double',
    roleTag: 'CLIENT & FINANCE',
  },
];

export default function WorkflowShowcase() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 1. Clean Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-900 text-xs font-semibold uppercase tracking-wider border border-amber-500/30 mb-4">
          <i className="bx bx-git-repo-fork text-amber-600" />
          HOW LIGHTMAP WORKS
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]">
          Set up your studio workflow in
          <span className="text-amber-500 block font-extrabold mt-1 sm:mt-2">
            4 Seamless Steps
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base lg:text-lg text-neutral-500 leading-relaxed font-sans max-w-2xl mx-auto">
          LightMap connects every stage of your studio — from importing CAD drawings to automated fixture scheduling, AI spec audits, and 1-click client sign-offs.
        </p>
      </div>

      {/* 2. Clean 4-Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {WORKFLOW_STEPS.map((s, idx) => {
          const isActive = idx === activeStepIndex;

          return (
            <div
              key={s.stepNum}
              onClick={() => setActiveStepIndex(idx)}
              className={`group p-6 sm:p-7 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[250px] sm:min-h-[260px] ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-white text-neutral-900 border border-neutral-200/90 hover:border-amber-400/50 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Step Header Badge & Icon */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                      isActive ? 'text-white' : 'text-neutral-300 group-hover:text-amber-600'
                    }`}
                  >
                    {s.stepNum}
                  </span>
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                      isActive
                        ? 'bg-white text-amber-600 shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-700'
                    }`}
                  >
                    <i className={s.icon} />
                  </div>
                </div>

                {/* Step Badge */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isActive ? 'text-amber-100' : 'text-amber-600'
                  }`}
                >
                  {s.badge}
                </span>

                {/* Step Title */}
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                  {s.title}
                </h3>

                {/* Short Description */}
                <p className={`text-xs sm:text-sm leading-relaxed font-sans ${isActive ? 'text-amber-50/95' : 'text-neutral-500'}`}>
                  {s.shortDesc}
                </p>
              </div>

              {/* Bottom Role Tag */}
              <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                <span className={isActive ? 'text-amber-100' : 'text-neutral-400'}>{s.roleTag}</span>
                <span className={isActive ? 'text-white font-bold' : 'text-neutral-400 group-hover:text-amber-600'}>
                  {isActive ? '● Step Active' : 'Step ' + s.stepNum}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
