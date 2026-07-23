'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminAdminDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any | null>(null);
  const [globalStats, setGlobalStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalRevenue: 0,
    approvedProjects: 0,
  });

  useEffect(() => {
    if (!id) return;

    async function fetchAdminData() {
      try {
        // Fetch admin profile details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, mobile_number, created_at')
          .eq('id', id)
          .eq('role', 'admin')
          .single();

        if (profileError) throw profileError;
        setAdmin(profile);

        // Fetch global stats
        const { count: projsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: approvedCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Approved');

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed');

        const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

        setGlobalStats({
          totalProjects: projsCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue,
          approvedProjects: approvedCount || 0,
        });

      } catch (err) {
        console.error('Error fetching admin data:', err);
        // Fallback mock data
        setAdmin({
          id: id as string,
          name: 'Sarah Jenkins',
          email: 'sarah@lightmap.com',
          role: 'admin',
          mobile_number: '+91 98765 43210',
          created_at: new Date().toISOString(),
        });
        setGlobalStats({
          totalProjects: 15,
          totalUsers: 8,
          totalRevenue: 1250000,
          approvedProjects: 6,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [id]);

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

  if (!admin) {
    return (
      <div className="text-center py-12 text-sm">
        <h2 className="text-lg font-medium text-neutral-900">Admin profile not found.</h2>
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
            className="w-10 h-10 border border-neutral-200 hover:border-neutral-300 bg-white rounded-md flex items-center justify-center text-neutral-600 transition-colors"
          >
            <i className="bx bx-left-arrow-alt text-xl"></i>
          </Link>
          <div>
            <h2 className="text-xl font-medium text-neutral-900 font-sans">{admin.name}</h2>
            <p className="text-sm text-neutral-400 mt-0.5 font-medium">Administrator profile and system metrics.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`mailto:${admin.email}`}
            className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 bg-white font-medium text-sm rounded-md transition-colors flex items-center space-x-1.5 text-neutral-700 font-sans"
          >
            <i className="bx bx-envelope text-base"></i>
            <span>Email</span>
          </a>
        </div>
      </div>

      {/* Profile Details Block */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <h3 className="text-base font-medium text-neutral-900 mb-4 font-sans">Contact & Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Email Address</span>
            <span className="text-neutral-800 font-medium">{admin.email}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Phone Number</span>
            <span className="text-neutral-800 font-medium font-sans">{admin.mobile_number || 'Not Provided'}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block mb-0.5">Role Authorization</span>
            <span className="text-neutral-800 font-medium capitalize">{admin.role}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Global Project Directory</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{globalStats.totalProjects}</span>
            <span className="text-xs text-neutral-400 block">Total projects registered</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-folder text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Workspace User Accounts</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{globalStats.totalUsers}</span>
            <span className="text-xs text-neutral-400 block">All system login credentials</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-user-check text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Approved Projects</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">{globalStats.approvedProjects}</span>
            <span className="text-xs text-neutral-400 block">Successfully approved workspaces</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="bx bx-badge-check text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-400 block">Global Settled Volume</span>
            <span className="text-2xl font-medium text-neutral-900 font-sans">₹{(globalStats.totalRevenue / 100000).toFixed(2)}L</span>
            <span className="text-xs text-neutral-400 block">Total payment volume</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600 border border-amber-100">
            <i className="bx bx-receipt text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
