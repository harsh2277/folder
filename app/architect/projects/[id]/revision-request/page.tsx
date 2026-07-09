'use client';

import { useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArchitectRevisionRequest({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session');

      // 1. Insert into revision_requests
      const { error: insertError } = await supabase
        .from('revision_requests')
        .insert({
          project_id: id,
          architect_id: user.id,
          description: description,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // 2. Update project status to indicate a revision is requested/under review
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'Under Review'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setMessage('Revision request submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/architect/projects/${id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Error submitting revision request:', err);
      setMessage(`Failed: ${err.message || 'Unknown error'}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto font-sans">
      <div className="border-b border-neutral-100 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Request Design Revision</h1>
          <p className="text-xs text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Provide details for lighting layout modifications</p>
        </div>
        <Link
          href={`/architect/projects/${id}`}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        {message && (
          <div className={`p-4 rounded text-xs font-bold ${message.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="description" className="block text-xs uppercase font-extrabold text-neutral-450 tracking-wider">Revision Details</label>
          <textarea
            id="description"
            rows={6}
            required
            className="w-full text-xs font-medium text-neutral-800 border border-neutral-250 rounded p-3 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            placeholder="Please detail the modifications needed. (e.g. Move ceiling spotlight fixtures in the master bed layout, revise LUX levels in drawing room area...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="w-full py-3 bg-neutral-950 hover:bg-neutral-850 disabled:bg-neutral-200 text-white font-bold text-xs rounded transition-colors uppercase tracking-wider cursor-pointer"
        >
          {submitting ? 'Submitting request...' : 'Submit Revision Request'}
        </button>
      </form>
    </div>
  );
}
