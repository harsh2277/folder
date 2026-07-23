'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface NotificationItem {
  id: number;
  title: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
}

interface TopbarProps {
  portalName: string;
  activeTab: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsMobileOpen: (open: boolean) => void;
  profile: { name: string; email: string } | null;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  handleSignOut: () => void;
  notificationsBasePath?: string;
  showQuickSearch?: boolean;
}

export default function Topbar({
  portalName,
  activeTab,
  isCollapsed,
  isMobileOpen,
  setIsCollapsed,
  setIsMobileOpen,
  profile,
  notifications,
  setNotifications,
  handleSignOut,
  notificationsBasePath = '/admin/notifications',
  showQuickSearch = true,
}: TopbarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 md:h-14 bg-white border-b border-neutral-100 px-4 flex items-center justify-between flex-shrink-0">
      {/* Breadcrumbs & Sidebar Toggle */}
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
        <span className="hidden sm:inline truncate">{portalName}</span>
        <i className="bx bx-chevron-right text-xs hidden sm:inline flex-shrink-0"></i>
        <span className="text-neutral-800 font-medium truncate max-w-[120px] sm:max-w-[200px] xl:max-w-none">
          {activeTab}
        </span>
      </div>

      {/* Ctrl+K Search Hint */}
      {showQuickSearch && (
        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
            )
          }
          className="hidden md:flex items-center justify-between w-[324px] px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-400 font-medium hover:border-amber-400 hover:text-neutral-600 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className="bx bx-search text-sm" />
            <span>Quick search...</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-medium">
            Ctrl K
          </kbd>
        </button>
      )}

      {/* Right controls */}
      <div className="flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
        {/* Notification Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors flex items-center justify-center text-neutral-600 focus:outline-none"
          >
            <i className="bx bx-bell text-lg"></i>
            {notifications.some((n) => !n.read) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-md py-1 z-50 text-neutral-800 font-sans shadow-lg select-none">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <span className="text-xs font-semibold text-neutral-800">Notifications</span>
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  className="text-xs text-amber-600 hover:text-amber-700 transition-colors font-medium cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                      );
                      setShowNotifications(false);
                      if (notificationsBasePath) {
                        router.push(notificationsBasePath);
                      }
                    }}
                    className={`p-3 flex items-start space-x-3 hover:bg-neutral-50 cursor-pointer transition-colors ${
                      !notif.read ? 'bg-amber-50/5' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${notif.color}`}
                    >
                      <i className={`bx ${notif.icon} text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-normal ${
                          !notif.read
                            ? 'text-neutral-900 font-medium'
                            : 'text-neutral-600 font-normal'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-xs text-neutral-400 font-medium mt-1 block">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 p-1 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors text-left focus:outline-none"
          >
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-neutral-900 text-white font-medium text-xs flex items-center justify-center border border-neutral-700 shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block min-w-0">
              <span className="text-xs font-semibold text-neutral-900 block truncate">
                {profile?.name || 'User'}
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">
                {profile?.email || ''}
              </span>
            </div>
            <i className="bx bx-chevron-down text-neutral-400 text-xs hidden xl:block"></i>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-md py-1.5 z-50 text-neutral-800 font-sans shadow-lg">
              <div className="px-4 py-2 border-b border-neutral-100">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                  {profile?.name || 'User'}
                </p>
                <p className="text-[11px] text-neutral-400 truncate">{profile?.email || ''}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <i className="bx bx-log-out text-sm"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
