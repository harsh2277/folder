'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import CommandPalette from '@/components/ui/CommandPalette';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const navItems = [
  { name: 'Dashboard', path: '/designer/dashboard', icon: 'bx bx-grid-alt', group: 'Overview' },
  { name: 'Projects', path: '/designer/projects', icon: 'bx bx-folder', group: 'Management' },
];

export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New project assigned: Modern Penthouse', time: '15m ago', read: false, icon: 'bx-folder-plus', color: 'text-amber-600 bg-amber-50' },
    { id: 2, title: 'Architect submitted design remarks for Luxury Residence', time: '3h ago', read: false, icon: 'bx-comment-detail', color: 'text-blue-600 bg-blue-50' },
    { id: 3, title: 'Revision instructions uploaded for project KL-2025-0003', time: '1d ago', read: true, icon: 'bx-git-pull-request', color: 'text-rose-600 bg-rose-50' }
  ]);

  // Auto-collapse at 1024px, expand at 1440px+
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
        if (!data.profile || data.profile.role !== 'designer') {
          router.push('/login');
          return;
        }

        setProfile({ name: data.profile.name, email: data.profile.email });
        setLoading(false);

        // Fetch projects for Cmd+K palette
        try {
          const res2 = await fetch('/api/designer/projects');
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
      <CommandPalette projects={allProjects} basePath="/designer/projects" />

      {/* Reusable Sidebar Component */}
      <Sidebar
        workspaceTitle="Lightlab"
        workspaceSubtitle="Designer Workspace"
        workspaceIcon="bx bxs-palette"
        navItems={navItems}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        pathname={pathname}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-1.5 mr-1.5 ml-0.5 overflow-hidden">
        {/* Reusable Topbar Header Component */}
        <Topbar
          portalName="Designer"
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          setIsCollapsed={setIsCollapsed}
          setIsMobileOpen={setIsMobileOpen}
          profile={profile}
          notifications={notifications}
          setNotifications={setNotifications}
          handleSignOut={handleSignOut}
          notificationsBasePath="/designer/notifications"
          showQuickSearch={true}
        />

        {/* Page Content */}
        {pathname.startsWith('/designer/projects/') && !pathname.endsWith('/create') ? (
          children
        ) : (
          <main className="flex-1 overflow-y-auto p-4 bg-neutral-50/30">
            <div className="content-container">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
