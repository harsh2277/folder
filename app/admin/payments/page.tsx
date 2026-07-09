'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

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
  }, [supabase]);

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
          /* Force colors and backgrounds to render */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide sidebar, top header, and dashboard components */
          aside, header, .print-hide, .print-hidden {
            display: none !important;
          }
          
          /* Reset page borders, background colors, and absolute placements on printing */
          body, html, main, .flex-1, .flex, .min-h-screen {
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
          }

          .print-invoice-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
          }

          /* Force 2 columns on the details panel during print */
          .print-invoice-details-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }

          .print-invoice-details-grid table {
            background-color: transparent !important;
            background: transparent !important;
          }

          /* Force printable sheet to fill viewport width with proper margin padding spacing */
          .print-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            padding: 48px !important; /* Beautiful professional spacing/padding */
            margin: 0 !important;
            box-sizing: border-box !important;
          }

          /* Explicit margin-top spacing on top-level printed segments */
          .print-invoice-area > * {
            margin-top: 48px !important;
          }
          .print-invoice-area > *:first-child {
            margin-top: 0 !important;
          }
        }
      `}</style>

      {/* Billing KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hide">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Total Invoiced</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(totalInvoiced / 100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Sum of all billing events</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-receipt text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Settled Volume</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(completedPayments / 100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Successfully completed settlements</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-badge-check text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Outstanding Bills</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(pendingPayments / 100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Invoices waiting for client action</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-time-five text-xl"></i>
          </div>
        </div>
      </div>

      {/* Transaction Logs Table Card */}
      <div className="bg-white border border-neutral-200 rounded-md p-5 shadow-sm print-hide">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Invoice Ledger</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Audit onboarding invoices, track billing milestones, and view pending workspace invoices.</p>
          </div>
        </div>

        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search invoices, projects, representatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
            />
          </div>

          {/* View Layout Toggle */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-1.5 ${viewMode === 'table' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-550 hover:text-neutral-900'
                }`}
            >
              <i className="bx bx-list-ul text-sm"></i>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-1.5 ${viewMode === 'card' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-550 hover:text-neutral-900'
                }`}
            >
              <i className="bx bx-grid-alt text-sm"></i>
              <span>Cards</span>
            </button>
          </div>
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
                  className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-neutral-400">
                        {pay.invoice_number}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${pay.status === 'completed'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : pay.status === 'failed'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                        {pay.status === 'completed' ? 'Paid' : pay.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{pay.projects?.project_name || 'Individual Project'}</h3>
                    <p className="text-xs text-neutral-450 font-medium">Representative: {pay.projects?.client_name || 'Unassigned'}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-400 font-semibold">Invoiced Amount</span>
                      <span className="text-xl font-black text-neutral-800 font-sans">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-neutral-400 font-sans font-medium">
                        {new Date(pay.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(pay)}
                        className="inline-flex items-center p-2 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                        title="View Detailed Invoice"
                      >
                        <i className="bx bx-receipt text-base mr-1"></i>
                        <span className="text-xs font-bold">Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="overflow-hidden mt-3 border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Invoice ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Scope</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Representative</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Amount</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Settlement</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-semibold">
                {payments
                  .filter(pay => {
                    const matchesSearch = (pay.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
                    return matchesSearch;
                  })
                  .map((pay) => (
                    <tr key={pay.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-mono text-xs font-semibold text-neutral-900">
                        {pay.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-bold text-neutral-900">
                        {pay.projects?.project_name || 'Individual Project'}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-medium">
                        {pay.projects?.client_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-sans font-extrabold text-neutral-900">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${pay.status === 'completed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : pay.status === 'failed'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                          {pay.status === 'completed' ? 'Paid' : pay.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(pay)}
                          className="inline-flex items-center px-3 py-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer text-xs font-bold"
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
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print-modal-backdrop">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden print-invoice-card">
            {/* Modal Actions Bar (hidden during print) */}
            <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-neutral-650 uppercase tracking-wider">Invoice Statement</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <i className="bx bx-printer text-sm"></i>
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="p-8 space-y-8 print:p-0 print-invoice-area">

              {/* Top Minimalist Header Section */}
              <div className="flex justify-between items-start pb-6 border-b border-neutral-200">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-neutral-900 text-lg uppercase tracking-tight">Kelvin Lightings</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 space-y-0.5 font-medium">
                    <p className="font-semibold text-neutral-700">Office 402, Signature Plaza</p>
                    <p>Bandra Kurla Complex, Mumbai, MH, 400051</p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-neutral-500 space-y-0.5 font-medium">
                  <p><span className="font-semibold text-neutral-700">Phone:</span> +91 22 6123 4567</p>
                  <p><span className="font-semibold text-neutral-700">Email:</span> billing@kelvinlightings.com</p>
                  <p><span className="font-semibold text-neutral-700">Website:</span> www.kelvinlightings.com</p>
                </div>
              </div>

              {/* Bill to / Details Panel (Minimalist Layout) */}
              <div className="mt-8 border border-neutral-200 bg-neutral-50/50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-neutral-600 print-invoice-details-grid">
                <div className="space-y-6">
                  <div>
                    <span className="font-bold text-neutral-400 block text-[9px] uppercase tracking-wider mb-1">BILL TO</span>
                    <p className="font-extrabold text-neutral-900 text-sm">{selectedInvoice.projects?.client_name || 'Client Representative'}</p>
                    <p className="text-neutral-500 font-medium mt-0.5">Partner Architect Portal Client</p>
                  </div>

                  <div>
                    <span className="font-bold text-neutral-400 block text-[9px] uppercase tracking-wider mb-1">SHIP TO / SITE LOCATION</span>
                    <p className="font-extrabold text-neutral-800">{selectedInvoice.projects?.project_name || 'Project Scope'}</p>
                    <p className="text-neutral-500 font-medium mt-0.5">Project ID: <span className="font-mono font-bold text-neutral-800">{selectedInvoice.projects?.project_id_serial || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="flex flex-col justify-between md:items-end space-y-4">
                  <div className="w-full md:w-auto min-w-[220px]">
                    <span className="font-bold text-neutral-400 block text-[9px] uppercase tracking-wider mb-2 md:text-right">DETAILS</span>
                    <table className="w-full text-left md:text-right border-collapse">
                      <tbody>
                        <tr>
                          <td className="py-1 text-neutral-500 pr-4 md:pr-0 md:text-left">Invoice No:</td>
                          <td className="py-1 font-bold text-neutral-900 font-mono text-right">{selectedInvoice.invoice_number || 'INV-2026-8879'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-neutral-500 pr-4 md:pr-0 md:text-left">Invoice Date:</td>
                          <td className="py-1 font-bold text-neutral-900 text-right">{new Date(selectedInvoice.created_at).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-neutral-500 pr-4 md:pr-0 md:text-left">Due Date:</td>
                          <td className="py-1 font-bold text-neutral-900 text-right">{new Date(new Date(selectedInvoice.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-neutral-550 pr-4 md:pr-0 md:text-left">Status:</td>
                          <td className="py-1 text-right whitespace-nowrap font-bold uppercase text-[11px]">
                            <span className={
                              selectedInvoice.status === 'completed'
                                ? 'text-emerald-600'
                                : selectedInvoice.status === 'failed'
                                  ? 'text-rose-600'
                                  : 'text-amber-600'
                            }>{selectedInvoice.status === 'completed' ? 'Paid' : selectedInvoice.status}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Line Items Table (Clean Table Style) */}
              <div className="mt-8">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-t border-b border-neutral-300 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-2 w-1/2">Product / Service</th>
                      <th className="py-2.5 px-2 text-right">Quantity</th>
                      <th className="py-2.5 px-2 text-right">Rate</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700 font-semibold">
                    <tr>
                      <td className="py-4 px-2">
                        <p className="font-bold text-neutral-900">{selectedInvoice.projects?.pricing_plans?.name || 'Onboarding Package Fee'}</p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Professional custom lighting layouts & Lux simulation configurations.</p>
                      </td>
                      <td className="py-4 px-2 text-right font-sans text-neutral-600 whitespace-nowrap">
                        {Number(selectedInvoice.projects?.area_sq_ft || 0).toLocaleString()} sq ft
                      </td>
                      <td className="py-4 px-2 text-right font-sans text-neutral-600 whitespace-nowrap">
                        ₹{Number(selectedInvoice.projects?.pricing_plans?.base_price_per_sq_ft || 0).toFixed(2)}/sq ft
                      </td>
                      <td className="py-4 px-2 text-right font-sans font-bold text-neutral-900 whitespace-nowrap">
                        ₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Footer Section */}
              <div className="mt-12 flex justify-between items-start pt-6 border-t border-neutral-200">
                <div className="max-w-xs space-y-1.5 text-left">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Customer Message</span>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Hello!<br />
                    Thank you for your purchase. Please return <br /> this invoice with payment.<br />
                    Thanks!
                  </p>
                </div>

                <div className="w-80 text-xs text-neutral-500 font-semibold pr-1">
                  <table className="w-full text-right border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 px-1 text-left text-neutral-500">Subtotal</td>
                        <td className="py-1 px-1 font-bold text-neutral-855 whitespace-nowrap">₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 text-left text-neutral-500">Sales Tax (0%)</td>
                        <td className="py-1 px-1 font-bold text-neutral-855 whitespace-nowrap">₹0.00</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 text-left text-neutral-500">Shipping</td>
                        <td className="py-1 px-1 font-bold text-neutral-855 whitespace-nowrap">₹0.00</td>
                      </tr>
                      <tr className="border-t border-neutral-300">
                        <td className="py-3 px-1 text-left text-[10px] uppercase font-extrabold text-neutral-900">Total</td>
                        <td className="py-3 px-1 font-extrabold text-lg text-neutral-900 whitespace-nowrap">₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
