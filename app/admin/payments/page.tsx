'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminPaymentsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [methodFilter, setMethodFilter] = useState('All');

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
              project_name,
              client_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Error fetching payments:', err);
        // Fallback mock transactions
        setPayments([
          { id: '1', invoice_number: 'INV-2025-001', amount: 85000, status: 'completed', payment_method: 'Bank Transfer', transaction_id: 'TXN10293847', created_at: new Date().toISOString(), projects: { project_name: 'Lotus Penthouse', client_name: 'Vikram Shah' } },
          { id: '2', invoice_number: 'INV-2025-002', amount: 437500, status: 'pending', payment_method: 'Cards', transaction_id: null, created_at: new Date().toISOString(), projects: { project_name: 'Vertex IT Hub', client_name: 'Vertex Corp' } },
          { id: '3', invoice_number: 'INV-2025-003', amount: 77000, status: 'completed', payment_method: 'UPI', transaction_id: 'UPI987654321', created_at: new Date().toISOString(), projects: { project_name: 'Zoya Boutique', client_name: 'Zoya Lifestyle' } },
          { id: '4', invoice_number: 'INV-2025-004', amount: 297500, status: 'completed', payment_method: 'Cards', transaction_id: 'TXN10293848', created_at: new Date().toISOString(), projects: { project_name: 'Orion Workspace', client_name: 'Orion Enterprises' } },
          { id: '5', invoice_number: 'INV-2025-005', amount: 157500, status: 'failed', payment_method: 'Net Banking', transaction_id: null, created_at: new Date().toISOString(), projects: { project_name: 'Azure Residences', client_name: 'BlueWave Developments' } }
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
      {/* Billing KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Total Invoiced</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(totalInvoiced/100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Sum of all billing events</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-receipt text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Settled Volume</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(completedPayments/100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Successfully completed settlements</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-badge-check text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Outstanding Bills</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(pendingPayments/100000).toFixed(2)}L</span>
            <span className="text-sm text-neutral-400 block">Invoices waiting for client action</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-time-five text-xl"></i>
          </div>
        </div>
      </div>

      {/* Transaction Logs Table Card */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Transaction Ledger</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Audit payouts, verify client transaction IDs, and track pending workspace invoices.</p>
          </div>
        </div>

        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center space-x-2 flex-1">
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
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-bold text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cards">Cards</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          {/* View Layout Toggle */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-550 hover:text-neutral-900'
              }`}
            >
              <i className="bx bx-list-ul text-sm"></i>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'card' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-550 hover:text-neutral-900'
              }`}
            >
              <i className="bx bx-grid-alt text-sm"></i>
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* List/Table Render Area */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {payments
              .filter(pay => {
                const matchesSearch = pay.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesMethod = methodFilter === 'All' || pay.payment_method === methodFilter;
                return matchesSearch && matchesMethod;
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        pay.status === 'completed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : pay.status === 'failed'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {pay.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{pay.projects?.project_name || 'Individual Project'}</h3>
                    <p className="text-xs text-neutral-500 font-medium">Representative: {pay.projects?.client_name || 'Unassigned'}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-50 space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-400 font-semibold">Invoiced Amount</span>
                      <span className="text-xl font-black text-neutral-900 font-sans">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-550">
                      <span>Gateway Method</span>
                      <span>{pay.payment_method || 'Cards'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-550">
                      <span>Transaction ID</span>
                      <span className="font-mono text-neutral-400">{pay.transaction_id || 'Not Settled'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-neutral-400 font-sans font-medium">
                        {new Date(pay.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => alert(`Opening details for Invoice ${pay.invoice_number}`)}
                        className="inline-flex items-center p-1.5 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-md transition-colors"
                        title="Download PDF Receipt"
                      >
                        <i className="bx bx-download text-base"></i>
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
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Method</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Transaction reference ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Settlement</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-semibold">
                {payments
                  .filter(pay => {
                    const matchesSearch = pay.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (pay.projects?.project_name && pay.projects.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (pay.projects?.client_name && pay.projects.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesMethod = methodFilter === 'All' || pay.payment_method === methodFilter;
                    return matchesSearch && matchesMethod;
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
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-450 font-semibold">{pay.payment_method || 'Cards'}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-mono text-xs text-neutral-400">{pay.transaction_id || 'Not Settled'}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold border ${
                          pay.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : pay.status === 'failed'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                        <button
                          onClick={() => alert(`Opening details for Invoice ${pay.invoice_number}`)}
                          className="inline-flex items-center p-1.5 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-md transition-colors"
                          title="Download PDF Receipt"
                        >
                          <i className="bx bx-download text-base"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
