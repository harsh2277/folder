'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { StatusBadge, SkeletonDashboard, StatsCard } from '@/components/ui';

export default function ArchitectDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [architectName, setArchitectName] = useState('Architect');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [revisionProjects, setRevisionProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalProjects: number;
    completedProjects: number;
    inDesignProjects: number;
    underReviewProjects: number;
    totalInvoiced: number;
    projectsTrend: { value: number; direction: 'up' | 'down' } | null;
    upcomingDeadlines: number;
  }>({
    totalProjects: 0,
    completedProjects: 0,
    inDesignProjects: 0,
    underReviewProjects: 0,
    totalInvoiced: 0,
    projectsTrend: null,
    upcomingDeadlines: 0
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/architect/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.architectName) setArchitectName(data.architectName);
          if (data.recentProjects) setRecentProjects(data.recentProjects);
          if (data.revisionProjects) setRevisionProjects(data.revisionProjects);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error('Error loading architect dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
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



      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="Assigned"
          value={stats.totalProjects}
          subtext="All managed projects"
          trend={stats.projectsTrend || undefined}
          icon="bx-folder"
          iconBgClass="bg-neutral-50 border-neutral-200"
          iconColorClass="text-neutral-600"
        />
        <StatsCard
          title="In Design"
          value={stats.inDesignProjects}
          subtext="Active layout stage"
          icon="bx-edit"
          iconBgClass="bg-amber-50 border-amber-100"
          iconColorClass="text-amber-600"
        />
        <StatsCard
          title="Under Review"
          value={stats.underReviewProjects}
          subtext="Awaiting client checks"
          icon="bx-time-five"
          iconBgClass="bg-blue-50 border-blue-100"
          iconColorClass="text-blue-600"
        />
        <StatsCard
          title="Settled"
          value={`₹${(stats.totalInvoiced / 100000).toFixed(1)}L`}
          subtext="Settled invoice amount"
          icon="bx-credit-card"
          iconBgClass="bg-emerald-50 border-emerald-100"
          iconColorClass="text-emerald-600"
        />
        <StatsCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlines}
          subtext="Due within 7 days"
          href="/architect/calendar"
          icon="bx-calendar-exclamation"
          iconBgClass="bg-rose-50 border-rose-100"
          iconColorClass="text-rose-600"
        />
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
                      <StatusBadge status={p.status} />
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
