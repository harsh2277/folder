'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import CommandPalette from '@/components/ui/CommandPalette';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

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
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Your project \'Luxury Residence\' has been approved!', time: '20m ago', read: false, icon: 'bx-check-circle', color: 'text-emerald-600 bg-emerald-50' },
    { id: 2, title: 'Revision feedback received for project \'Modern Penthouse\'', time: '2h ago', read: false, icon: 'bx-git-pull-request', color: 'text-rose-600 bg-rose-50' },
    { id: 3, title: 'Payment receipt generated for INV-2026-8879', time: '5h ago', read: true, icon: 'bx-receipt', color: 'text-blue-600 bg-blue-50' },
    { id: 4, title: 'New lighting design layout ready for download', time: '2d ago', read: true, icon: 'bx-download', color: 'text-amber-600 bg-amber-50' }
  ]);

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

  const authFetchedRef = useRef(false);

  useEffect(() => {
    if (authFetchedRef.current) return;
    authFetchedRef.current = true;

    async function checkAuth() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!data.profile || data.profile.role !== 'architect') {
          router.push('/login');
          return;
        }

        setProfile({ name: data.profile.name, email: data.profile.email });
        setLoading(false);

        // Fetch projects for Cmd+K palette
        try {
          const res2 = await fetch('/api/projects');
          if (res2.ok) {
            const d2 = await res2.json();
            setAllProjects(d2.projects || []);
          }
        } catch (e) {}
      } catch {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

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

  return (
    <div className="h-screen flex bg-neutral-900 text-neutral-800 overflow-hidden font-sans">
      <CommandPalette projects={allProjects} basePath="/architect/projects" />

      {/* Reusable Sidebar Component */}
      <Sidebar
        workspaceTitle="Lightlab"
        workspaceSubtitle="Architect Workspace"
        workspaceIcon="bx bxs-paint"
        navItems={navItems}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        pathname={pathname}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-1.5 mr-1.5 ml-0.5 overflow-hidden">
        {/* Reusable Topbar Header Component */}
        <Topbar
          portalName="Architect"
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          setIsCollapsed={setIsCollapsed}
          setIsMobileOpen={setIsMobileOpen}
          profile={profile}
          notifications={notifications}
          setNotifications={setNotifications}
          handleSignOut={handleSignOut}
          notificationsBasePath="/architect/notifications"
          showQuickSearch={true}
        />

        {/* Content */}
        {pathname.startsWith('/architect/projects/') && !pathname.endsWith('/create') ? (
          children
        ) : (
          <main className="flex-1 overflow-y-auto p-4 bg-neutral-50/70">
            <div className="content-container">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
