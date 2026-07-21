'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EmptyState from '../../../components/ui/EmptyState';
import LayoutToggle from '../../../components/ui/LayoutToggle';
import CustomSelect from '../../../components/ui/CustomSelect';

import { createClient } from '@/utils/supabase/client';

export default function DesignerProjectsList() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignmentTab, setAssignmentTab] = useState<'mine' | 'all'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  async function fetchProjects() {
    try {
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          setCurrentUserId(user.id);
        }
      } catch (e) {}

      let loadedProjects: any[] = [];
      try {
        const apiUrl = userId ? `/api/designer/projects?userId=${userId}` : '/api/designer/projects';
        const res = await fetch(apiUrl);
        if (res.ok) {
          const resData = await res.json();
          loadedProjects = resData.projects || [];
          if (resData.currentUserId && !userId) {
            setCurrentUserId(resData.currentUserId);
            userId = resData.currentUserId;
          }
        }
      } catch (e) {
        console.warn('API error in designer projects list, falling back:', e);
      }

      // Direct Supabase query fallback
      if (!loadedProjects || loadedProjects.length === 0) {
        const { data: dbProjects } = await supabase
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at, assigned_designer_id')
          .order('created_at', { ascending: false });
        loadedProjects = dbProjects || [];
      }

      setProjects(loadedProjects);
    } catch (err) {
      console.error('Error fetching designer projects:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, [supabase]);

  const statuses = [
    'All', 'Submitted', 'Payment Pending', 'Under Review', 'In Design',
    'Ready for Client Review', 'Revision Requested', 'Approved', 'Closed'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Closed':
        return 'bg-emerald-50 border-emerald-100/50 text-emerald-700';
      case 'In Design':
        return 'bg-indigo-50 border-indigo-100/50 text-indigo-700';
      case 'Ready for Client Review':
      case 'Under Review':
        return 'bg-blue-50 border-blue-100/50 text-blue-700';
      case 'Revision Requested':
        return 'bg-rose-50 border-rose-100/50 text-rose-700';
      case 'Payment Pending':
        return 'bg-amber-50 border-amber-100/50 text-amber-700';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-600';
    }
  };

  const isSameId = (id1: any, id2: any) => {
    if (!id1 || !id2) return false;
    return String(id1).trim().toLowerCase() === String(id2).trim().toLowerCase();
  };

  const myProjectsCount = currentUserId ? projects.filter(p => isSameId(p.assigned_designer_id, currentUserId)).length : 0;

  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (p.project_name || '').toLowerCase().includes(query) ||
      (p.client_name || '').toLowerCase().includes(query) ||
      (p.project_id_serial || '').toLowerCase().includes(query);
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;

    return matchesSearch && matchesStatus;
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
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Project Design Board</h2>
          <p className="text-sm text-neutral-450 mt-0.5">Filter project layouts, review onboarding requirements, and manage active designs.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search by ID, name, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
            />
          </div>
          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses.map(s => ({ value: s, label: s === 'All' ? 'All Statuses' : s }))}
          />
        </div>

        {/* View Mode Toggle */}
        <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Projects Render Area */}
      <div>
        {filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Try adjusting your search query or status filter to find matching design board projects."
          />
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => router.push(`/designer/projects/${proj.id}`)}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-6 bg-white flex flex-col justify-between space-y-4 hover: transition-all duration-300 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-neutral-400">
                      {proj.project_id_serial || 'KL-2025-XXXX'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusBadge(proj.status)}`}>
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                    <Link href={`/designer/projects/${proj.id}`} onClick={(e) => e.stopPropagation()}>
                      {proj.project_name}
                    </Link>
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">Client: {proj.client_name}</p>
                </div>

                <div className="pt-4 border-t border-neutral-100 space-y-3">
                  <div className="flex justify-between items-center text-xs font-medium text-neutral-500">
                    <span>Total Area</span>
                    <span className="text-neutral-805">{Number(proj.area_sq_ft).toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                    <span>Design Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${getStatusBadge(proj.status)}`}>
                      {proj.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-neutral-450 font-medium">
                      Added: {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto border border-neutral-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0 bg-white">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Area (Sq Ft)</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Design Status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Added Date</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {filteredProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/designer/projects/${proj.id}`)}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <Link
                        href={`/designer/projects/${proj.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-neutral-900 font-medium hover:text-amber-600 transition-colors block"
                      >
                        {proj.project_name}
                      </Link>
                      <span className="text-xs text-neutral-450 block mt-0.5">{proj.project_id_serial || 'NO-ID'}</span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 text-sm font-medium">{proj.client_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-550 text-sm">{proj.area_sq_ft ? proj.area_sq_ft.toLocaleString() : 'N/A'}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(proj.status)}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-xs text-neutral-450 font-medium">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/designer/projects/${proj.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors whitespace-nowrap active:scale-[0.98] cursor-pointer"
                      >
                        Manage
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
