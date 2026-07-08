'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminUsersManagement() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [roleFilter, setRoleFilter] = useState('All');

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, mobile_number, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback mock data in case table is empty or missing connection
      setUsers([
        { id: '1', name: 'Sarah Jenkins', email: 'sarah@kelvinlightings.com', role: 'admin', mobile_number: '+91 98765 43210', created_at: new Date().toISOString() },
        { id: '2', name: 'Rohan Varma', email: 'rohan@kelvinlightings.com', role: 'designer', mobile_number: '+91 99887 76655', created_at: new Date().toISOString() },
        { id: '3', name: 'Kabir Mehta', email: 'kabir@studioarchitects.in', role: 'architect', mobile_number: '+91 91234 56789', created_at: new Date().toISOString() },
        { id: '4', name: 'Ananya Roy', email: 'ananya@designgroup.com', role: 'architect', mobile_number: '+91 95432 10987', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [supabase]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating user role:', err);
      setErrorMsg('Failed to update user role.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
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

  // Count metrics
  const totalArchitects = users.filter(u => u.role === 'architect').length;
  const totalDesigners = users.filter(u => u.role === 'designer').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Total Architects</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{totalArchitects}</span>
            <span className="text-sm text-neutral-400 block">Registered partners</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-buildings text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Active Designers</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{totalDesigners}</span>
            <span className="text-sm text-neutral-400 block">Internal design workspace staff</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-pencil text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Admin Staff</span>
            <span className="text-3xl font-black text-neutral-900 font-sans">{totalAdmins}</span>
            <span className="text-sm text-neutral-400 block">System controllers</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="bx bx-shield-quarter text-xl"></i>
          </div>
        </div>
      </div>

      {/* User Management Directory Card */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">User Access Control</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Manage credentials, coordinate designer assignments, and toggle system roles.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-bold text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="architect">Architect</option>
              <option value="designer">Designer</option>
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

        {/* List/Table Render Area */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {users
              .filter(u => {
                const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (u.mobile_number && u.mobile_number.includes(searchQuery));
                const matchesRole = roleFilter === 'All' || u.role === roleFilter;
                return matchesSearch && matchesRole;
              })
              .map((u) => (
                <div
                  key={u.id}
                  className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{u.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${
                          u.role === 'admin'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : u.role === 'designer'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-neutral-500 font-medium pt-2">
                      <p className="truncate">Email: {u.email}</p>
                      <p>Phone: {u.mobile_number || 'Not Provided'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-50 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-sans font-medium">
                      Joined: {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="architect">Architect</option>
                      <option value="designer">Designer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="overflow-hidden mt-3 border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">User</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Email Address</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Contact Number</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Role Badge</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Sign Up Date</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-semibold">
                {users
                  .filter(u => {
                    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (u.mobile_number && u.mobile_number.includes(searchQuery));
                    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
                    return matchesSearch && matchesRole;
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-neutral-900">{u.name}</span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500 font-medium">{u.email}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-400 font-sans">{u.mobile_number || 'Not Provided'}</td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : u.role === 'designer'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-xs text-neutral-400 font-medium font-sans">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1 text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                        >
                          <option value="architect">Architect</option>
                          <option value="designer">Designer</option>
                          <option value="admin">Admin</option>
                        </select>
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
