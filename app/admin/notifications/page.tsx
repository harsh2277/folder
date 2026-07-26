'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: 'account' | 'project' | 'finance' | 'system';
  icon: string;
  color: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'New architect registration: Amit Patel',
      description: 'Architect Amit Patel completed onboarding profile verification. Awaiting document audit.',
      time: '10 mins ago',
      read: false,
      category: 'account',
      icon: 'bx-user-plus',
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      id: 2,
      title: 'New onboarding project: Modern Penthouse',
      description: 'Project request for 4,200 sq ft onboarding package submitted by Suresh Kumar.',
      time: '1 hour ago',
      read: false,
      category: 'project',
      icon: 'bx-folder-plus',
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      id: 3,
      title: 'Payment completed for project KL-2025-0001',
      description: 'Transaction invoice statement marked as completed. Amount: ₹3,50,000.',
      time: '3 hours ago',
      read: true,
      category: 'finance',
      icon: 'bx-credit-card',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      id: 4,
      title: 'Revision requested for project KL-2025-0003',
      description: 'Architect Suresh Kumar requested CAD draft updates on standard fixture placement.',
      time: '1 day ago',
      read: true,
      category: 'system',
      icon: 'bx-git-pull-request',
      color: 'text-rose-600 bg-rose-50 border-rose-100'
    },
    {
      id: 5,
      title: 'Database optimization successful',
      description: 'System scheduled backups and index rebuilds completed successfully.',
      time: '3 days ago',
      read: true,
      category: 'system',
      icon: 'bx-server',
      color: 'text-neutral-600 bg-neutral-50 border-neutral-100'
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'read') return n.read;
    return true;
  });

  const { success: toastSuccess } = useToast();

  const toggleRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toastSuccess('All notifications marked as read.');
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toastSuccess('Notification removed.');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h1 className="text-xl font-medium text-neutral-900 tracking-tight">System Notifications</h1>
          <p className="text-sm text-neutral-450 mt-0.5">Audit activity logs, registration queries, and billing transactions.</p>
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
              {filter} ({filter === 'all' ? notifications.length : notifications.filter(n => filter === 'unread' ? !n.read : n.read).length})
            </button>
          ))}
        </div>
      </div>

      {/* Notification List Container */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50/20">
            <i className="bx bx-bell-off text-4xl text-neutral-300"></i>
            <p className="font-medium">No notifications here.</p>
            <p className="text-xs text-neutral-400">Everything matches your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors hover:bg-neutral-50/30 ${
                  !notif.read ? 'bg-amber-50/5' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${notif.color}`}>
                    <i className={`bx ${notif.icon} text-lg`}></i>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm ${!notif.read ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-2xl">
                      {notif.description}
                    </p>
                    <span className="text-[10px] text-neutral-405 font-medium block mt-2">
                      {notif.time} &bull; <span className="capitalize">{notif.category}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => toggleRead(notif.id)}
                    className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded-md transition-colors cursor-pointer"
                    title={notif.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    <i className={`bx ${notif.read ? 'bx-envelope-open' : 'bx-envelope'} text-sm`}></i>
                  </button>
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <i className="bx bx-trash text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
