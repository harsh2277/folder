'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ArchitectDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [architectName, setArchitectName] = useState('Architect');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
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
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-md p-6 flex flex-col md:flex-row md:items-center justify-between border border-neutral-800">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {architectName}</h2>
          <p className="text-sm text-neutral-400">
            Kelvin Lightings Partner Portal &mdash; You have {stats.underReviewProjects} projects currently undergoing review.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            href="/architect/projects/create"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-bold transition-all flex items-center space-x-2"
          >
            <i className="bx bx-plus-circle text-base"></i>
            <span>Add Project</span>
          </Link>
          <Link
            href="/architect/projects"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-semibold border border-neutral-700 transition-all flex items-center space-x-2"
          >
            <i className="bx bx-folder text-base"></i>
            <span>View All Projects</span>
          </Link>
        </div>
      </div>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* KPI 1 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Assigned Projects</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{stats.totalProjects}</span>
            <span className="text-sm text-neutral-400 block">All managed projects</span>
          </div>
          <div className="w-12 h-12 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-600 border border-neutral-200">
            <i className="bx bx-folder text-xl"></i>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">In Design</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{stats.inDesignProjects}</span>
            <span className="text-sm text-neutral-400 block">Active layout stage</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-edit text-xl"></i>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Under Review</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{stats.underReviewProjects}</span>
            <span className="text-sm text-neutral-400 block">Awaiting client checks</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-time-five text-xl"></i>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Volume Settled</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">₹{(stats.totalInvoiced / 100000).toFixed(1)}L</span>
            <span className="text-sm text-neutral-400 block">Settled invoice amount</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-credit-card text-xl"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects List */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Active Workspaces</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Assigned projects currently undergoing lighting layouts and simulation phases.</p>
          </div>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400 font-medium space-y-2">
            <i className="bx bx-folder-open text-3xl text-neutral-300"></i>
            <p>No projects assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden mt-3 border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-400 font-normal text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Serial ID</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Representative</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/40 transition-colors">
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-mono text-neutral-900">{p.project_id_serial || 'N/A'}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-855">{p.project_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500">{p.client_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        p.status === 'Closed' || p.status === 'Approved'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : p.status === 'In Design'
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : p.status === 'Submitted'
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                      }`}>
                        {p.status === 'Submitted' ? 'Approval Pending' : p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <Link
                        href={`/architect/projects/${p.id}`}
                        className="px-2.5 py-1 text-xs font-bold text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        Workspace
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
