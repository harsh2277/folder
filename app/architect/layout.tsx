'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', path: '/architect/dashboard', icon: 'bx bx-grid-alt', group: 'Overview' },
  { name: 'Projects', path: '/architect/projects', icon: 'bx bx-folder', group: 'Management' },
  { name: 'Payments', path: '/architect/payments', icon: 'bx bx-credit-card', group: 'Finances' },
];

export default function ArchitectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/login');
          return;
        }

        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('name, email, role')
          .eq('id', user.id)
          .single();

        if (profError || !prof || prof.role !== 'architect') {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        setProfile({ name: prof.name, email: prof.email });
        setLoading(false);
      } catch {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router, supabase]);

  // Sync active tab name based on pathname
  useEffect(() => {
    const active = navItems.find(item => pathname.startsWith(item.path));
    if (active) {
      setActiveTab(active.name);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-955">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-400 text-sm font-semibold tracking-wider font-sans">Verifying Session...</span>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navGroups = Array.from(new Set(navItems.map(item => item.group)));

  return (
    <div className="h-screen flex bg-neutral-950 text-neutral-800 overflow-hidden font-sans">

      {/* SaaS Sidebar - dark theme */}
      <aside className={`bg-neutral-950 flex flex-col justify-between text-neutral-300 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="overflow-y-auto flex-1">
          {/* Logo & Branding */}
          <div className={`p-4 flex items-center bg-neutral-950 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 rounded-md bg-cyan-600 flex items-center justify-center text-white flex-shrink-0">
              <i className="bx bxs-paint text-lg"></i>
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-extrabold text-white tracking-tight text-base block">Kelvin Lightings</span>
                <span className="text-xs text-neutral-500 font-bold">Architect Workspace</span>
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <nav className="p-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group} className="space-y-1">
                {!isCollapsed && <p className="text-xs font-bold text-neutral-500 px-3 mb-2">{group}</p>}
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        className={`flex items-center transition-all group ${
                          isCollapsed 
                            ? 'justify-center p-2 mx-auto w-10 h-10 rounded-md' 
                            : 'justify-between px-3 py-2 rounded-md'
                        } text-sm font-semibold ${isActive
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                          }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'}`}>
                          <i className={`${item.icon} text-lg`}></i>
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        {isActive && !isCollapsed && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>
        </div>

        {/* Collapse Sidebar Button */}
        <div className="p-2 border-t border-neutral-900 flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center text-neutral-400 hover:text-white text-sm font-semibold rounded-md transition-colors hover:bg-neutral-900 ${
              isCollapsed 
                ? 'justify-center w-10 h-10' 
                : 'space-x-2.5 px-3 py-2 w-full'
            }`}
          >
            <i className={`bx ${isCollapsed ? 'bx-chevrons-right' : 'bx-chevrons-left'} text-lg`}></i>
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 bg-neutral-900/10 border-t border-neutral-900 flex flex-col items-center">
          <div className={`flex items-center mb-4 w-full ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 rounded-full bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {profile?.name.substring(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 hover:text-white text-neutral-300 text-sm font-semibold rounded-md transition-colors ${
              isCollapsed 
                ? 'w-10 h-10' 
                : 'w-full space-x-2 px-3 py-2'
            }`}
          >
            <i className="bx bx-log-out text-base"></i>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Floating White Main Section Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-[6px] mr-[6px] ml-[2px] overflow-hidden">

        {/* Top bar inside the floating white card */}
        <header className="h-16 bg-white border-b border-neutral-100 px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          {/* Breadcrumbs & Collapse Toggle */}
          <div className="flex items-center space-x-2 text-sm font-semibold text-neutral-400">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-950 rounded-md transition-colors mr-2 cursor-pointer flex items-center"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <i className="bx bx-menu text-xl"></i>
            </button>
            <span>Architect</span>
            <i className="bx bx-chevron-right text-sm"></i>
            <span className="text-neutral-800 font-bold">{activeTab}</span>
          </div>

          {/* Search bar & notification controls */}
          <div className="flex items-center space-x-4">
            {/* Search Input Box */}
            <div className="relative hidden md:block">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-base"></i>
              <input
                type="text"
                placeholder="Search everything..."
                className="w-56 pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Notification Badge */}
            <div className="relative p-1.5 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors">
              <i className="bx bx-bell text-xl text-neutral-600"></i>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-neutral-200"></div>

            {/* Profile Dropdown indicator */}
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center font-bold text-sm text-neutral-700">
                {profile?.name.substring(0, 1).toUpperCase()}
              </div>
              <i className="bx bx-chevron-down text-neutral-400 text-sm"></i>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 bg-neutral-50/30">
          {children}
        </main>
      </div>

    </div>
  );
}
