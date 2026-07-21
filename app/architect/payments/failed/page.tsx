'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || '';
  const amount = searchParams.get('amount') || '5,899';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    async function loadProjectDetails() {
      try {
        const { data: proj } = await supabase
          .from('projects')
          .select('*, pricing_plans(name)')
          .eq('id', projectId)
          .single();

        if (proj) {
          setProject(proj);
        }
      } catch (err) {
        console.error('Error loading project details for failure:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjectDetails();
  }, [projectId, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50/30">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-neutral-500">Retrieving details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-neutral-50/50 min-h-[85vh]">
      <div className="bg-white border border-neutral-200/80 rounded-2xl max-w-lg w-full shadow-lg overflow-hidden p-8 space-y-8 animate-fade-in text-center">
        {/* Animated Error/Failure SVG Illustration */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-50 border border-red-100 animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full bg-red-100/60 border border-red-200/60 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900">Payment Failed</h2>
          <p className="text-sm text-neutral-500">The transaction was cancelled or failed to process. No amount was debited.</p>
        </div>

        {/* Draft Safe Helper Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-left space-y-3.5">
          <div className="flex items-start space-x-2 text-xs font-semibold text-neutral-800 uppercase tracking-wider border-b border-neutral-200 pb-2">
            <i className="bx bx-info-circle text-base text-amber-550 shrink-0"></i>
            <span>DRAFT IS SAFE</span>
          </div>
          <p className="text-xs text-neutral-550 leading-relaxed font-medium">
            Don't worry, your project <strong>{project?.project_name || 'draft'}</strong> has been created successfully. You can retry the payment anytime from the project details panel.
          </p>
          
          <div className="grid grid-cols-2 gap-y-2.5 pt-2 text-xs border-t border-neutral-200/60">
            <span className="text-neutral-500 font-medium">Plan Selected</span>
            <span className="text-neutral-850 font-semibold text-right">{project?.pricing_plans?.name || 'Amplex Plan'}</span>

            <span className="text-neutral-500 font-medium">Invoice Amount</span>
            <span className="text-base font-bold text-neutral-900 text-right">₹{Number(amount.replace(/,/g, '')).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={projectId ? `/architect/projects/${projectId}` : '/architect/projects'}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl text-center shadow-md transition-all active:scale-[0.99]"
          >
            Retry Payment
          </Link>
          <Link
            href="/architect/projects"
            className="flex-1 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-sm rounded-xl text-center transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
