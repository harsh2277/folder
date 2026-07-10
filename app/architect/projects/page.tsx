'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ArchitectProjectsList() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at, project_notes')
          .eq('architect_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([
          { id: '1', project_id_serial: 'KL-2025-0001', project_name: 'Luxury Residence', client_name: 'Amit Patel', area_sq_ft: 3500, payment_status: 'paid', status: 'In Design', site_location: 'Mumbai, MH', created_at: new Date().toISOString() },
          { id: '2', project_id_serial: 'KL-2025-0002', project_name: 'Corporate Office', client_name: 'Rajesh Mehta', area_sq_ft: 8500, payment_status: 'pending', status: 'Submitted', site_location: 'Bengaluru, KA', created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? All associated payments, comments, and files will be permanently deleted.')) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project.');
      }
    }
  };

  const statuses = [
    'All', 'Submitted', 'Payment Pending', 'Under Review', 'In Design',
    'Ready for Client Review', 'Revision Requested', 'Approved', 'Closed'
  ];

  const filteredProjects = projects
    .filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        p.project_name.toLowerCase().includes(query) ||
        p.client_name.toLowerCase().includes(query) ||
        (p.project_id_serial && p.project_id_serial.toLowerCase().includes(query));
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'area-desc') return Number(b.area_sq_ft) - Number(a.area_sq_ft);
      if (sortBy === 'area-asc') return Number(a.area_sq_ft) - Number(b.area_sq_ft);
      return 0;
    });

  const getStatusBadge = (status: string) => {
    if (status === 'Approved' || status === 'Closed') return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (status === 'In Design') return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    if (status === 'Under Review') return 'bg-blue-50 border-blue-100 text-blue-700';
    if (status === 'Revision Requested') return 'bg-rose-50 border-rose-100 text-rose-700';
    if (status === 'Submitted') return 'bg-amber-50 border-amber-100 text-amber-700';
    return 'bg-neutral-50 border-neutral-200 text-neutral-600';
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (status === 'failed') return 'bg-rose-50 border-rose-100 text-rose-700';
    return 'bg-amber-50 border-amber-100 text-amber-700';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-sans">My Projects</h2>
          <p className="text-sm text-neutral-400 mt-0.5">Submit new project designs, view deliverables, and track current statuses.</p>
        </div>
        <Link
          href="/architect/projects/create"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-semibold transition-all flex items-center space-x-2 shadow-sm"
        >
          <i className="bx bx-plus text-sm"></i>
          <span>Add Project</span>
        </Link>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="relative flex-1 max-w-xs">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search by ID, name, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-semibold text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="area-desc">Area: High to Low</option>
            <option value="area-asc">Area: Low to High</option>
          </select>

          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-1.5 cursor-pointer ${selectedStatus !== 'All' ? 'border-amber-500 text-amber-600 bg-amber-50/20' : ''}`}
            >
              <i className="bx bx-filter text-base"></i>
              <span>Filter{selectedStatus !== 'All' ? `: ${selectedStatus}` : ''}</span>
            </button>

            {showFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterDropdown(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20">
                  <div className="px-3 py-1.5 text-sm font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-50">
                    Filter by Status
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${selectedStatus === status
                          ? 'bg-amber-50 text-amber-700 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                      >
                        <span>{status}</span>
                        {selectedStatus === status && <i className="bx bx-check text-sm"></i>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-900'}`}
            >
              <i className="bx bx-list-ul text-sm"></i>
            </button>
            <button
              onClick={() => setViewMode('card')}
              title="Card View"
              className={`p-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'card' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-900'}`}
            >
              <i className="bx bx-grid-alt text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Render Area */}
      <div>
        {filteredProjects.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 rounded-md">
            No projects found. Click &quot;Add Project&quot; to onboard your first design project!
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-semibold text-neutral-400">
                      {proj.project_id_serial || 'Generating ID...'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(proj.status)}`}>
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">{proj.project_name}</h3>
                  <p className="text-sm text-neutral-500 font-medium">Client: {proj.client_name}</p>
                  {proj.site_location && (
                    <p className="text-sm text-neutral-400 font-semibold flex items-center mt-1">
                      <i className="bx bx-map mr-1 text-sm text-neutral-500"></i> {proj.site_location}
                    </p>
                  )}
                  {proj.status === 'Revision Requested' && proj.project_notes && proj.project_notes.startsWith('Rejection Reason:') && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded text-sm text-rose-800 font-medium">
                      <p className="font-semibold uppercase tracking-wider text-xs text-rose-500 mb-0.5">Admin Feedback</p>
                      {proj.project_notes.replace('Rejection Reason:', '').trim()}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-50 space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-semibold text-neutral-500">
                    <span>Total Area</span>
                    <span className="font-sans text-neutral-800">{Number(proj.area_sq_ft).toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-neutral-500">
                    <span>Payment</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPaymentBadge(proj.payment_status)}`}>
                      {proj.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-neutral-400 font-sans font-medium">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200 rounded-md transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                      <Link
                        href={`/architect/projects/${proj.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-sm border border-neutral-200 rounded-md transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-450 font-normal text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Location</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Total Area</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Payment</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Created</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {filteredProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/architect/projects/${proj.id}`)}
                    className="hover:bg-neutral-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{proj.project_name}</p>
                        <p className="text-xs font-mono text-neutral-400 mt-0.5">{proj.project_id_serial || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-550 text-sm">{proj.client_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 text-sm font-medium">{proj.site_location || 'N/A'}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 text-sm font-sans">{Number(proj.area_sq_ft).toLocaleString()} sq ft</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPaymentBadge(proj.payment_status)}`}>
                        {proj.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(proj.status)}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-sm text-neutral-400 font-medium font-sans">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(proj.id); }}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200 rounded-md transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/architect/projects/${proj.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-sm border border-neutral-200 rounded-md transition-colors"
                        >
                          View
                        </Link>
                      </div>
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
