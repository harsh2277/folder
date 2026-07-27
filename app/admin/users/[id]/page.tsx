'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { SkeletonProfile, StatusBadge, RoleBadge } from '@/components/ui';

export default function UserDetailPage() {
  const { id } = useParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    inProgressProjects: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!id) return;

    async function fetchUserData() {
      try {
        const { data: person, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, mobile_number, created_at')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(person);

        if (person.role === 'architect') {
          const { data: projs } = await supabase
            .from('projects')
            .select('id, project_id_serial, project_name, client_name, status, payment_status, calculated_price, created_at')
            .eq('architect_id', id)
            .order('created_at', { ascending: false });

          const projectList = projs || [];
          setProjects(projectList);

          const projectIds = projectList.map((p: any) => p.id);
          let revenue = 0;
          if (projectIds.length > 0) {
            const { data: payments } = await supabase
              .from('payments')
              .select('amount, project_id')
              .in('project_id', projectIds)
              .eq('status', 'completed');
            revenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          }

          setStats({
            totalProjects: projectList.length,
            approvedProjects: projectList.filter((p: any) => p.status === 'Approved' || p.status === 'Closed').length,
            inProgressProjects: projectList.filter((p: any) => p.status === 'In Design' || p.status === 'Under Review').length,
            revenue,
          });
        } else if (person.role === 'designer') {
          const { data: projs } = await supabase
            .from('projects')
            .select('id, project_id_serial, project_name, client_name, status, payment_status, calculated_price, created_at')
            .eq('assigned_designer_id', id)
            .order('created_at', { ascending: false });

          const projectList = projs || [];
          setProjects(projectList);

          setStats({
            totalProjects: projectList.length,
            approvedProjects: projectList.filter((p: any) => p.status === 'Approved' || p.status === 'Closed').length,
            inProgressProjects: projectList.filter((p: any) => p.status === 'In Design' || p.status === 'Under Review').length,
            revenue: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching user detail:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [id]);

  if (loading) return <SkeletonProfile />;

  if (!profile) {
    return (
      <div className="text-center py-12 text-sm">
        <h2 className="text-lg font-medium text-neutral-900">User not found.</h2>
        <Link href="/admin/users" className="mt-4 inline-flex items-center text-amber-600 hover:underline">
          <i className="bx bx-left-arrow-alt mr-1"></i> Back to User Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Header / Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin/users"
            className="w-10 h-10 border border-neutral-200 hover:border-neutral-300 bg-white rounded-md flex items-center justify-center text-neutral-600 transition-colors flex-shrink-0"
          >
            <i className="bx bx-left-arrow-alt text-xl"></i>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-medium text-neutral-900 font-sans">{profile.name}</h2>
              <RoleBadge role={profile.role} />
            </div>
            <p className="text-sm text-neutral-400 mt-0.5 font-medium">
              {profile.role === 'architect' ? 'Architect partner profile and project history.' : 'Designer profile and assigned project history.'}
            </p>
          </div>
        </div>

        <a
          href={`mailto:${profile.email}`}
          className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 bg-white font-medium text-sm rounded-md transition-colors flex items-center space-x-1.5 text-neutral-700 font-sans"
        >
          <i className="bx bx-envelope text-base"></i>
          <span>Email</span>
        </a>
      </div>

      {/* Profile Details Block */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <h3 className="text-base font-medium text-neutral-900 mb-4 font-sans">Contact & Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Email Address</span>
            <span className="text-neutral-800 font-medium">{profile.email}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Phone Number</span>
            <span className="text-neutral-800 font-medium font-sans">{profile.mobile_number || 'Not Provided'}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Joined</span>
            <span className="text-neutral-800 font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${profile.role === 'architect' ? 'lg:grid-cols-4' : ''} gap-4`}>
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">
              {profile.role === 'architect' ? 'Projects Created' : 'Assigned Projects'}
            </span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{stats.totalProjects}</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-folder text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">In Progress</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{stats.inProgressProjects}</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-loader-circle text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Approved / Closed</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{stats.approvedProjects}</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-badge-check text-xl"></i>
          </div>
        </div>

        {profile.role === 'architect' && (
          <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-400 block">Revenue Generated</span>
              <span className="text-2xl font-medium text-neutral-900 font-sans">₹{(stats.revenue / 100000).toFixed(2)}L</span>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
              <i className="bx bx-receipt text-xl"></i>
            </div>
          </div>
        )}
      </div>

      {/* Project History */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-200">
          <h3 className="text-base font-medium text-neutral-900 font-sans">
            {profile.role === 'architect' ? 'Projects Created' : 'Assigned Projects'}
          </h3>
        </div>
        {projects.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 font-medium">
            <i className="bx bx-folder-open text-3xl block mb-2"></i>
            No projects yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[600px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-normal text-xs">
                  <th className="py-3 px-4 first:pl-5">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 last:pr-5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 first:pl-5 text-neutral-900 font-medium">{p.project_name}</td>
                    <td className="py-3 px-4 text-neutral-500">{p.client_name}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4 last:pr-5 text-neutral-400">{new Date(p.created_at).toLocaleDateString()}</td>
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
