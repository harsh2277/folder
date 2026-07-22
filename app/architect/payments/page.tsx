'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import LayoutToggle from '../../../components/ui/LayoutToggle';
import Portal from '@/components/ui/Portal';

export default function ArchitectPaymentsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchPayments() {
      try {
        const res = await fetch('/api/payments');
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Calculate audit totals
  const totalInvoiced = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = (pay.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 relative font-sans">
      {/* Print media overrides stylesheet */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body > div:not(.print-modal-backdrop),
          aside, header, nav, main, .print-hide, .print-hidden {
            display: none !important;
          }
          body, html {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }
          .print-modal-backdrop {
            position: static !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: auto !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-invoice-card {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          .print-invoice-area {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .print-invoice-area > * {
            margin-top: 52px !important;
          }
          .print-invoice-area > *:first-child {
            margin-top: 0 !important;
          }
          .print-invoice-details-grid {
            background: transparent !important;
            border: 1px solid #e5e5e5 !important;
            padding: 16px !important;
          }
        }
      `}</style>

      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 print-hide">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Financial Overview</h2>
          <p className="text-sm text-neutral-450 mt-0.5">Track design package invoices, complete billing settlements, and review invoice details.</p>
        </div>
      </div>

      {/* Key Audit Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print-hide">
        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between hover: hover:border-amber-500/35 transition-all duration-300">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-450 block">Total Invoiced</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">₹{(totalInvoiced / 100000).toFixed(2)}L</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Sum of all billing events</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-600 border border-neutral-200 shrink-0">
            <i className="bx bx-receipt text-lg xl:text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between hover: hover:border-amber-500/35 transition-all duration-300">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-455 block">Settled</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">₹{(completedPayments / 100000).toFixed(2)}L</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Successfully completed settlements</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <i className="bx bx-badge-check text-lg xl:text-xl"></i>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between hover: hover:border-amber-500/35 transition-all duration-300">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-455 block">Outstanding</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">₹{(pendingPayments / 100000).toFixed(2)}L</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Invoices waiting for client action</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-time-five text-lg xl:text-xl"></i>
          </div>
        </div>
      </div>

      {/* Transaction Logs Container */}
      <div className="space-y-4 print-hide">
        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="relative flex-1 max-w-xs">
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search invoices, projects, representatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
            />
          </div>

          {/* View Layout Toggle */}
          <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        {/* List/Table Render Area */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayments.map((pay) => (
              <div
                key={pay.id}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-6 bg-white flex flex-col justify-between space-y-4 hover: transition-all duration-300 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-neutral-400">
                      {pay.invoice_number}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-medium border ${pay.status === 'completed' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : pay.status === 'failed' ? 'bg-rose-50 border-rose-100/50 text-rose-700' : 'bg-amber-50 border-amber-100/50 text-amber-700'}`}>
                      {pay.status === 'completed' ? 'Paid' : pay.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {pay.projects?.project_name || 'Individual Project'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">Client: {pay.projects?.client_name || 'Unassigned'}</p>
                </div>

                <div className="pt-4 border-t border-neutral-100 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-neutral-500">Invoiced Amount</span>
                    <span className="text-base font-medium text-neutral-800">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-neutral-450 font-medium">
                      {new Date(pay.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedInvoice(pay)}
                      className="inline-flex items-center px-3 py-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-all cursor-pointer text-xs font-medium active:scale-[0.98]"
                      title="View Detailed Invoice"
                    >
                      <i className="bx bx-receipt text-sm mr-1"></i>
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0 bg-white">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Invoice ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Scope</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Amount</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Settlement</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-sm text-neutral-900 font-medium">
                      {pay.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-900 font-medium">
                      {pay.projects?.project_name || 'Individual Project'}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 text-sm font-medium">
                      {pay.projects?.client_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-550 text-sm">
                      ₹{Number(pay.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${pay.status === 'completed' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : pay.status === 'failed' ? 'bg-rose-50 border-rose-100/50 text-rose-700' : 'bg-amber-50 border-amber-100/50 text-amber-700'}`}>
                        {pay.status === 'completed' ? 'paid' : pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <button
                        onClick={() => setSelectedInvoice(pay)}
                        className="inline-flex items-center px-3 py-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-all cursor-pointer text-xs font-medium active:scale-[0.98]"
                        title="View Detailed Invoice"
                      >
                        <i className="bx bx-receipt text-sm mr-1.5"></i>
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal (Printable) */}
      {selectedInvoice && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print-modal-backdrop">
            <div className="bg-white border border-neutral-200 rounded-md max-w-2xl w-full overflow-hidden print-invoice-card relative">
              {/* Modal Actions Bar */}
              <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex justify-between items-center print:hidden">
                <span className="text-xs font-medium text-neutral-600">Invoice Statement</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-[0.98]"
                  >
                    <i className="bx bx-printer text-sm"></i>
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium text-xs rounded-md transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice Page */}
              <div className="p-8 space-y-6 print:p-0 print:space-y-8 print-invoice-area bg-white text-neutral-800 font-sans max-h-[85vh] print:max-h-none overflow-y-auto print:overflow-visible">

                {/* Header Section */}
                <div className="flex justify-between items-center pb-6 print:pb-8 border-b border-neutral-200">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Invoice</h1>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 text-base tracking-wider block">Lightlab</span>
                    <span className="text-xs text-neutral-500 font-medium block">Design Studio</span>
                  </div>
                </div>

                {/* Bill To & Invoice Info */}
                <div className="flex justify-between items-start gap-8 pt-4 print:pt-8">
                  {/* Issued To */}
                  <div className="space-y-1 text-xs text-neutral-600 font-medium">
                    <span className="text-xs font-bold text-neutral-400 block tracking-wide">Issued To:</span>
                    <p className="font-bold text-neutral-800 text-sm">{selectedInvoice.projects?.client_name || 'Client Name'}</p>
                    <p>{selectedInvoice.projects?.project_name || 'Project Name'}</p>
                    <p>{selectedInvoice.projects?.site_location || 'Site Location'}</p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-neutral-600 font-medium text-right">
                    <div>
                      <span className="text-xs font-bold text-neutral-400 tracking-wide inline-block mr-2">Invoice No:</span>
                      <span className="font-bold text-neutral-800">{selectedInvoice.invoice_number}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-400 tracking-wide inline-block mr-2">Date:</span>
                      <span className="font-bold text-neutral-800">
                        {new Date(selectedInvoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-400 tracking-wide inline-block mr-2">Due Date:</span>
                      <span className="font-bold text-neutral-800">
                        {new Date(new Date(selectedInvoice.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-400 tracking-wide inline-block mr-2">Status:</span>
                      <span className={`font-bold capitalize ${selectedInvoice.status === 'completed'
                        ? 'text-emerald-600'
                        : selectedInvoice.status === 'failed'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                        }`}>
                        {selectedInvoice.status === 'completed' ? 'Paid' : selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="pt-6 print:pt-10">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-300 text-neutral-400 font-bold tracking-wide">
                        <th className="py-2.5 w-1/2">Description</th>
                        <th className="py-2.5 text-right">Rate</th>
                        <th className="py-2.5 text-right">Qty</th>
                        <th className="py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                      <tr>
                        <td className="py-3">
                          <p className="font-bold text-neutral-900 text-xs sm:text-sm">{selectedInvoice.projects?.pricing_plans?.name || 'Onboarding Package Fee'}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Professional custom lighting layouts & Lux simulation configurations.</p>
                        </td>
                        <td className="py-3 text-right text-neutral-600 whitespace-nowrap">
                          ₹{Number(selectedInvoice.projects?.pricing_plans?.base_price_per_sq_ft || 0).toFixed(2)}/sq ft
                        </td>
                        <td className="py-3 text-right text-neutral-600 whitespace-nowrap">
                          {Number(selectedInvoice.projects?.area_sq_ft || 0).toLocaleString()} sq ft
                        </td>
                        <td className="py-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                          ₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Tax, Total */}
                <div className="flex justify-end pt-6 print:pt-10 border-t border-neutral-200">
                  <div className="w-64 text-xs font-semibold text-neutral-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Subtotal</span>
                      <span className="text-neutral-800">₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Sales Tax (0%)</span>
                      <span className="text-neutral-800">₹0.00</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-neutral-200 pt-2.5">
                      <span className="text-xs font-bold text-neutral-900">Total</span>
                      <span className="text-base font-bold text-neutral-900">₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Section */}
                <div className="pt-8 print:pt-12 border-t border-neutral-200">
                  {/* Payment Info */}
                  <div className="space-y-1 text-xs text-neutral-600 font-medium">
                    <span className="text-xs font-bold text-neutral-400 block tracking-wide">Payment Info:</span>
                    <p>Bank: HDFC Bank</p>
                    <p>Account Name: Lightlab Design Studio</p>
                    <p>Account No.: 5020 0012 3456 78</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
