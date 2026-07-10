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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse at 1024px, open on 1440px+
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }

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

  useEffect(() => {
    const active = navItems.find(item => pathname.startsWith(item.path));
    if (active) setActiveTab(active.name);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-955">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-400 text-xs font-semibold tracking-wider font-sans">Verifying Session...</span>
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
    <div className="h-screen flex bg-neutral-900 text-neutral-800 overflow-hidden font-sans">

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-neutral-955 flex flex-col justify-between text-neutral-300 transition-all duration-300
        fixed inset-y-0 left-0 z-50
        md:static md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-14 lg:w-14 xl:w-56 2xl:w-64' : 'xl:w-56 2xl:w-64'}
        w-64
      `}>
        <div className="overflow-y-auto flex-1">
          {/* Logo */}
          <div className={`p-3 xl:p-4 flex items-center bg-neutral-955 border-b border-neutral-900 ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'space-x-2.5'}`}>
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-md bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
              <i className="bx bxs-paint text-base xl:text-lg"></i>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-semibold text-white tracking-tight text-sm block truncate">Lightlab</span>
                <span className="text-xs text-neutral-500 font-semibold truncate block">Architect Workspace</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="p-2 space-y-3 xl:space-y-4">
            {navGroups.map((group) => (
              <div key={group} className="space-y-0.5">
                {(!isCollapsed || isMobileOpen) && (
                  <p className="text-xs font-semibold text-neutral-500 px-3 mb-1.5 uppercase tracking-wider truncate">{group}</p>
                )}
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        title={(isCollapsed && !isMobileOpen) ? item.name : undefined}
                        className={`flex items-center transition-all group ${(isCollapsed && !isMobileOpen)
                            ? 'justify-center p-2 mx-auto w-9 h-9 xl:w-10 xl:h-10 rounded-md'
                            : 'justify-between px-3 py-2 rounded-md'
                          } text-xs xl:text-sm font-semibold ${isActive
                            ? 'bg-amber-500 text-neutral-950 font-semibold'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                          }`}
                      >
                        <div className={`flex items-center ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'space-x-2.5'}`}>
                          <i className={`${item.icon} text-base xl:text-lg`}></i>
                          {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
                        </div>
                        {isActive && (!isCollapsed || isMobileOpen) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-955 flex-shrink-0"></span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-3 xl:p-4 bg-neutral-900/10 border-t border-neutral-900 flex flex-col items-center">
          <div className={`flex items-center mb-3 w-full ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'space-x-2.5'}`}>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-semibold text-xs flex-shrink-0">
              {profile?.name.substring(0, 2).toUpperCase()}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 hover:text-white text-neutral-300 text-xs font-semibold rounded-md transition-colors ${(isCollapsed && !isMobileOpen)
                ? 'w-9 h-9'
                : 'w-full space-x-2 px-3 py-2'
              }`}
          >
            <i className="bx bx-log-out text-sm"></i>
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-1.5 mr-1.5 ml-0.5 overflow-hidden">

        {/* Header */}
        <header className="h-12 md:h-14 bg-white border-b border-neutral-100 px-3 md:px-4 xl:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileOpen(!isMobileOpen);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-955 rounded-md transition-colors mr-1 cursor-pointer flex items-center flex-shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <i className={`bx ${isCollapsed ? 'bx-menu' : 'bx-menu-alt-left'} text-lg`}></i>
            </button>
            <span className="hidden sm:inline truncate">Architect</span>
            <i className="bx bx-chevron-right text-xs hidden sm:inline flex-shrink-0"></i>
            <span className="text-neutral-800 font-semibold truncate max-w-[120px] sm:max-w-[200px] xl:max-w-none">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            <div className="relative hidden md:block">
              <i className="bx bx-search absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search..."
                className="w-36 lg:w-44 xl:w-52 pl-7 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="relative p-1.5 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors">
              <i className="bx bx-bell text-lg text-neutral-600"></i>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="w-px h-4 bg-neutral-200 hidden sm:block"></div>
            <div className="flex items-center space-x-1.5 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center font-semibold text-xs text-neutral-700">
                {profile?.name.substring(0, 1).toUpperCase()}
              </div>
              <i className="bx bx-chevron-down text-neutral-400 text-xs hidden sm:block"></i>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto main-padding bg-neutral-50/30">
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
