'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import LayoutToggle from '@/components/ui/LayoutToggle';
import Portal from '@/components/ui/Portal';
import StatsCard from '@/components/ui/StatsCard';
import SearchInput from '@/components/ui/SearchInput';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminPaymentsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        // Query payments along with matching project details
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            payment_method,
            transaction_id,
            invoice_number,
            receipt_number,
            created_at,
            project_id,
            projects (
              project_id_serial,
              project_name,
              client_name,
              area_sq_ft,
              pricing_plans (
                name,
                base_price_per_sq_ft
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Error fetching payments:', err);
        // Fallback mock transactions
        setPayments([
          {
            id: '1',
            invoice_number: 'INV-2026-9041',
            amount: 85000,
            status: 'completed',
            created_at: new Date().toISOString(),
            projects: {
              project_id_serial: 'KL-2026-0001',
              project_name: 'Lotus Penthouse',
              client_name: 'Vikram Shah',
              area_sq_ft: 2500,
              pricing_plans: { name: 'Premium Design Plan', base_price_per_sq_ft: 34 }
            }
          },
          {
            id: '2',
            invoice_number: 'INV-2026-4412',
            amount: 437500,
            status: 'pending',
            created_at: new Date().toISOString(),
            projects: {
              project_id_serial: 'KL-2026-0002',
              project_name: 'Vertex IT Hub',
              client_name: 'Vertex Corp',
              area_sq_ft: 12500,
              pricing_plans: { name: 'Premium Design Plan', base_price_per_sq_ft: 35 }
            }
          }
        ]);
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

  return (
    <div className="space-y-4">
      {/* Print media overrides stylesheet */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }

          /* Force colors and backgrounds to render */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide main app layout, sidebar, header, nav, and dashboard components */
          body > div:not(.print-modal-backdrop),
          aside, header, nav, main, .print-hide, .print-hidden {
            display: none !important;
          }
          
          /* Reset root page containers on printing */
          body, html {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }

          /* Force modal overlay backdrops to remain transparent & static during print */
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

          /* Force modal card container to span full width cleanly */
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

          /* Force 2 columns on the details panel during print */
          .print-invoice-details-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 24px !important;
          }

          .print-invoice-details-grid table {
            background-color: transparent !important;
            background: transparent !important;
          }

          /* Printable Invoice Area Page Styling */
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

          /* Distinct gap spacing between printed invoice sections */
          .print-invoice-area > * {
            margin-top: 52px !important;
          }
          .print-invoice-area > *:first-child {
            margin-top: 0 !important;
          }
        }
      `}</style>

      {/* Title block */}
      <div className="flex justify-between items-center print-hide">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 font-sans">Invoice Ledger</h2>
          <p className="text-sm text-neutral-400 mt-0.5 font-medium">Audit onboarding invoices, track billing milestones, and view pending workspace invoices.</p>
        </div>
      </div>

      {/* Billing KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hide">
        <StatsCard
          title="Total Invoiced"
          value={`₹${(totalInvoiced / 100000).toFixed(2)}L`}
          subtext="Sum of all billing events"
          icon="bx-receipt"
          iconBgClass="bg-blue-50 border-blue-100"
          iconColorClass="text-blue-600"
        />
        <StatsCard
          title="Settled Volume"
          value={`₹${(completedPayments / 100000).toFixed(2)}L`}
          subtext="Successfully completed settlements"
          icon="bx-badge-check"
          iconBgClass="bg-emerald-50 border-emerald-100"
          iconColorClass="text-emerald-600"
        />
        <StatsCard
          title="Outstanding Bills"
          value={`₹${(pendingPayments / 100000).toFixed(2)}L`}
          subtext="Invoices waiting for client action"
          icon="bx-time-five"
          iconBgClass="bg-amber-50 border-amber-100"
          iconColorClass="text-amber-600"
        />
      </div>

      {/* Transaction Logs Container - matching project view style */}
      <div className="space-y-4 print-hide">

        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search invoices, projects, representatives..."
          />

          {/* View Layout Toggle */}
          <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        {/* List/Table Render Area */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {payments
              .filter(pay => {
                const matchesSearch = (pay.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesSearch;
              })
              .map((pay) => (
                <div
                  key={pay.id}
                  className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover: transition-all duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-neutral-400">
                        {pay.invoice_number}
                      </span>
                      <StatusBadge status={pay.status} type="payment" />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">{pay.projects?.project_name || 'Individual Project'}</h3>
                    <p className="text-sm text-neutral-450 font-medium">Representative: {pay.projects?.client_name || 'Unassigned'}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-neutral-400 font-medium">Invoiced Amount</span>
                      <span className="text-lg font-medium text-neutral-800 font-sans">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-neutral-400 font-sans font-medium">
                        {new Date(pay.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(pay)}
                        className="inline-flex items-center p-2 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer text-sm"
                        title="View Detailed Invoice"
                      >
                        <i className="bx bx-receipt text-sm mr-1"></i>
                        <span className="text-sm font-medium font-sans">Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="overflow-x-auto mt-3 border border-neutral-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0 bg-white">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-normal text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Invoice ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Scope</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Amount</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Settlement</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700 font-normal">
                {payments
                  .filter(pay => {
                    const matchesSearch = (pay.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
                    return matchesSearch;
                  })
                  .map((pay) => (
                    <tr key={pay.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-sm text-neutral-900">
                        {pay.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-900">
                        {pay.projects?.project_name || 'Individual Project'}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500">
                        {pay.projects?.client_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-sans text-neutral-900">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <StatusBadge status={pay.status} type="payment" />
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(pay)}
                          className="inline-flex items-center px-3 py-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer text-sm font-medium"
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
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print-modal-backdrop">
            <div className="bg-white border border-neutral-200 rounded-md max-w-2xl w-full overflow-hidden print-invoice-card">
              {/* Modal Actions Bar (hidden during print) */}
              <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex justify-between items-center print:hidden">
                <span className="text-base font-medium text-neutral-650">Invoice Statement</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-base rounded transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <i className="bx bx-printer text-base"></i>
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium text-base rounded transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice Page */}
              <div className="p-8 space-y-6 print:p-0 print:space-y-8 print-invoice-area bg-white text-neutral-800 font-sans">

                {/* Header Section */}
                <div className="flex justify-between items-center pb-6 print:pb-8 border-b border-neutral-200">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Invoice</h1>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 text-base tracking-wider block">LightMap</span>
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
                    <p>Account Name: LightMap Design Studio</p>
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
