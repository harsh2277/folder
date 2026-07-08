import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

async function getSupabaseStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      configured: false,
      connected: false,
      message: "Environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.",
    };
  }

  try {
    const supabase = await createClient();
    // Perform a lightweight request to check connection.
    // We try to fetch the session status, which checks the Supabase Auth server.
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return {
        configured: true,
        connected: false,
        message: `Auth check failed: ${authError.message}`,
      };
    }

    return {
      configured: true,
      connected: true,
      message: "Successfully connected to your Supabase project!",
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: `Connection failed: ${err.message || err}`,
    };
  }
}

export default async function Home() {
  const status = await getSupabaseStatus();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 flex flex-col justify-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-8 mb-12">
          <div className="flex items-center gap-4">
            <Image
              className="dark:invert opacity-80"
              src="/next.svg"
              alt="Next.js logo"
              width={90}
              height={18}
              priority
            />
            <span className="text-slate-500 text-lg font-light">+</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold text-xl tracking-tight">Supabase</span>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
            Next.js 16 + Supabase SSR
          </span>
        </div>

        {/* Hero Section */}
        <div className="space-y-6 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Serverless Database Configured
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Supabase has been successfully integrated into your Next.js application structure with cookie-based session hydration and Server-side Rendering support.
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-12 shadow-xl shadow-black/20">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full ${status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-200">
                Connection Status: {status.connected ? 'Connected' : 'Connection Error'}
              </h3>
              <p className="text-sm text-slate-400 font-mono leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                {status.message}
              </p>
            </div>
          </div>
        </div>

        {/* Integration Details / Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/60 transition-all duration-300 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="text-emerald-400 text-lg">📁</span> Folder Structure
            </h3>
            <ul className="text-sm text-slate-400 space-y-2 font-mono">
              <li>
                <span className="text-emerald-500/80">utils/supabase/</span>
                <ul className="pl-4 border-l border-slate-800 mt-1 space-y-1">
                  <li>client.ts <span className="text-slate-600">(Browser Client)</span></li>
                  <li>server.ts <span className="text-slate-600">(Server Client)</span></li>
                  <li>middleware.ts <span className="text-slate-600">(Session Sync)</span></li>
                </ul>
              </li>
              <li className="mt-2">middleware.ts <span className="text-slate-600">(App-wide filter)</span></li>
            </ul>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/60 transition-all duration-300 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="text-emerald-400 text-lg">💡</span> How to use
            </h3>
            <div className="space-y-4 text-sm text-slate-400">
              <p>
                Import <code className="text-emerald-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">createClient</code> from server or client utilities depending on your component type:
              </p>
              <pre className="text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-emerald-400/90 overflow-x-auto">
{`// In Server Components/Actions:
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();

// In Client Components:
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          Powered by Next.js App Router and Supabase SSR.
        </footer>
      </main>
    </div>
  );
}
