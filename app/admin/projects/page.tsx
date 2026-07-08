'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminProjectsList() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

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

  const filteredProjects = selectedStatus === 'All'
    ? projects
    : projects.filter((p) => p.status === selectedStatus);

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
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Project Directory</h2>
          <p className="text-sm text-neutral-500 mt-1">Review onboarding questionnaires, assign designers, and update statuses.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              selectedStatus === status
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            No projects found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Area (Sq Ft)</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Workflow Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {filteredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-neutral-900">
                      {proj.project_id_serial || 'Generating...'}
                    </td>
                    <td className="p-4 font-bold text-neutral-900">{proj.project_name}</td>
                    <td className="p-4">{proj.client_name}</td>
                    <td className="p-4">{Number(proj.area_sq_ft).toLocaleString()} sq ft</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        proj.payment_status === 'paid'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : proj.payment_status === 'failed'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      }`}>
                        {proj.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {proj.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-neutral-500">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/projects/${proj.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-100 hover:bg-amber-50 hover:text-amber-700 text-neutral-700 font-semibold text-xs border border-neutral-200 hover:border-amber-200 rounded-md transition-colors"
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
