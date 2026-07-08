'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminProjectsList() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        // Fallback mock data in case of DB connection issues
        setProjects([
          { id: '1', project_id_serial: 'KL-2025-0001', project_name: 'Lotus Penthouse', client_name: 'Vikram Shah', area_sq_ft: 1800, payment_status: 'paid', status: 'In Design', created_at: new Date().toISOString() },
          { id: '2', project_id_serial: 'KL-2025-0002', project_name: 'Vertex IT Hub', client_name: 'Vertex Corp', area_sq_ft: 12500, payment_status: 'pending', status: 'Under Review', created_at: new Date().toISOString() },
          { id: '3', project_id_serial: 'KL-2025-0003', project_name: 'Zoya Boutique', client_name: 'Zoya Lifestyle', area_sq_ft: 2200, payment_status: 'paid', status: 'Submitted', created_at: new Date().toISOString() },
          { id: '4', project_id_serial: 'KL-2025-0004', project_name: 'Orion Workspace', client_name: 'Orion Enterprises', area_sq_ft: 8500, payment_status: 'paid', status: 'Approved', created_at: new Date().toISOString() },
          { id: '5', project_id_serial: 'KL-2025-0005', project_name: 'Azure Residences', client_name: 'BlueWave Developments', area_sq_ft: 4500, payment_status: 'failed', status: 'Payment Pending', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [supabase]);

  const statuses = [
    'All', 'Submitted', 'Payment Pending', 'Under Review', 'In Design', 
    'Ready for Client Review', 'Revision Requested', 'Approved', 'Closed'
  ];

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.project_id_serial && p.project_id_serial.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'area-desc') return Number(b.area_sq_ft) - Number(a.area_sq_ft);
      if (sortBy === 'area-asc') return Number(a.area_sq_ft) - Number(b.area_sq_ft);
      return 0;
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
    <div className="space-y-4">
      {/* Title block */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Project Directory</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Review onboarding questionnaires, assign designers, and update statuses.</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 pb-3">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by ID, name, or representative..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-bold text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="area-desc">Area: High to Low</option>
              <option value="area-asc">Area: Low to High</option>
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

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-50 pb-4">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                selectedStatus === status
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Projects List Render Area */}
        <div className="mt-4">
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No projects found matching the criteria.
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
                      <span className="font-mono text-xs font-bold text-neutral-400">
                        {proj.project_id_serial || 'KL-2025-XXXX'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        proj.status === 'Approved' || proj.status === 'Closed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : proj.status === 'In Design'
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          : proj.status === 'Under Review'
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{proj.project_name}</h3>
                    <p className="text-xs text-neutral-500 font-medium">Representative: {proj.client_name}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-50 space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-500">
                      <span>Total Area</span>
                      <span className="font-sans text-neutral-800">{Number(proj.area_sq_ft).toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-500">
                      <span>Payment</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        proj.payment_status === 'paid'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : proj.payment_status === 'failed'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {proj.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-neutral-400 font-sans font-medium">
                        {new Date(proj.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/admin/projects/${proj.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-bold text-xs border border-neutral-200 rounded-md transition-colors"
                      >
                        Manage
                      </Link>
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
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Project ID</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Client Representative</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Total Area</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Payment</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Workflow Status</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5">Created Date</th>
                    <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700 font-semibold">
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-mono text-xs font-semibold text-neutral-900">
                        {proj.project_id_serial || 'Generating...'}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-bold text-neutral-900">{proj.project_name}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-medium">{proj.client_name}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-400 font-sans">{Number(proj.area_sq_ft).toLocaleString()} sq ft</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold border ${
                          proj.payment_status === 'paid'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : proj.payment_status === 'failed'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {proj.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-bold border ${
                          proj.status === 'Approved' || proj.status === 'Closed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : proj.status === 'In Design'
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : proj.status === 'Under Review'
                            ? 'bg-blue-50 border-blue-100 text-blue-700'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-xs text-neutral-400 font-medium font-sans">
                        {new Date(proj.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                        <Link
                          href={`/admin/projects/${proj.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-bold text-xs border border-neutral-200 rounded-md transition-colors"
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
    </div>
  );
}
