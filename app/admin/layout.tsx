'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import CommandPalette from '@/components/ui/CommandPalette';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'bx bx-grid-alt', group: 'Overview' },
  { name: 'Projects', path: '/admin/projects', icon: 'bx bx-folder', group: 'Management' },
  { name: 'Invoices', path: '/admin/payments', icon: 'bx bx-receipt', group: 'Management' },
  { name: 'Users', path: '/admin/users', icon: 'bx bx-user', group: 'Management' },
  { name: 'Pricing Plans', path: '/admin/pricing', icon: 'bx bx-dollar', group: 'Configuration' },
  { name: 'Revision Requests', path: '/admin/revision-requests', icon: 'bx bx-comment-detail', group: 'System' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New architect registration: Amit Patel', time: '10m ago', read: false, icon: 'bx-user-plus', color: 'text-amber-600 bg-amber-50' },
    { id: 2, title: 'New onboarding project: Modern Penthouse', time: '1h ago', read: false, icon: 'bx-folder-plus', color: 'text-blue-600 bg-blue-50' },
    { id: 3, title: 'Payment completed for project KL-2025-0001', time: '3h ago', read: true, icon: 'bx-credit-card', color: 'text-emerald-600 bg-emerald-50' },
    { id: 4, title: 'Revision requested for project KL-2025-0003', time: '1d ago', read: true, icon: 'bx-git-pull-request', color: 'text-rose-600 bg-rose-50' }
  ]);

  // Auto-collapse sidebar at 1024px (lg breakpoint)
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
        if (!data.profile || data.profile.role !== 'admin') {
          router.push('/login');
          return;
        }

        setProfile({ name: data.profile.name, email: data.profile.email });
        setLoading(false);

        // Fetch projects for Cmd+K palette
        try {
          const { data: projs } = await supabase
            .from('projects')
            .select('id, project_name, client_name, project_id_serial, status')
            .order('created_at', { ascending: false });
          setAllProjects(projs || []);
        } catch (e) { }
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
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
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
    <div className="h-screen flex bg-neutral-900 text-neutral-800 overflow-hidden">
      <CommandPalette projects={allProjects} basePath="/admin/projects" />

      {/* Reusable Sidebar Component */}
      <Sidebar
        workspaceTitle="LightMap"
        workspaceSubtitle="Admin Workspace"
        workspaceIcon="bx bxs-bulb"
        navItems={navItems}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        pathname={pathname}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-neutral-200 rounded-md my-1.5 mr-1.5 ml-0.5 overflow-hidden">
        {/* Reusable Topbar Header Component */}
        <Topbar
          portalName="Admin"
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          setIsCollapsed={setIsCollapsed}
          setIsMobileOpen={setIsMobileOpen}
          profile={profile}
          notifications={notifications}
          setNotifications={setNotifications}
          handleSignOut={handleSignOut}
          notificationsBasePath="/admin/notifications"
          showQuickSearch={true}
        />

        {/* Page Content */}
        {pathname.startsWith('/admin/projects/') && !pathname.endsWith('/create') ? (
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
