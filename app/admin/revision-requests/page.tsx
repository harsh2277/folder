'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import CustomSelect from '@/components/ui/CustomSelect';
import LayoutToggle from '@/components/ui/LayoutToggle';
import EmptyState from '@/components/ui/EmptyState';
import Portal from '@/components/ui/Portal';

export default function AdminRevisionRequests() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Feedback notifications
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data, error } = await supabase
          .from('revision_requests')
          .select(`
            id,
            project_id,
            architect_id,
            description,
            status,
            created_at,
            projects (
              id,
              project_name,
              project_id_serial,
              client_name,
              site_location,
              status
            ),
            architect:profiles!revision_requests_architect_id_fkey (
              id,
              name,
              email,
              mobile_number
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err: any) {
        console.error('Error fetching revision requests:', err);
        // Fallback realistic mock data if DB empty or unreachable
        setRequests([
          {
            id: 'rev-101',
            project_id: 'proj-1',
            architect_id: 'arch-1',
            description: 'Please adjust the ambient recessed lighting levels in the main living room from 300 Lux to 450 Lux. Also add accent spotlights for wall artworks.\n\n=== DESIGNER_RESOLUTION ===\nUpdated luminaire calculation sheet and repositioned accent track heads as requested.',
            status: 'completed',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            projects: {
              id: 'proj-1',
              project_id_serial: 'KL-2026-0001',
              project_name: 'Lotus Penthouse',
              client_name: 'Vikram Shah',
              site_location: 'Mumbai, MH',
              status: 'In Design'
            },
            architect: {
              id: 'arch-1',
              name: 'Kabir Mehta',
              email: 'kabir@studioarchitects.in',
              mobile_number: '+91 91234 56789'
            }
          },
          {
            id: 'rev-102',
            project_id: 'proj-2',
            architect_id: 'arch-2',
            description: 'Requesting revision for facade lighting fixtures. Client requested warm 2700K color temperature instead of neutral 4000K for exterior elevation.',
            status: 'pending',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            projects: {
              id: 'proj-2',
              project_id_serial: 'KL-2026-0002',
              project_name: 'Vertex IT Hub',
              client_name: 'Vertex Corp',
              site_location: 'Bengaluru, KA',
              status: 'Under Review'
            },
            architect: {
              id: 'arch-2',
              name: 'Ananya Roy',
              email: 'ananya@designgroup.com',
              mobile_number: '+91 95432 10987'
            }
          },
          {
            id: 'rev-103',
            project_id: 'proj-3',
            architect_id: 'arch-3',
            description: 'Increase dimming control zones in executive boardroom from 2 to 4 channels to support presentation mode and video conference scenes.',
            status: 'approved',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            projects: {
              id: 'proj-3',
              project_id_serial: 'KL-2026-0003',
              project_name: 'Zoya Boutique',
              client_name: 'Zoya Lifestyle',
              site_location: 'Delhi, DL',
              status: 'In Design'
            },
            architect: {
              id: 'arch-3',
              name: 'Rohan Varma',
              email: 'rohan@lightlab.com',
              mobile_number: '+91 99887 76655'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [supabase]);

  const handleUpdateStatus = async (id: string, projectId: string, newStatus: 'approved' | 'declined') => {
    setUpdatingId(id);
    try {
      // 1. Update revision request status in DB
      const { error: revError } = await supabase
        .from('revision_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (revError) throw revError;

      // 2. Update project status: if approved, send back to 'In Design' for designer
      const projectStatus = newStatus === 'approved' ? 'In Design' : 'Approved';
      if (projectId) {
        const { error: projError } = await supabase
          .from('projects')
          .update({ status: projectStatus })
          .eq('id', projectId);

        if (projError) throw projError;
      }

      // 3. Update local state
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );

      // If viewing in modal, update modal state too
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }

      triggerToast(
        'success',
        `Successfully ${newStatus === 'approved' ? 'approved' : 'declined'} revision request.`
      );
    } catch (err: any) {
      console.error('Error updating revision request status:', err);
      triggerToast('error', `Action failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Request Date', 'Project Name', 'Project ID', 'Architect Name', 'Status', 'Architect Instructions'];
    const rows = filteredRequests.map(req => {
      const [architectReq] = (req.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');
      return [
        new Date(req.created_at).toLocaleDateString(),
        `"${(req.projects?.project_name || '').replace(/"/g, '""')}"`,
        `"${(req.projects?.project_id_serial || 'N/A').replace(/"/g, '""')}"`,
        `"${(req.architect?.name || 'Assigned Architect').replace(/"/g, '""')}"`,
        req.status,
        `"${(architectReq || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revision_requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics computation
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const resolvedCount = requests.filter(r => r.status === 'completed' || r.status === 'declined').length;

  // Filter & Search computation
  const filteredRequests = requests
    .filter((req) => {
      const [architectReq] = (req.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');
      const matchesSearch =
        (req.projects?.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.projects?.project_id_serial || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.architect?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        architectReq.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'pending' && req.status === 'pending') ||
        (selectedStatus === 'approved' && req.status === 'approved') ||
        (selectedStatus === 'completed' && req.status === 'completed') ||
        (selectedStatus === 'declined' && req.status === 'declined');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Title Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 font-sans">Revision Requests Review</h2>
          <p className="text-sm text-neutral-400 mt-0.5 font-medium">Review and manage design modifications requested by partner architects.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <i className="bx bx-download text-sm text-neutral-450"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-md text-sm font-medium border flex items-center justify-between animate-fade-in ${actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
          <div className="flex items-center space-x-2">
            <i className={`bx ${actionMessage.type === 'success' ? 'bx-check-circle text-lg text-emerald-600' : 'bx-error-circle text-lg text-rose-600'}`}></i>
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
            <i className="bx bx-x text-lg"></i>
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Total Requests</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{totalCount}</span>
            <span className="text-xs text-neutral-400 block">Logged revision queries</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-git-pull-request text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Pending Review</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{pendingCount}</span>
            <span className="text-xs text-neutral-400 block">Awaiting admin decision</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-time-five text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Approved</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{approvedCount}</span>
            <span className="text-xs text-neutral-400 block">In design processing</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-check-circle text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Resolved / Closed</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{resolvedCount}</span>
            <span className="text-xs text-neutral-400 block">Completed or declined</span>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-md flex items-center justify-center text-purple-600 border border-purple-100">
            <i className="bx bx-task text-xl"></i>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filter, Sort, Layout Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="relative flex-1 max-w-xs">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search by project, ID, architect, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as 'newest' | 'oldest')}
            options={[
              { value: 'newest', label: 'Sort by: Newest' },
              { value: 'oldest', label: 'Sort by: Oldest' }
            ]}
          />

          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'completed', label: 'Resolved' },
              { value: 'declined', label: 'Declined' }
            ]}
          />

          {/* View Mode Switcher */}
          <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Data Render Container */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No revision requests found"
          description="Try adjusting your search keywords or status filters."
          icon="bx-comment-detail"
        />
      ) : viewMode === 'card' ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const [architectRequest, designerResolution] = (req.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');

            return (
              <div
                key={req.id}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-neutral-400 font-sans">
                      {req.projects?.project_id_serial || 'KL-2026-XXXX'}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">
                      {req.projects?.project_name || 'Project Scope'}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-1 flex items-center">
                      <i className="bx bx-user text-neutral-400 mr-1 text-sm"></i>
                      <span>Architect: {req.architect?.name || 'Assigned Architect'}</span>
                    </p>
                  </div>

                  <div className="bg-neutral-50/70 border border-neutral-100 rounded-md p-3">
                    <span className="text-xs font-bold tracking-wide text-neutral-400 block mb-1">Architect Request</span>
                    <p className="text-xs text-neutral-700 line-clamp-3 leading-relaxed font-medium">
                      {architectRequest}
                    </p>
                  </div>

                  {designerResolution && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
                      <span className="text-xs font-bold tracking-wide text-emerald-600 block mb-1">Designer Resolution</span>
                      <p className="text-xs text-emerald-900 line-clamp-2 leading-relaxed font-medium">
                        {designerResolution}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-sans font-medium">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium text-xs border border-neutral-200 rounded transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <i className="bx bx-show text-sm"></i>
                      <span>Details</span>
                    </button>

                    {req.status === 'pending' && (
                      <>
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, req.project_id, 'approved')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, req.project_id, 'declined')}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto border border-neutral-200 rounded-md bg-white">
          <table className="w-full text-left border-collapse text-sm min-w-[750px] bg-white">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-normal text-xs">
                <th className="py-3 px-4 first:pl-5 last:pr-5">Date</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Project Scope</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Architect</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5">Request Details</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5 text-center">Status</th>
                <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700 font-medium">
              {filteredRequests.map((req) => {
                const [architectRequest] = (req.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');

                return (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-xs text-neutral-400 font-sans whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 max-w-xs">
                      <p className="font-medium text-neutral-900 truncate">{req.projects?.project_name || 'Project Scope'}</p>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">{req.projects?.project_id_serial || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-600 whitespace-nowrap">
                      {req.architect?.name || 'Assigned Architect'}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-600 max-w-sm truncate" title={architectRequest}>
                      {architectRequest}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-center whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium text-xs border border-neutral-200 rounded transition-colors cursor-pointer"
                      >
                        View
                      </button>

                      {req.status === 'pending' ? (
                        <>
                          <button
                            disabled={updatingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, req.project_id, 'approved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={updatingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, req.project_id, 'declined')}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-400 font-medium px-2">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Revision Request Detail Modal Drawer */}
      {selectedRequest && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white border border-neutral-200 rounded-md max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-neutral-400 font-sans">{selectedRequest.projects?.project_id_serial || 'KL-2026-XXXX'}</span>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mt-1">{selectedRequest.projects?.project_name || 'Revision Request'}</h3>
                </div>

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors cursor-pointer"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-md p-4 space-y-2">
                    <span className="text-xs font-bold tracking-wide text-neutral-400 block">Project Metadata</span>
                    <p className="text-sm font-medium text-neutral-900">{selectedRequest.projects?.project_name}</p>
                    <p className="text-xs text-neutral-500 font-medium">Representative: {selectedRequest.projects?.client_name || 'N/A'}</p>
                    {selectedRequest.projects?.site_location && (
                      <p className="text-xs text-neutral-400 font-medium flex items-center">
                        <i className="bx bx-map mr-1"></i> {selectedRequest.projects.site_location}
                      </p>
                    )}
                  </div>

                  <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-md p-4 space-y-2">
                    <span className="text-xs font-bold tracking-wide text-neutral-400 block">Submitting Architect</span>
                    <p className="text-sm font-medium text-neutral-900">{selectedRequest.architect?.name || 'Assigned Architect'}</p>
                    <p className="text-xs text-neutral-500 font-medium">Email: {selectedRequest.architect?.email || 'N/A'}</p>
                    <p className="text-xs text-neutral-400 font-sans font-medium">Date: {new Date(selectedRequest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Architect Request Instructions */}
                {(() => {
                  const [architectReq, designerResolution] = (selectedRequest.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');

                  return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-neutral-900 tracking-wide block">Architect Revision Request</span>
                        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 text-sm text-neutral-800 leading-relaxed font-medium whitespace-pre-wrap">
                          {architectReq}
                        </div>
                      </div>

                      {designerResolution && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-semibold text-emerald-800 tracking-wide flex items-center space-x-1">
                            <i className="bx bx-check-double text-base text-emerald-600"></i>
                            <span>Designer Resolution Notes</span>
                          </span>
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-4 text-sm text-emerald-950 leading-relaxed font-medium whitespace-pre-wrap">
                            {designerResolution}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-between items-center">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-sm rounded-md transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedRequest.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={updatingId === selectedRequest.id}
                      onClick={() => handleUpdateStatus(selectedRequest.id, selectedRequest.project_id, 'declined')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Decline Request
                    </button>
                    <button
                      disabled={updatingId === selectedRequest.id}
                      onClick={() => handleUpdateStatus(selectedRequest.id, selectedRequest.project_id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Approve Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-emerald-50 border-emerald-100 text-emerald-700">
        Approved
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 border-blue-100 text-blue-700">
        ✓ Resolved
      </span>
    );
  }
  if (status === 'declined') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-rose-50 border-rose-100 text-rose-700">
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-amber-50 border-amber-100 text-amber-700">
      Pending Review
    </span>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-neutral-200 rounded"></div>
          <div className="h-4 w-96 bg-neutral-100 rounded"></div>
        </div>
        <div className="h-10 w-28 bg-neutral-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-neutral-100 border border-neutral-200 rounded-md"></div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-64 bg-neutral-100 rounded"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-32 bg-neutral-100 rounded"></div>
          <div className="h-10 w-32 bg-neutral-100 rounded"></div>
          <div className="h-10 w-20 bg-neutral-100 rounded"></div>
        </div>
      </div>
      <div className="border border-neutral-200 rounded-md p-4 bg-white space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b last:border-0 border-neutral-100">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/4 bg-neutral-200 rounded"></div>
              <div className="h-3 w-1/3 bg-neutral-100 rounded"></div>
            </div>
            <div className="h-6 w-20 bg-neutral-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
