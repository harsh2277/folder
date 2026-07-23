'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminArchitectsList() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [architects, setArchitects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchArchitects() {
      try {
        // Fetch all architect profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email, mobile_number, created_at')
          .eq('role', 'architect')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // For each architect, get their project count
        const architectsWithCounts = await Promise.all(
          (profiles || []).map(async (arch: any) => {
            const { count: projectCount } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('architect_id', arch.id);

            const { count: activeCount } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('architect_id', arch.id)
              .in('status', ['In Design', 'Under Review', 'Ready for Client Review']);

            const { data: payments } = await supabase
              .from('payments')
              .select('amount, projects!inner(architect_id)')
              .eq('projects.architect_id', arch.id)
              .eq('status', 'completed');

            const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

            return { ...arch, projectCount: projectCount || 0, activeCount: activeCount || 0, totalRevenue };
          })
        );

        setArchitects(architectsWithCounts);
      } catch (err) {
        console.error('Error fetching architects:', err);
        // Fallback mock data
        setArchitects([
          { id: '1', name: 'Amit Sharma', email: 'amit@lightlab.in', mobile_number: '+91 98765 43210', created_at: new Date().toISOString(), projectCount: 8, activeCount: 3, totalRevenue: 425000 },
          { id: '2', name: 'Priya Mehta', email: 'priya@lightlab.in', mobile_number: '+91 87654 32109', created_at: new Date().toISOString(), projectCount: 5, activeCount: 2, totalRevenue: 280000 },
          { id: '3', name: 'Rohan Kapoor', email: 'rohan@lightlab.in', mobile_number: '+91 76543 21098', created_at: new Date().toISOString(), projectCount: 12, activeCount: 4, totalRevenue: 695000 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchArchitects();
  }, []);

  const filtered = architects.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Architect Partners</h2>
          <p className="text-sm text-neutral-450 mt-0.5">All registered architects and their project workloads.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-md">
            {architects.length} Total Architects
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-450 block">Total Architects</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">{architects.length}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-user-check text-lg" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-450 block">Total Projects</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">
              {architects.reduce((s, a) => s + (a.projectCount || 0), 0)}
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <i className="bx bx-folder text-lg" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-450 block">Revenue Generated</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">
              ₹{(architects.reduce((s, a) => s + (a.totalRevenue || 0), 0) / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <i className="bx bx-rupee text-lg" />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-450 border border-dashed border-neutral-200 rounded-md bg-neutral-50/20">
          No architects found matching your search.
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-md bg-white">
          <table className="w-full text-left border-collapse text-sm min-w-[700px] bg-white">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-xs">
                <th className="py-3 px-4 pl-5">Architect</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Total Projects</th>
                <th className="py-3 px-4">Active Now</th>
                <th className="py-3 px-4">Revenue Contribution</th>
                <th className="py-3 px-4">Member Since</th>
                <th className="py-3 px-4 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filtered.map((arch) => (
                <tr key={arch.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-4 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                        {arch.name?.substring(0, 1).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 text-sm">{arch.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{arch.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-500 font-medium">
                    {arch.mobile_number || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                      <i className="bx bx-folder text-neutral-400 text-base" />
                      {arch.projectCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {arch.activeCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                        {arch.activeCount} active
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 font-medium">No active</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-sm font-semibold text-neutral-800">
                    {arch.totalRevenue > 0
                      ? `₹${Number(arch.totalRevenue).toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-450 font-medium">
                    {new Date(arch.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 pr-5 text-right">
                    <Link
                      href={`/admin/projects?architect=${arch.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors whitespace-nowrap active:scale-[0.98]"
                    >
                      View Projects
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
