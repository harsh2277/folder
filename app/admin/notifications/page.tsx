'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  category: 'account' | 'project' | 'finance' | 'system';
  icon: string;
  color: string;
  href?: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STORAGE_KEY = 'lightmap_admin_notification_state';

function loadPersistedState(): { read: string[]; dismissed: string[] } {
  if (typeof window === 'undefined') return { read: [], dismissed: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { read: [], dismissed: [] };
    const parsed = JSON.parse(raw);
    return { read: parsed.read || [], dismissed: parsed.dismissed || [] };
  } catch {
    return { read: [], dismissed: [] };
  }
}

function persistState(readIds: Set<string>, dismissedIds: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      read: Array.from(readIds),
      dismissed: Array.from(dismissedIds),
    }));
  } catch {}
}

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const { success: toastSuccess } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(loadPersistedState().read));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set(loadPersistedState().dismissed));
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    async function fetchRealEvents() {
      try {
        const [{ data: projects }, { data: payments }, { data: revisions }] = await Promise.all([
          supabase
            .from('projects')
            .select('id, project_name, project_id_serial, client_name, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('payments')
            .select('id, amount, status, created_at, projects!project_id(id, project_name, project_id_serial)')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('revision_requests')
            .select('id, status, created_at, projects!project_id(id, project_name, project_id_serial)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const items: NotificationItem[] = [];

        (projects || []).forEach((p: any) => {
          items.push({
            id: `project_${p.id}`,
            title: `New project submitted: ${p.project_name}`,
            description: `${p.project_id_serial || 'Project'} for client ${p.client_name} was created and is currently "${p.status}".`,
            timestamp: p.created_at,
            read: false,
            category: 'project',
            icon: 'bx-folder-plus',
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            href: `/admin/projects/${p.id}`,
          });
        });

        (payments || []).forEach((pay: any) => {
          const proj = pay.projects;
          items.push({
            id: `payment_${pay.id}`,
            title: `Payment completed${proj ? ` for ${proj.project_name}` : ''}`,
            description: `${proj?.project_id_serial || 'Invoice'} settled for ₹${Number(pay.amount || 0).toLocaleString('en-IN')}.`,
            timestamp: pay.created_at,
            read: false,
            category: 'finance',
            icon: 'bx-credit-card',
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            href: proj ? `/admin/projects/${proj.id}` : undefined,
          });
        });

        (revisions || []).forEach((rev: any) => {
          const proj = rev.projects;
          items.push({
            id: `revision_${rev.id}`,
            title: `Revision requested${proj ? ` for ${proj.project_name}` : ''}`,
            description: `${proj?.project_id_serial || 'A project'} has a revision request awaiting admin review.`,
            timestamp: rev.created_at,
            read: false,
            category: 'system',
            icon: 'bx-git-pull-request',
            color: 'text-rose-600 bg-rose-50 border-rose-100',
            href: '/admin/revision-requests',
          });
        });

        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(items.slice(0, 25));
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRealEvents();
  }, []);

  const visible = notifications.filter(n => !dismissedIds.has(n.id));
  const filteredNotifications = visible.filter(n => {
    const isRead = readIds.has(n.id);
    if (activeFilter === 'unread') return !isRead;
    if (activeFilter === 'read') return isRead;
    return true;
  });

  useEffect(() => {
    persistState(readIds, dismissedIds);
  }, [readIds, dismissedIds]);

  const toggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds(new Set(visible.map(n => n.id)));
    toastSuccess('All notifications marked as read.');
  };

  const deleteNotification = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    toastSuccess('Notification removed.');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h1 className="text-xl font-medium text-neutral-900 tracking-tight">System Notifications</h1>
          <p className="text-sm text-neutral-450 mt-0.5">Recent project, payment, and revision activity across the platform.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-xs rounded-md transition-all cursor-pointer active:scale-[0.98]"
          >
            Mark all as read
          </button>
          <Link
            href="/admin/dashboard"
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-md transition-all cursor-pointer active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100" role="tablist" aria-label="Notification filters">
        <div className="flex space-x-4">
          {(['all', 'unread', 'read'] as const).map(filter => (
            <button
              key={filter}
              role="tab"
              aria-selected={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer capitalize ${
                activeFilter === filter
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {filter} ({filter === 'all' ? visible.length : visible.filter(n => filter === 'unread' ? !readIds.has(n.id) : readIds.has(n.id)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Notification List Container */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-neutral-450 font-medium">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50/20">
            <i className="bx bx-bell-off text-4xl text-neutral-300"></i>
            <p className="font-medium">No notifications here.</p>
            <p className="text-xs text-neutral-400">Everything matches your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map(notif => {
              const isRead = readIds.has(notif.id);
              return (
                <div
                  key={notif.id}
                  className={`p-5 flex items-start justify-between gap-4 transition-colors hover:bg-neutral-50/30 ${
                    !isRead ? 'bg-amber-50/5' : ''
                  }`}
                >
                  <Link href={notif.href || '#'} className="flex items-start space-x-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${notif.color}`}>
                      <i className={`bx ${notif.icon} text-lg`}></i>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm ${!isRead ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}>
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-2xl">
                        {notif.description}
                      </p>
                      <span className="text-[10px] text-neutral-405 font-medium block mt-2">
                        {timeAgo(notif.timestamp)} &bull; <span className="capitalize">{notif.category}</span>
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => toggleRead(notif.id)}
                      className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded-md transition-colors cursor-pointer"
                      title={isRead ? 'Mark as unread' : 'Mark as read'}
                      aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <i className={`bx ${isRead ? 'bx-envelope-open' : 'bx-envelope'} text-sm`}></i>
                    </button>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <i className="bx bx-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
