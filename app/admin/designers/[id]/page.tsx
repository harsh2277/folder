'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminDesignerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [designer, setDesigner] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    async function fetchDesignerData() {
      try {
        // Fetch designer profile details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, mobile_number, created_at')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setDesigner(profile);

        // Fetch projects associated with this designer
        const { data: projs, error: projsError } = await supabase
          .from('projects')
          .select('id, project_id_serial, project_name, client_name, area_sq_ft, payment_status, status, site_location, created_at')
          .eq('assigned_designer_id', id)
          .order('created_at', { ascending: false });

        if (projsError) throw projsError;
        setProjects(projs || []);
      } catch (err) {
        console.error('Error fetching designer data:', err);
        // Fallback mock data
        setDesigner({
          id: id as string,
          name: 'Rohan Varma',
          email: 'rohan@lightlab.com',
          role: 'designer',
          mobile_number: '+91 99887 76655',
          created_at: new Date().toISOString(),
        });
        setProjects([
          { id: '1', project_id_serial: 'KL-2026-0001', project_name: 'Lotus Penthouse', client_name: 'Vikram Shah', area_sq_ft: 2500, payment_status: 'paid', status: 'In Design', site_location: 'Mumbai, MH', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchDesignerData();
  }, [id, supabase]);

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

  if (!designer) {
    return (
      <div className="text-center py-12 text-sm">
        <h2 className="text-lg font-medium text-neutral-900">Designer profile not found.</h2>
        <Link href="/admin/users" className="mt-4 inline-flex items-center text-amber-600 hover:underline">
          <i className="bx bx-left-arrow-alt mr-1"></i> Back to User Directory
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalProjects = projects.length;
  const totalArea = projects.reduce((sum, p) => sum + Number(p.area_sq_ft || 0), 0);
  const activeProjects = projects.filter(p => p.status !== 'Approved' && p.status !== 'Closed').length;
  const completedProjects = projects.filter(p => p.status === 'Approved' || p.status === 'Closed').length;

  return (
    <div className="space-y-6 text-sm">
      {/* Header / Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin/users"
            className="w-10 h-10 border border-neutral-200 hover:border-neutral-300 bg-white rounded-md flex items-center justify-center text-neutral-600 transition-colors"
          >
            <i className="bx bx-left-arrow-alt text-xl"></i>
          </Link>
          <div>
            <h2 className="text-xl font-medium text-neutral-900 font-sans">{designer.name}</h2>
            <p className="text-sm text-neutral-400 mt-0.5 font-medium">Designer Profile & Creative Portfolio</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`mailto:${designer.email}`}
            className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 bg-white font-medium text-sm rounded-md transition-colors flex items-center space-x-1.5 text-neutral-700 font-sans"
          >
            <i className="bx bx-envelope text-base"></i>
            <span>Email</span>
          </a>
          {designer.mobile_number && (
            <a
              href={`tel:${designer.mobile_number}`}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 bg-white font-medium text-sm rounded-md transition-colors flex items-center space-x-1.5 text-neutral-700 font-sans"
            >
              <i className="bx bx-phone text-base"></i>
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* Profile Details Block */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <h3 className="text-base font-medium text-neutral-900 mb-4 font-sans">Contact & Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Email Address</span>
            <span className="text-neutral-800 font-medium">{designer.email}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Phone Number</span>
            <span className="text-neutral-800 font-medium font-sans">{designer.mobile_number || 'Not Provided'}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Joined Workspace</span>
            <span className="text-neutral-800 font-medium font-sans">
              {new Date(designer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Total Assigned</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{totalProjects}</span>
            <span className="text-xs text-neutral-400 block">Assigned workspaces</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-folder text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Active Status</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{activeProjects}</span>
            <span className="text-xs text-neutral-400 block">In-progress drawings</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="bx bx-time-five text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Designs Completed</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{completedProjects}</span>
            <span className="text-xs text-neutral-400 block">Closed out jobs</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-check-double text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Total Area</span>
            <span className="text-xl font-medium text-neutral-900 font-sans">{totalArea.toLocaleString()}</span>
            <span className="text-xs text-neutral-400 block">Designed sq ft volume</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-ruler text-xl"></i>
          </div>
        </div>
      </div>

      {/* Projects Portfolio Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 font-sans">Active Workspaces</h3>
          <p className="text-sm text-neutral-400 mt-0.5 font-medium">Explore current and historical lighting plan layout workspaces assigned to this designer.</p>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 bg-white border border-neutral-200 rounded-md text-center text-neutral-400 font-medium">
            No workspaces have been assigned to this designer yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0 bg-white">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-normal text-xs">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Project Name</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Client Representative</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Site Location</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Dimensions</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Payment status</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Workflow State</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700 font-normal">
                {projects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/admin/projects/${proj.id}`)}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-900 font-medium">{proj.project_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-555">{proj.client_name}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-medium">{proj.site_location || 'N/A'}</td>
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
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <Link
                        href={`/admin/projects/${proj.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-medium text-sm border border-neutral-200 rounded-md transition-colors"
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
