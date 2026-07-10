'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminRevisionRequests() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data, error } = await supabase
          .from('revision_requests')
          .select('*, projects(project_name, project_id_serial), architect:profiles!revision_requests_architect_id_fkey(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching revision requests:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [supabase]);

  const handleUpdateStatus = async (id: string, projectId: string, newStatus: 'approved' | 'declined') => {
    setActionMessage('');
    try {
      // 1. Update revision request status
      const { error: revError } = await supabase
        .from('revision_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (revError) throw revError;

      // 2. Update project status back to 'In Design' or keep it depending on approval
      const projectStatus = newStatus === 'approved' ? 'In Design' : 'Approved';
      const { error: projError } = await supabase
        .from('projects')
        .update({ status: projectStatus })
        .eq('id', projectId);

      if (projError) throw projError;

      // 3. Local update state
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );

      setActionMessage(`Successfully marked request as ${newStatus}!`);

    } catch (err: any) {
      console.error('Error updating revision request status:', err);
      setActionMessage(`Action failed: ${err.message || 'Unknown error'}`);
    }
  };

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="border-b border-neutral-100 pb-6">
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Revision Requests Review</h1>
        <p className="text-sm text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Review and manage design modifications requested by architects</p>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded text-sm font-semibold ${actionMessage.includes('Successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {actionMessage}
        </div>
      )}

      {/* Revision Table */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        {requests.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2">
            <i className="bx bx-comment-detail text-3xl text-neutral-355"></i>
            <p>No revision requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-1/6">Date</th>
                  <th className="py-3 px-4 w-1/5">Project</th>
                  <th className="py-3 px-4 w-1/5">Architect</th>
                  <th className="py-3 px-4">Request Detail</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-semibold">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-semibold text-neutral-400">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-neutral-900">{req.projects?.project_name}</p>
                      <p className="text-sm text-neutral-450 font-mono mt-0.5">{req.projects?.project_id_serial || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">{req.architect?.name || 'Assigned Architect'}</td>
                    <td className="py-4 px-4 text-neutral-750 font-medium leading-relaxed max-w-xs truncate" title={req.description}>
                      {req.description}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold border uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : req.status === 'declined'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, req.project_id, 'approved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white font-semibold text-sm rounded transition-colors uppercase cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, req.project_id, 'declined')}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-750 text-white font-semibold text-sm rounded transition-colors uppercase cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-neutral-450 font-semibold uppercase">Reviewed</span>
                      )}
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
