'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Your project \'Luxury Residence\' has been approved!', time: '20m ago', read: false, icon: 'bx-check-circle', color: 'text-emerald-600 bg-emerald-50' },
    { id: 2, title: 'Revision feedback received for project \'Modern Penthouse\'', time: '2h ago', read: false, icon: 'bx-git-pull-request', color: 'text-rose-600 bg-rose-50' },
    { id: 3, title: 'Payment receipt generated for INV-2026-8879', time: '5h ago', read: true, icon: 'bx-receipt', color: 'text-blue-600 bg-blue-50' },
    { id: 4, title: 'New lighting design layout ready for download', time: '2d ago', read: true, icon: 'bx-download', color: 'text-amber-600 bg-amber-50' }
  ]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const activeItem = navItems.find(item => pathname.startsWith(item.path));
  const activeTab = activeItem ? activeItem.name : 'Dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-400 text-xs font-medium font-sans">Verifying Session...</span>
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
      <aside className={`bg-neutral-950 flex flex-col justify-between text-neutral-300 transition-all duration-300 fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-14' : 'md:w-56 xl:w-56 2xl:w-64'} w-64`}>
        <div className="overflow-y-auto flex-1">
          {/* Logo */}
          <div className={`p-3 xl:p-4 flex items-center bg-neutral-950 border-b border-neutral-900 ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'space-x-2.5'}`}>
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-md bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
              <i className="bx bxs-paint text-base xl:text-lg"></i>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-medium text-white tracking-tight text-sm block truncate">Lightlab</span>
                <span className="text-xs text-neutral-500 font-medium truncate block">Architect Workspace</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="p-2 space-y-3 xl:space-y-4">
            {navGroups.map((group) => (
              <div key={group} className="space-y-0.5">
                {(!isCollapsed || isMobileOpen) && (
                  <p className="text-xs font-medium text-neutral-500 px-3 mb-1.5 truncate">{group}</p>
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
                        className={`flex items-center transition-all group ${(isCollapsed && !isMobileOpen) ? 'justify-center p-2 mx-auto w-9 h-9 xl:w-10 xl:h-10 rounded-md' : 'justify-between px-3 py-2 rounded-md' } text-xs xl:text-sm font-medium ${isActive ? 'bg-amber-500 text-neutral-950 font-medium' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white' }`}
                      >
                        <div className={`flex items-center ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'space-x-2.5'}`}>
                          <i className={`${item.icon} text-base xl:text-lg`}></i>
                          {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
                        </div>
                        {isActive && (!isCollapsed || isMobileOpen) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 flex-shrink-0"></span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Card */}
        <div className={`bg-neutral-900/10 border-t border-neutral-900 flex flex-col items-center ${(isCollapsed && !isMobileOpen) ? 'p-2 py-4 space-y-3.5' : 'p-3 xl:p-4'}`}>
          <div className={`flex items-center w-full ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'mb-3 space-x-2.5'}`}>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-medium text-xs flex-shrink-0">
              {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'AR'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate min-w-0">
                <p className="text-xs font-medium text-white truncate">{profile?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 hover:text-white text-neutral-300 text-xs font-medium rounded-md transition-colors ${(isCollapsed && !isMobileOpen) ? 'w-8 h-8' : 'w-full space-x-2 px-3 py-2' }`}
          >
            <i className="bx bx-log-out text-sm"></i>
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-1.5 mr-1.5 ml-0.5 overflow-hidden">

        {/* Header */}
        <header className="h-12 md:h-14 bg-white border-b border-neutral-100 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-400 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileOpen(!isMobileOpen);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-950 rounded-md transition-colors mr-1 cursor-pointer flex items-center flex-shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <i className={`bx ${isCollapsed ? 'bx-menu' : 'bx-menu-alt-left'} text-lg`}></i>
            </button>
            <span className="hidden sm:inline truncate">Architect</span>
            <i className="bx bx-chevron-right text-xs hidden sm:inline flex-shrink-0"></i>
            <span className="text-neutral-800 font-medium truncate max-w-[120px] sm:max-w-[200px] xl:max-w-none">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            {/* Notification Dropdown Container */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors flex items-center justify-center text-neutral-600 focus:outline-none"
              >
                <i className="bx bx-bell text-lg"></i>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-md py-1 z-50 text-neutral-800 font-sans shadow-lg select-none">
                  <div className="px-4 py-2.5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <span className="text-xs font-semibold text-neutral-800">Notifications</span>
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[10px] text-amber-600 hover:text-amber-700 transition-colors font-medium cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          setShowNotifications(false);
                          router.push('/architect/notifications');
                        }}
                        className={`p-3 flex items-start space-x-3 hover:bg-neutral-50 cursor-pointer transition-colors ${!notif.read ? 'bg-amber-50/5' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${notif.color}`}>
                          <i className={`bx ${notif.icon} text-sm`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs leading-normal ${!notif.read ? 'text-neutral-900 font-medium' : 'text-neutral-600 font-normal'}`}>{notif.title}</p>
                          <span className="text-[10px] text-neutral-400 font-medium mt-1 block">{notif.time}</span>
                        </div>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-neutral-100 text-center bg-neutral-50/20">
                    <Link
                      href="/architect/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block w-full py-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-neutral-200 hidden sm:block"></div>
            <div className="flex items-center space-x-1.5 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center font-medium text-xs text-neutral-700">
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
