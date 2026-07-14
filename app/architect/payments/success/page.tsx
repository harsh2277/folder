'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || '';
  const transactionId = searchParams.get('transaction_id') || 'N/A';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    async function loadPaymentDetails() {
      try {
        const { data: proj } = await supabase
          .from('projects')
          .select('*, pricing_plans(name)')
          .eq('id', projectId)
          .single();

        if (proj) {
          setProject(proj);
        }

        const { data: pay } = await supabase
          .from('payments')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (pay) {
          setPayment(pay);
        }
      } catch (err) {
        console.error('Error loading payment details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPaymentDetails();
  }, [projectId, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50/30">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-neutral-500">Retrieving invoice details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-neutral-50/50 min-h-[85vh]">
      <div className="bg-white border border-neutral-200/80 rounded-2xl max-w-lg w-full shadow-lg overflow-hidden p-8 space-y-8 animate-fade-in text-center">
        {/* Animated Checkmark SVG Illustration */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-50 border border-emerald-100 animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full bg-emerald-100/60 border border-emerald-200/60 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900">Payment Successful!</h2>
          <p className="text-sm text-neutral-500">Your lighting design project has been officially submitted and paid.</p>
        </div>

        {/* Invoice Card info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-left space-y-4">
          <h4 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-200 pb-2">TRANSACTION DETAILS</h4>
          
          <div className="grid grid-cols-2 gap-y-3 text-xs">
            <span className="text-neutral-500 font-medium">Project Name</span>
            <span className="text-neutral-850 font-semibold text-right truncate">{project?.project_name || 'N/A'}</span>

            <span className="text-neutral-500 font-medium">Client Reference</span>
            <span className="text-neutral-850 font-semibold text-right truncate">{project?.client_name || 'N/A'}</span>

            <span className="text-neutral-500 font-medium">Plan Tier</span>
            <span className="text-neutral-850 font-semibold text-right">{project?.pricing_plans?.name || 'Amplex Custom'}</span>

            <span className="text-neutral-500 font-medium">Invoice Number</span>
            <span className="text-neutral-850 font-mono font-medium text-right">{payment?.invoice_number || 'N/A'}</span>

            <span className="text-neutral-500 font-medium">Transaction ID</span>
            <span className="text-neutral-850 font-mono font-medium text-right truncate">{transactionId}</span>

            <span className="text-neutral-500 font-medium">Amount Paid</span>
            <span className="text-base font-bold text-emerald-650 text-right">₹{Number(payment?.amount || project?.calculated_price || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={projectId ? `/architect/projects/${projectId}` : '/architect/projects'}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-sm rounded-xl text-center shadow-md transition-all active:scale-[0.99]"
          >
            Go to Workspace
          </Link>
          <Link
            href="/architect/projects"
            className="flex-1 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-sm rounded-xl text-center transition-all"
          >
            All Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
