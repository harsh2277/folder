'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function DesignerDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [designerName, setDesignerName] = useState('Designer');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inDesignProjects: 0,
    underReviewProjects: 0,
    completedProjects: 0,
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
            setDesignerName(profile.name);
          }

          // Fetch projects assigned to this designer from RLS bypass API
          const res = await fetch('/api/designer/projects');
          const resData = await res.json();
          const projects = resData.projects || [];

          if (projects && projects.length > 0) {
            setRecentProjects(projects.slice(0, 5));

            const total = projects.length;
            const inDesign = projects.filter((p: any) => p.status === 'In Design').length;
            const underReview = projects.filter((p: any) => p.status === 'Under Review' || p.status === 'Ready for Client Review').length;
            const completed = projects.filter((p: any) => p.status === 'Approved' || p.status === 'Closed').length;

            setStats({
              totalProjects: total,
              inDesignProjects: inDesign,
              underReviewProjects: underReview,
              completedProjects: completed,
            });
          }
        }
      } catch (err) {
        console.error('Error loading designer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
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

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-md p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800">
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Welcome back, {designerName}</h2>
          <p className="text-sm text-neutral-400">
            Lightlab Staff Workspace &mdash; You have {stats.inDesignProjects} active projects in your design layout workflow.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/designer/projects"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="bx bx-folder text-sm"></i>
            <span>View All Projects</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-neutral-400 block">Total</span>
            <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 font-sans">{stats.totalProjects}</span>
            <span className="text-xs text-neutral-400 block hidden sm:block">All managed projects</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-600 border border-neutral-200 shrink-0">
            <i className="bx bx-folder text-lg sm:text-xl"></i>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-neutral-400 block">In Design</span>
            <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 font-sans">{stats.inDesignProjects}</span>
            <span className="text-xs text-neutral-400 block hidden sm:block">Active layout stage</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-edit-alt text-lg sm:text-xl"></i>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-neutral-400 block">In Review</span>
            <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 font-sans">{stats.underReviewProjects}</span>
            <span className="text-xs text-neutral-400 block hidden sm:block">Awaiting client checks</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <i className="bx bx-time text-lg sm:text-xl"></i>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-neutral-200 rounded-md p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-neutral-400 block">Completed</span>
            <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 font-sans">{stats.completedProjects}</span>
            <span className="text-xs text-neutral-400 block hidden sm:block">Successfully closed scopes</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <i className="bx bx-check-double text-lg sm:text-xl"></i>
          </div>
        </div>
      </div>

      {/* Main Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left Side: Recent Active Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-md p-5">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 font-sans">Recent Workspace Projects</h2>
                <p className="text-sm text-neutral-450 mt-0.5">Assigned projects currently undergoing lighting layouts and simulation phases.</p>
              </div>
            </div>

            <div className="overflow-x-auto mt-3 border border-neutral-100 rounded-md">
              <table className="w-full text-left border-collapse text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-450 font-normal text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5 hidden sm:table-cell">Client</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5 hidden md:table-cell">Area</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
                  {recentProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3 px-4 first:pl-5 last:pr-5">
                        <Link href="/designer/projects" className="font-semibold text-neutral-900 hover:text-amber-600 transition-colors text-sm block">
                          {proj.project_name}
                        </Link>
                        <span className="text-xs text-neutral-400 font-mono block mt-0.5">{proj.project_id_serial || 'NO-ID'}</span>
                      </td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5 text-neutral-500 text-sm hidden sm:table-cell">{proj.client_name}</td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5 font-mono text-neutral-450 text-xs hidden md:table-cell">{proj.area_sq_ft ? proj.area_sq_ft.toLocaleString() : 'N/A'}</td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${proj.status === 'Approved' || proj.status === 'Closed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : proj.status === 'In Design'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                              : 'bg-blue-50 border-blue-100 text-blue-700'
                          }`}>
                          {proj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentProjects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-neutral-450 font-medium">
                        No projects found in workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action & Resource links */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-md p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-100">
              Designer Quick Actions
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/designer/projects"
                className="flex items-center justify-between p-3 border border-neutral-100 hover:border-neutral-200 rounded hover:bg-neutral-50 transition-all font-semibold text-sm text-neutral-700 group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <i className="bx bx-list-check text-lg text-amber-600"></i>
                  <span>Manage Design Statuses</span>
                </div>
                <i className="bx bx-chevron-right text-neutral-400 group-hover:translate-x-0.5 transition-transform"></i>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-md p-5 space-y-4 border border-neutral-850">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
              <i className="bx bxs-bulb text-lg"></i>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-tight">Lightlab Design Standards</h4>
              <p className="text-sm text-neutral-450 mt-1 leading-relaxed">
                Ensure all CAD layouts adhere to the lux-rating and fixture placement rules defined in Lightlab's official documentation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
