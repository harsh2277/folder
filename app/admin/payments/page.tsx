'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import LayoutToggle from '@/components/ui/LayoutToggle';
import StatsCard from '@/components/ui/StatsCard';
import SearchInput from '@/components/ui/SearchInput';
import CustomSelect from '@/components/ui/CustomSelect';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge, SkeletonPaymentsPage, Pagination, InvoiceModal } from '@/components/ui';

const PAGE_SIZE = 10;

export default function AdminPaymentsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState(false);

  async function fetchPayments() {
    setLoading(true);
    setLoadError(false);
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
          projects!project_id (
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
      setPayments([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  if (loading) return <SkeletonPaymentsPage />;

  if (loadError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm font-medium flex flex-col items-center text-center space-y-3">
        <div className="flex items-center space-x-2">
          <i className="bx bx-error-circle text-lg"></i>
          <span>Unable to load payments — please retry.</span>
        </div>
        <button
          onClick={() => fetchPayments()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate audit totals
  const totalInvoiced = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);

  // Filter payments by search + status
  const filteredPayments = payments.filter(pay => {
    const matchesSearch =
      (pay.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.projects?.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.projects?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
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

          <div className="flex items-center gap-2">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' }
              ]}
            />
            {/* View Layout Toggle */}
            <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* List/Table Render Area */}
        {viewMode === 'card' ? (
          filteredPayments.length === 0 ? (
            <EmptyState title="No invoices found" description="Try adjusting your search or status filter." icon="bx-receipt" />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {paginatedPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 transition-all duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-neutral-400">
                        {pay.invoice_number}
                      </span>
                      <StatusBadge status={pay.status} type="payment" />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">{pay.projects?.project_name || 'Individual Project'}</h3>
                    <p className="text-sm text-neutral-500 font-medium">Rep: {pay.projects?.client_name || 'Unassigned'}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-neutral-400 font-medium">Amount</span>
                      <span className="text-lg font-medium text-neutral-800 font-sans">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-neutral-400 font-sans font-medium">
                        {new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(pay)}
                        className="inline-flex items-center p-2 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer text-sm"
                        aria-label={`View invoice ${pay.invoice_number}`}
                      >
                        <i className="bx bx-receipt text-sm mr-1" />
                        <span className="text-sm font-medium font-sans">Details</span>
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
          )
        ) : (
          <div className="overflow-x-auto mt-3 border border-neutral-200 rounded-md bg-white">
            {filteredPayments.length === 0 ? (
              <EmptyState title="No invoices found" description="Try adjusting your search or status filter." icon="bx-receipt" />
            ) : (
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0 bg-white">
              <caption className="sr-only">Invoice transactions, sorted by date</caption>
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-normal text-xs">
                  <th scope="col" className="py-3 px-4 first:pl-5">Date</th>
                  <th scope="col" className="py-3 px-4">Invoice #</th>
                  <th scope="col" className="py-3 px-4">Project</th>
                  <th scope="col" className="py-3 px-4">Client</th>
                  <th scope="col" className="py-3 px-4">Amount</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 last:pr-5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700 font-normal">
                {paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 first:pl-5 text-xs text-neutral-400 font-sans whitespace-nowrap">
                      {new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-neutral-900 whitespace-nowrap">
                      {pay.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-900 max-w-xs truncate">
                      {pay.projects?.project_name || 'Individual Project'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                      {pay.projects?.client_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-neutral-900 whitespace-nowrap">
                      ₹{Number(pay.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={pay.status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 last:pr-5 text-right">
                      <button
                        onClick={() => setSelectedInvoice(pay)}
                        className="inline-flex items-center px-3 py-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-amber-600 border border-neutral-200 rounded-md transition-colors cursor-pointer text-sm font-medium"
                        aria-label={`View invoice ${pay.invoice_number}`}
                      >
                        <i className="bx bx-receipt text-sm mr-1.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={filteredPayments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Invoice Detail Modal (Printable) */}
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
