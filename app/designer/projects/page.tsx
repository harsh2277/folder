'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DesignerProjectsList() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch('/api/designer/projects');
        const resData = await res.json();
        if (resData.error) throw new Error(resData.error);
        setProjects(resData.projects || []);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        // Fallback mock data
        setProjects([
          { id: '1', project_id_serial: 'KL-2025-0001', project_name: 'Lotus Penthouse', client_name: 'Vikram Shah', area_sq_ft: 1800, payment_status: 'paid', status: 'In Design', created_at: new Date().toISOString() },
          { id: '2', project_id_serial: 'KL-2025-0002', project_name: 'Vertex IT Hub', client_name: 'Vertex Corp', area_sq_ft: 12500, payment_status: 'pending', status: 'Under Review', created_at: new Date().toISOString() },
          { id: '3', project_id_serial: 'KL-2025-0003', project_name: 'Zoya Boutique', client_name: 'Zoya Lifestyle', area_sq_ft: 2200, payment_status: 'paid', status: 'Submitted', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [supabase]);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setUpdatingId(projectId);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/designer/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: newStatus })
      });
      const resData = await res.json();

      if (resData.error) throw new Error(resData.error);

      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      setSuccessMsg('Project status updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statuses = [
    'All', 'Submitted', 'Payment Pending', 'Under Review', 'In Design', 
    'Ready for Client Review', 'Revision Requested', 'Approved', 'Closed'
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.project_id_serial && p.project_id_serial.toLowerCase().includes(searchQuery.toLowerCase()));
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
    <div className="space-y-4 font-sans">
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-md flex items-center space-x-2">
          <i className="bx bx-check-circle text-lg"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Title block */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Project Design Board</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Filter project layouts, review onboarding requirements, and update design milestones.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors font-semibold"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-bold text-neutral-650 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-hidden mt-4 border border-neutral-100 rounded-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-400 font-normal text-xs uppercase tracking-wider">
                <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Client Representative</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Area (Sq Ft)</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Design Status</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
              {filteredProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-neutral-50/40 transition-colors">
                  <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                    <span className="text-neutral-850">{proj.project_name}</span>
                    <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">{proj.project_id_serial || 'NO-ID'}</span>
                  </td>
                  <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500">{proj.client_name}</td>
                  <td className="py-3.5 px-4 first:pl-5 last:pr-5 font-mono text-neutral-450">{proj.area_sq_ft ? proj.area_sq_ft.toLocaleString() : 'N/A'}</td>
                  <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                    {updatingId === proj.id ? (
                      <span className="text-xs text-neutral-400 font-medium italic">Updating...</span>
                    ) : (
                      <select
                        value={proj.status}
                        onChange={(e) => handleStatusChange(proj.id, e.target.value)}
                        className={`text-xs font-bold border rounded px-2.5 py-1 focus:outline-none cursor-pointer ${
                          proj.status === 'Approved' || proj.status === 'Closed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : proj.status === 'In Design'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Payment Pending">Payment Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="In Design">In Design</option>
                        <option value="Ready for Client Review">Ready for Client Review</option>
                        <option value="Revision Requested">Revision Requested</option>
                        <option value="Approved">Approved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                    <span className="text-xs text-neutral-400 font-medium font-sans">
                      Added: {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 font-medium">
                    No matching projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
