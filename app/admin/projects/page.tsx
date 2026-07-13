'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '../../../components/ui/EmptyState';
import CustomSelect from '../../../components/ui/CustomSelect';
import LayoutToggle from '../../../components/ui/LayoutToggle';

export default function AdminProjectsList() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [architects, setArchitects] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedArchitectId, setSelectedArchitectId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at, architect_id, profiles!projects_architect_id_fkey(id, name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        // Fallback mock data in case of DB connection issues
        setProjects([
          { id: '1', project_id_serial: 'KL-2025-0001', project_name: 'Lotus Penthouse', client_name: 'Vikram Shah', area_sq_ft: 1800, payment_status: 'paid', status: 'In Design', site_location: 'Mumbai, MH', created_at: new Date().toISOString() },
          { id: '2', project_id_serial: 'KL-2025-0002', project_name: 'Vertex IT Hub', client_name: 'Vertex Corp', area_sq_ft: 12500, payment_status: 'pending', status: 'Under Review', site_location: 'Bengaluru, KA', created_at: new Date().toISOString() },
          { id: '3', project_id_serial: 'KL-2025-0003', project_name: 'Zoya Boutique', client_name: 'Zoya Lifestyle', area_sq_ft: 2200, payment_status: 'paid', status: 'Submitted', site_location: 'Delhi, DL', created_at: new Date().toISOString() },
          { id: '4', project_id_serial: 'KL-2025-0004', project_name: 'Orion Workspace', client_name: 'Orion Enterprises', area_sq_ft: 8500, payment_status: 'paid', status: 'Approved', site_location: 'Pune, MH', created_at: new Date().toISOString() },
          { id: '5', project_id_serial: 'KL-2025-0005', project_name: 'Azure Residences', client_name: 'BlueWave Developments', area_sq_ft: 4500, payment_status: 'failed', status: 'Payment Pending', site_location: 'Goa, GA', created_at: new Date().toISOString() }
        ]);
      }
    }

    async function fetchArchitects() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'architect')
          .order('name', { ascending: true });
        if (error) throw error;
        setArchitects(data || []);
      } catch (err) {
        console.error('Error fetching architects:', err);
      }
    }

    async function loadData() {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchArchitects()]);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    setProjectToDelete(id);
    setShowConfirm(true);
    return; // exit early, modal will handle deletion
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Project Name', 'Client Name', 'Location', 'Area (sq ft)', 'Payment Status', 'Workflow Status', 'Created Date'];
      const rows = filteredProjects.map(proj => [
        `"${proj.project_name.replace(/"/g, '""')}"`,
        `"${proj.client_name.replace(/"/g, '""')}"`,
        `"${(proj.site_location || 'N/A').replace(/"/g, '""')}"`,
        proj.area_sq_ft,
        proj.payment_status,
        proj.status,
        new Date(proj.created_at).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      window.print();
    }
  };

  const statuses = [
    'All', 'Submitted', 'Payment Pending', 'Under Review', 'In Design',
    'Ready for Client Review', 'Revision Requested', 'Approved', 'Closed'
  ];

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.project_id_serial && p.project_id_serial.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.profiles?.name && p.profiles.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesArchitect = selectedArchitectId === 'All' || p.architect_id === selectedArchitectId;
      return matchesSearch && matchesStatus && matchesArchitect;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'area-desc') return Number(b.area_sq_ft) - Number(a.area_sq_ft);
      if (sortBy === 'area-asc') return Number(a.area_sq_ft) - Number(b.area_sq_ft);
      return 0;
    });

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-xl font-medium text-neutral-900 font-sans">Project Directory</h2>
          <p className="text-sm text-neutral-400 mt-0.5">Review onboarding questionnaires, assign designers, and update statuses.</p>
        </div>

        {/* Export Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-sm font-medium transition-all flex items-center space-x-2 cursor-pointer"
            aria-label="Export options"
          >
            <i className="bx bx-download text-sm"></i>
            <span>Export</span>
            <i className="bx bx-chevron-down text-sm"></i>
          </button>

          {showExportDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportDropdown(false)}
              />
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-neutral-200 rounded-md py-1 z-20">
                <button
                  onClick={() => {
                    handleExport('csv');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <i className="bx bx-file text-sm text-neutral-400"></i>
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => {
                    handleExport('pdf');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <i className="bx bxs-file-pdf text-sm text-neutral-400"></i>
                  <span>Export as PDF</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Block */}
      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="relative flex-1 max-w-xs">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search by ID, name, or representative..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: 'Sort by: Newest' },
              { value: 'area-desc', label: 'Area: High to Low' },
              { value: 'area-asc', label: 'Area: Low to High' }
            ]}
          />

          <CustomSelect
            value={selectedArchitectId}
            onChange={setSelectedArchitectId}
            options={[
              { value: 'All', label: 'All Architects' },
              ...architects.map(a => ({ value: a.id, label: a.name }))
            ]}
          />

          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-1.5 cursor-pointer ${selectedStatus !== 'All' ? 'border-amber-500 text-amber-600 bg-amber-50/20' : ''}`}
              aria-label="Filter projects"
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
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-neutral-200 rounded-md py-1 z-20">
                  <div className="px-3 py-1.5 text-sm font-medium text-neutral-400 border-b border-neutral-50">
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
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${selectedStatus === status ? 'bg-amber-50 text-amber-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50' }`}
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

          {/* View Layout Toggle */}
          <LayoutToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Projects List Render Area */}
      <div className="mt-4">
        {filteredProjects.length === 0 ? (
          <EmptyState title="No projects found" description="Try adjusting your filters or search query." />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover: transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-neutral-400">
                      {proj.project_id_serial || 'KL-2025-XXXX'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${proj.status === 'Approved' || proj.status === 'Closed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : proj.status === 'In Design' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : proj.status === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-neutral-50 border-neutral-200 text-neutral-600' }`}>
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">{proj.project_name}</h3>
                  <p className="text-sm text-neutral-500 font-medium">Representative: {proj.client_name}</p>
                  {proj.site_location && (
                    <p className="text-sm text-neutral-400 font-medium flex items-center mt-1">
                      <i className="bx bx-map mr-1 text-sm text-neutral-500"></i> {proj.site_location}
                    </p>
                  )}
                  {proj.profiles?.name ? (
                    <p className="text-sm text-neutral-400 font-medium flex items-center mt-1">
                      <i className="bx bx-buildings mr-1 text-sm text-neutral-500"></i>
                      <span>Architect:{' '}</span>
                      <Link
                        href={`/admin/architects/${proj.architect_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-600 hover:underline ml-1"
                      >
                        {proj.profiles.name}
                      </Link>
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400 font-medium flex items-center mt-1">
                      <i className="bx bx-buildings mr-1 text-sm text-neutral-500"></i>
                      <span>Architect: Unassigned</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-50 space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                    <span>Total Area</span>
                    <span className="font-sans text-neutral-855">{Number(proj.area_sq_ft).toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                    <span>Payment</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${proj.payment_status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : proj.payment_status === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700' }`}>
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
                        className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm border border-rose-200 rounded-md transition-colors cursor-pointer"
                        aria-label={`Delete project ${proj.project_name}`}
                      >
                        Delete
                      </button>
                      <Link
                        href={`/admin/projects/${proj.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-medium text-sm border border-neutral-200 rounded-md transition-colors"
                        aria-label={`Manage project ${proj.project_name}`}
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto mt-3 border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-450 font-normal text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Location</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Architect</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Total Area</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Payment</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Workflow Status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Created Date</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
                {filteredProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/admin/projects/${proj.id}`)}
                    className="hover:bg-neutral-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-900 font-medium">{proj.project_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-550">{proj.client_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-medium">{proj.site_location || 'N/A'}</td>
                    <td
                      className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-600 font-medium"
                      onClick={(e) => {
                        if (proj.architect_id) {
                          e.stopPropagation();
                          router.push(`/admin/architects/${proj.architect_id}`);
                        }
                      }}
                    >
                      {proj.profiles?.name ? (
                        <span className="text-amber-600 hover:underline">{proj.profiles.name}</span>
                      ) : (
                        <span className="text-neutral-450">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-sans">{Number(proj.area_sq_ft).toLocaleString()} sq ft</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${proj.payment_status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : proj.payment_status === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700' }`}>
                        {proj.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${proj.status === 'Approved' || proj.status === 'Closed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : proj.status === 'In Design' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : proj.status === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-neutral-50 border-neutral-200 text-neutral-600' }`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-sm text-neutral-400 font-medium font-sans">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proj.id);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm border border-rose-200 rounded-md transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/admin/projects/${proj.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-medium text-sm border border-neutral-200 rounded-md transition-colors"
                        >
                          Manage
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

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={async () => {
          if (projectToDelete) {
            try {
              const { error } = await supabase.from('projects').delete().eq('id', projectToDelete);
              if (error) throw error;
              setProjects(prev => prev.filter(p => p.id !== projectToDelete));
            } catch (err) {
              console.error('Error deleting project:', err);
              alert('Failed to delete project.');
            }
          }
          setShowConfirm(false);
          setProjectToDelete(null);
        }}
        onClose={() => { setShowConfirm(false); setProjectToDelete(null); }}
      />
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-200 rounded"></div>
          <div className="h-4 w-80 bg-neutral-100 rounded"></div>
        </div>
        <div className="h-10 w-24 bg-neutral-200 rounded"></div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-64 bg-neutral-100 rounded"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-32 bg-neutral-100 rounded"></div>
          <div className="h-10 w-32 bg-neutral-100 rounded"></div>
          <div className="h-10 w-20 bg-neutral-100 rounded"></div>
        </div>
      </div>
      <div className="border border-neutral-100 rounded-md p-4 bg-white space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-neutral-50">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/4 bg-neutral-200 rounded"></div>
              <div className="h-3 w-1/6 bg-neutral-100 rounded"></div>
            </div>
            <div className="h-4 w-20 bg-neutral-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
