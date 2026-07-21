'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ArchitectDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [architectName, setArchitectName] = useState('Architect');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [revisionProjects, setRevisionProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inDesignProjects: 0,
    underReviewProjects: 0,
    totalInvoiced: 0
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
          if (profile?.name) {
            setArchitectName(profile.name);
          }

          // Fetch all projects assigned to this architect
          const { data: projects } = await supabase
            .from('projects')
            .select('*, payments(amount, status)')
            .eq('architect_id', user.id)
            .order('created_at', { ascending: false });

          if (projects && projects.length > 0) {
            setRecentProjects(projects.slice(0, 5));
            setRevisionProjects(projects.filter(p => p.status === 'Revision Requested'));

            const total = projects.length;
            const completed = projects.filter(p => p.status === 'Closed' || p.status === 'Approved').length;
            const inDesign = projects.filter(p => p.status === 'In Design').length;
            const underReview = projects.filter(p => p.status === 'Under Review').length;

            // Sum up total payments completed for this architect's projects
            const invoiced = projects.reduce((sum, p) => {
              const projectPayments = p.payments || [];
              const projectPaidSum = projectPayments
                .filter((pay: any) => pay.status === 'completed')
                .reduce((paySum: number, pay: any) => paySum + Number(pay.amount), 0);
              return sum + projectPaidSum;
            }, 0);

            setStats({
              totalProjects: total,
              completedProjects: completed,
              inDesignProjects: inDesign,
              underReviewProjects: underReview,
              totalInvoiced: invoiced
            });
          }
        }
      } catch (err) {
        console.error('Error loading architect dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <svg className="animate-spin h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner / Hero Card (Matches Admin Style) */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-md p-4 sm:p-5 xl:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-800">
        <div className="space-y-1 min-w-0">
          <h2 className="text-base sm:text-lg xl:text-xl font-medium tracking-tight truncate">Welcome back, {architectName}</h2>
          <p className="text-xs sm:text-sm text-neutral-450 truncate">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} &mdash; {stats.underReviewProjects} projects currently undergoing review.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <Link
            href="/architect/projects/create"
            className="px-3 py-1.5 xl:px-4 xl:py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs xl:text-sm font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap active:scale-[0.98]"
          >
            <i className="bx bx-plus text-sm"></i>
            <span>Add Project</span>
          </Link>
          <Link
            href="/architect/projects"
            className="px-3 py-1.5 xl:px-4 xl:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs xl:text-sm font-medium border border-neutral-700 transition-all flex items-center space-x-1.5 whitespace-nowrap"
          >
            <i className="bx bx-folder text-sm"></i>
            <span>All Projects</span>
          </Link>
        </div>
      </div>

      {/* Revision Requests Queue (Warning block analogous to Admin pending queue) */}
      {revisionProjects.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-rose-100">
            <div>
              <h3 className="text-sm font-medium text-rose-950 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Action Required: Revisions Requested</span>
              </h3>
              <p className="text-sm text-rose-500 font-medium mt-0.5">Projects requiring design revisions or metadata updates based on review feedback.</p>
            </div>
            <span className="text-sm font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-sans">
              {revisionProjects.length} Revision{revisionProjects.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-neutral-50 max-h-72 overflow-y-auto">
            {revisionProjects.map((p) => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-450 font-medium font-sans">{p.project_id_serial || 'KL-XXXX'}</span>
                    <h4 className="text-sm font-medium text-neutral-900">{p.project_name}</h4>
                  </div>
                  {p.project_notes && p.project_notes.startsWith('Rejection Reason:') && (
                    <p className="text-xs text-rose-600 bg-rose-50/50 px-2 py-1 rounded border border-rose-100/30 inline-block">
                      Feedback: {p.project_notes.replace('Rejection Reason:', '').trim()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    href={`/architect/projects/${p.id}/revision-request`}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 rounded-md transition-all active:scale-[0.98]"
                  >
                    Submit Revision
                  </Link>
                  <Link
                    href={`/architect/projects/${p.id}`}
                    className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium border border-neutral-200 rounded-md transition-all active:scale-[0.98]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-450 block truncate">Assigned</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">{stats.totalProjects}</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">All managed projects</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-600 border border-neutral-200 shrink-0">
            <i className="bx bx-folder text-lg xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-450 block truncate">In Design</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">{stats.inDesignProjects}</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Active layout stage</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-edit text-lg xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-450 block truncate">Under Review</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">{stats.underReviewProjects}</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Awaiting client checks</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <i className="bx bx-time-five text-lg xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-450 block truncate">Settled</span>
            <span className="text-2xl sm:text-3xl font-medium text-neutral-900 leading-none">₹{(stats.totalInvoiced / 100000).toFixed(1)}L</span>
            <span className="text-[10px] text-neutral-400 block mt-1.5 truncate">Settled invoice amount</span>
          </div>
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <i className="bx bx-credit-card text-lg xl:text-xl"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects List (No charts here) */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="pb-4 border-b border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900">Active Workspaces</h2>
          <p className="text-sm text-neutral-450 mt-0.5">Assigned projects currently undergoing lighting layouts and simulation phases.</p>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-455 font-medium space-y-2">
            <i className="bx bx-folder-open text-3xl text-neutral-300"></i>
            <p>No projects assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 border border-neutral-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse min-w-[420px] bg-white">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5 whitespace-nowrap">Project ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 whitespace-nowrap">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 whitespace-nowrap hidden sm:table-cell">Client</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700 font-medium">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-xs text-neutral-500 whitespace-nowrap">{p.project_id_serial || 'N/A'}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-900 text-sm max-w-[140px] xl:max-w-none">
                      <span className="block truncate">{p.project_name}</span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 text-xs hidden sm:table-cell max-w-[100px]">
                      <span className="block truncate">{p.client_name}</span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${ p.status === 'Closed' || p.status === 'Approved' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : p.status === 'In Design' ? 'bg-indigo-50 border-indigo-100/50 text-indigo-700' : p.status === 'Submitted' ? 'bg-amber-50 border-amber-100/50 text-amber-700' : 'bg-neutral-50 border-neutral-200 text-neutral-600' }`}>
                        {p.status === 'Submitted' ? 'Pending' : p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <Link
                        href={`/architect/projects/${p.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors whitespace-nowrap active:scale-[0.98]"
                      >
                        View
                      </Link>
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
