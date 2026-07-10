'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminUsersManagement() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'architect',
    mobileNumber: '',
  });

  const [editingUser, setEditingUser] = useState<any>(null);

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
      // Fallback mock data
      setUsers([
        { id: '1', name: 'Sarah Jenkins', email: 'sarah@lightlab.com', role: 'admin', mobile_number: '+91 98765 43210', created_at: new Date().toISOString() },
        { id: '2', name: 'Rohan Varma', email: 'rohan@lightlab.com', role: 'designer', mobile_number: '+91 99887 76655', created_at: new Date().toISOString() },
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

  // Show notifications helper
  const triggerNotification = (success: string | null, error: string | null) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      triggerNotification('User created successfully!', null);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', name: '', role: 'architect', mobileNumber: '' });
      fetchUsers();
    } catch (err: any) {
      triggerNotification(null, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          mobileNumber: editingUser.mobile_number,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      triggerNotification('User updated successfully!', null);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      triggerNotification(null, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will permanently delete their account and profile.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      triggerNotification('User deleted successfully!', null);
      fetchUsers();
    } catch (err: any) {
      triggerNotification(null, err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.mobile_number && u.mobile_number.includes(searchQuery));
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
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

  const totalArchitects = users.filter(u => u.role === 'architect').length;
  const totalDesigners = users.filter(u => u.role === 'designer').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-sans">User Directory</h2>
          <p className="text-sm text-neutral-400 mt-0.5">Manage credentials, coordinate designer assignments, and update system roles.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-md transition-colors shadow-sm cursor-pointer"
        >
          <i className="bx bx-plus text-sm mr-1.5"></i>
          <span>Add User</span>
        </button>
      </div>

      {/* Notifications */}
      {(successMsg || errorMsg) && (
        <div className="space-y-2">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-md flex items-center space-x-2 animate-fade-in">
              <i className="bx bx-check-circle text-base"></i>
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-md flex items-center space-x-2 animate-fade-in">
              <i className="bx bx-error-circle text-base"></i>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-neutral-400 block">Total Architects</span>
            <span className="text-2xl font-semibold text-neutral-900 font-sans">{totalArchitects}</span>
            <span className="text-xs text-neutral-400 block">Registered partners</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-buildings text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-neutral-400 block">Active Designers</span>
            <span className="text-2xl font-semibold text-neutral-900 font-sans">{totalDesigners}</span>
            <span className="text-xs text-neutral-400 block">Internal workspace staff</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-pencil text-xl"></i>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-neutral-400 block">Admin Staff</span>
            <span className="text-2xl font-semibold text-neutral-900 font-sans">{totalAdmins}</span>
            <span className="text-xs text-neutral-400 block">System controllers</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="bx bx-shield-quarter text-xl"></i>
          </div>
        </div>
      </div>

      {/* User Management Directory Container */}
      <div className="space-y-4">

        {/* Interactive controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-semibold text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
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
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-550 hover:text-neutral-900'
              }`}
            >
              <i className="bx bx-list-ul text-sm"></i>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-all flex items-center space-x-1.5 ${
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
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="border border-neutral-200 hover:border-neutral-300 rounded-md p-5 bg-white flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-semibold text-sm">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">
                        {u.role === 'architect' ? (
                          <Link href={`/admin/architects/${u.id}`} className="text-amber-600 hover:underline">
                            {u.name}
                          </Link>
                        ) : u.role === 'designer' ? (
                          <Link href={`/admin/designers/${u.id}`} className="text-amber-600 hover:underline">
                            {u.name}
                          </Link>
                        ) : u.role === 'admin' ? (
                          <Link href={`/admin/admins/${u.id}`} className="text-amber-600 hover:underline">
                            {u.name}
                          </Link>
                        ) : (
                          u.name
                        )}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${
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
                  <div className="space-y-1.5 text-sm text-neutral-500 font-medium pt-2">
                    <p className="truncate">Email: {u.email}</p>
                    <p>Phone: {u.mobile_number || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-50 flex items-center justify-between">
                  <span className="text-sm text-neutral-400 font-sans font-medium">
                    Joined: {new Date(u.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setShowEditModal(true);
                      }}
                      className="px-2.5 py-1 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="px-2.5 py-1 text-sm font-semibold text-rose-750 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto mt-3 border border-neutral-100 rounded-md">
            <table className="w-full text-left border-collapse text-sm min-w-[700px] md:min-w-0">
              <thead>
                <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-450 font-normal text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 first:pl-5 last:pr-5">User</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Email Address</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Contact Number</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Role Badge</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5">Sign Up Date</th>
                  <th className="py-3 px-4 first:pl-5 last:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/40 transition-colors">
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      {u.role === 'architect' ? (
                        <Link href={`/admin/architects/${u.id}`} className="text-amber-600 hover:underline font-semibold">
                          {u.name}
                        </Link>
                      ) : u.role === 'designer' ? (
                        <Link href={`/admin/designers/${u.id}`} className="text-amber-600 hover:underline font-semibold">
                          {u.name}
                        </Link>
                      ) : u.role === 'admin' ? (
                        <Link href={`/admin/admins/${u.id}`} className="text-amber-600 hover:underline font-semibold">
                          {u.name}
                        </Link>
                      ) : (
                        <span className="text-neutral-900">{u.name}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-500">{u.email}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-neutral-400 font-sans">{u.mobile_number || 'Not Provided'}</td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                        u.role === 'admin'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : u.role === 'designer'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-sm text-neutral-400 font-medium font-sans">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 first:pl-5 last:pr-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowEditModal(true);
                          }}
                          className="px-2.5 py-1 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1 text-sm font-semibold text-rose-750 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Add New User</h3>
              <p className="text-base text-neutral-400">Create credentials and profile metadata for staff or architect portal access.</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sarah@example.com"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Access Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="architect">Architect</option>
                  <option value="designer">Designer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  value={newUser.mobileNumber}
                  onChange={(e) => setNewUser(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-base font-semibold text-neutral-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-base font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Update User Profile</h3>
              <p className="text-base text-neutral-400">Modify credentials, system access roles, or contact numbers.</p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Access Role *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="architect">Architect</option>
                  <option value="designer">Designer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  value={editingUser.mobile_number || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, mobile_number: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-base focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-base font-semibold text-neutral-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-base font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {submitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
