'use client';

import { useState, use, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArchitectRevisionRequest({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingBalance, setPendingBalance] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // On mount, verify payment status before allowing form
  useEffect(() => {
    async function checkPaymentStatus() {
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, invoice_number')
        .eq('project_id', id);

      const pending = (payments || []).find(
        (p: any) => p.status === 'pending' && p.invoice_number?.includes('M2')
      );
      setPendingBalance(pending || null);
      setCheckingPayment(false);
    }
    checkPaymentStatus();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (pendingBalance) return; // Extra guard

    setSubmitting(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session');

      // 1. Insert into revision_requests
      const { error: insertError } = await supabase
        .from('revision_requests')
        .insert({
          project_id: id,
          architect_id: user.id,
          description: description,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // 2. Update project status to indicate a revision is requested
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'Revision Requested'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setMessage('Revision request submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/architect/projects/${id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Error submitting revision request:', err);
      setMessage(`Failed: ${err.message || 'Unknown error'}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Title Header Section */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-100 gap-12">
        <div>
          <h1 className="text-xl font-medium text-neutral-900 tracking-tight">Request Design Revision</h1>
          <p className="text-sm text-neutral-450 mt-0.5">Submit modifications for fixtures, lux levels, or CAD layout drawings.</p>
        </div>
        <Link
          href={`/architect/projects/${id}`}
          className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded-md transition-all active:scale-[0.98] cursor-pointer"
        >
          Cancel
        </Link>
      </div>

      {/* Payment Gate — shown while checking or if balance is pending */}
      {checkingPayment && (
        <div className="flex items-center justify-center py-10 space-x-2 text-neutral-500">
          <svg className="animate-spin h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Verifying payment status...</span>
        </div>
      )}

      {!checkingPayment && pendingBalance && (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <i className="bx bx-lock-alt text-xl text-amber-600"></i>
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Payment Required</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Complete the balance payment to unlock revision requests</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <p className="text-xs text-amber-700 font-semibold">Outstanding Balance</p>
              <p className="text-2xl font-black text-neutral-900">
                ₹{Number(pendingBalance.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-neutral-500 font-medium">
                {pendingBalance.invoice_number || '50% Balance — Final Instalment'}
              </p>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Your design is complete! To protect our designers&apos; work, revision requests are only available after the final balance payment is cleared. Please go back to your project page and complete the payment.
            </p>

            <Link
              href={`/architect/projects/${id}`}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20"
            >
              <i className="bx bx-credit-card text-sm"></i>
              <span>Go Back & Complete Payment</span>
            </Link>
          </div>
        </div>
      )}

      {/* Info Notice Box + Form — only shown when payment is cleared */}
      {!checkingPayment && !pendingBalance && (
        <>
          <div className="bg-amber-50/20 border border-amber-200/50 rounded-md p-4 flex items-start space-x-3">
            <i className="bx bx-info-circle text-lg text-amber-600 mt-0.5 shrink-0"></i>
            <div className="text-sm text-neutral-600 leading-relaxed font-medium">
              <p className="font-bold text-neutral-900 mb-0.5">Design Revision Guidelines</p>
              <p>Please provide specific spatial and structural details. Include clear instructions for lux calculations, fixture placements, or CAD drawing revisions. Changes are processed within 24-48 business hours.</p>
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-md p-5 space-y-5">
            {message && (
              <div className={`p-3.5 rounded-md text-xs font-semibold border ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                <div className="flex items-center space-x-1.5">
                  <i className={`bx ${message.includes('successfully') ? 'bx-check-circle' : 'bx-error-circle'} text-sm`}></i>
                  <span>{message}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="description" className="block text-xs font-bold text-neutral-500">Revision Description Details</label>
              <textarea
                id="description"
                rows={7}
                required
                className="w-full text-sm font-medium text-neutral-805 bg-neutral-50/30 border border-neutral-200 rounded-md p-3.5 focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium leading-relaxed"
                placeholder="Please detail the modifications needed. (e.g., Move ceiling spot fixture nodes in the master bedroom, increase lux calculations output in the kitchen slab area...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs rounded-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting Revision Request...</span>
                </>
              ) : (
                <>
                  <i className="bx bx-send text-sm"></i>
                  <span>Submit Revision Request</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
