'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    mobile_number: string;
    created_at: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('id, name, email, role, mobile_number, created_at')
          .eq('id', user.id)
          .single();

        if (profError || !prof) {
          setErrorMsg('Failed to load profile.');
          return;
        }

        setProfile(prof);
        setName(prof.name || '');
        setMobileNumber(prof.mobile_number || '');
      } catch (err) {
        console.error('Error loading profile:', err);
        setErrorMsg('An error occurred while loading profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          mobile_number: mobileNumber,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, name, mobile_number: mobileNumber } : null);
      setSuccessMsg('Profile updated successfully!');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Account Profile</h1>
          <p className="text-xs text-neutral-450 mt-1">Manage your account information and preferences.</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-150 text-rose-800 text-xs font-semibold rounded-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-semibold rounded-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-450 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-neutral-800"
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-450 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50/50 rounded-sm text-sm text-neutral-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-450 uppercase tracking-wide">Role</label>
              <input
                type="text"
                value={profile?.role ? profile.role.toUpperCase() : ''}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50/50 rounded-sm text-sm text-neutral-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-450 uppercase tracking-wide">Mobile Number</label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-neutral-800"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-sm text-sm shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
