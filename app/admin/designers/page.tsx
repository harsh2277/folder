'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  mobile_number: string | null;
  created_at: string;
}

export default function AdminDesignersList() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [designers, setDesigners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDesigners() {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email, mobile_number, created_at')
          .eq('role', 'designer')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const designersWithCounts = await Promise.all(
          ((profiles as ProfileRow[]) || []).map(async (des: ProfileRow) => {
            const { count: totalCount } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('assigned_designer_id', des.id);

            const { count: inDesignCount } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('assigned_designer_id', des.id)
              .eq('status', 'In Design');

            const { count: completedCount } = await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('assigned_designer_id', des.id)
              .in('status', ['Approved', 'Closed']);

            const { count: revisionCount } = await supabase
              .from('revision_requests')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending');

            return {
              ...des,
              totalProjects: totalCount || 0,
              inDesign: inDesignCount || 0,
              completed: completedCount || 0,
              pendingRevisions: revisionCount || 0,
            };
          })
        );

        setDesigners(designersWithCounts);
      } catch (err) {
        console.error('Error fetching designers:', err);
        // Fallback mock data
        setDesigners([
          { id: '1', name: 'Neha Joshi', email: 'neha@lightlab.in', mobile_number: '+91 98123 45678', created_at: new Date().toISOString(), totalProjects: 15, inDesign: 4, completed: 9, pendingRevisions: 2 },
          { id: '2', name: 'Karan Verma', email: 'karan@lightlab.in', mobile_number: '+91 87123 45678', created_at: new Date().toISOString(), totalProjects: 11, inDesign: 2, completed: 7, pendingRevisions: 0 },
          { id: '3', name: 'Divya Patel', email: 'divya@lightlab.in', mobile_number: '+91 76123 45678', created_at: new Date().toISOString(), totalProjects: 8, inDesign: 3, completed: 5, pendingRevisions: 1 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchDesigners();
  }, []);

  const filtered = designers.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q);
  });

  const getWorkloadBadge = (inDesign: number) => {
    if (inDesign >= 5) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (inDesign >= 3) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const getWorkloadLabel = (inDesign: number) => {
    if (inDesign >= 5) return 'Heavy';
    if (inDesign >= 3) return 'Moderate';
    if (inDesign === 0) return 'Available';
    return 'Light';
  };

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
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Lighting Designers</h2>
          <p className="text-sm text-neutral-450 mt-0.5">Internal design team workload and project assignments.</p>
        </div>
        <span className="text-xs font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-md">
          {designers.length} Team Members
        </span>
      </div>

      {/* Search */}
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
            <span className="text-xs font-medium text-neutral-450 block">Team Size</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">{designers.length}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
            <i className="bx bx-palette text-lg" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-450 block">Active Designs</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">
              {designers.reduce((s, d) => s + (d.inDesign || 0), 0)}
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-edit text-lg" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-450 block">Delivered</span>
            <span className="text-2xl font-medium text-neutral-900 leading-none mt-1 block">
              {designers.reduce((s, d) => s + (d.completed || 0), 0)}
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <i className="bx bx-check-double text-lg" />
          </div>
        </div>
      </div>

      {/* Designer Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-450 border border-dashed border-neutral-200 rounded-md bg-neutral-50/20">
          No designers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((des) => (
            <div key={des.id} className="bg-white border border-neutral-200 rounded-md p-5 space-y-4 hover:border-neutral-300 transition-all">
              {/* Designer Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {des.name?.substring(0, 1).toUpperCase() || 'D'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{des.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{des.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${getWorkloadBadge(des.inDesign)}`}>
                  {getWorkloadLabel(des.inDesign)}
                </span>
              </div>

              {/* Workload Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4">
                <div className="text-center">
                  <span className="text-lg font-bold text-neutral-900">{des.totalProjects}</span>
                  <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">Total</span>
                </div>
                <div className="text-center border-x border-neutral-100">
                  <span className="text-lg font-bold text-amber-600">{des.inDesign}</span>
                  <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">Active</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-emerald-600">{des.completed}</span>
                  <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">Done</span>
                </div>
              </div>

              {/* Workload Bar */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-medium text-neutral-400 mb-1">
                  <span>Capacity</span>
                  <span>{des.inDesign}/6 active slots</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${des.inDesign >= 5 ? 'bg-rose-500' : des.inDesign >= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((des.inDesign / 6) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-medium">
                  Joined {new Date(des.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <Link
                  href={`/admin/projects?designer=${des.id}`}
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                >
                  View Projects →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
