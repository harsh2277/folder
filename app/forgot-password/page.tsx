'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Forgot your password?'}
      subtitle={
        sent
          ? `We've sent a password reset link to ${email}.`
          : 'Enter the email linked to your account and we\'ll send you a reset link.'
      }
      footer={
        <p className="text-center text-sm text-neutral-500">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-amber-700 hover:text-amber-800">
            Sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-start space-x-3 text-emerald-800 text-sm">
          <i className="bx bx-check-circle text-lg text-emerald-600 flex-shrink-0" />
          <span>Didn&apos;t get it? Check spam, or try again in a minute.</span>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3 text-red-800 text-sm">
              <i className="bx bx-error-circle text-lg text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
                placeholder="user@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
