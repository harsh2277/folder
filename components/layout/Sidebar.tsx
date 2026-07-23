'use client';

import Link from 'next/link';

export interface NavItem {
  name: string;
  path: string;
  icon: string;
  group: string;
}

interface SidebarProps {
  workspaceTitle?: string;
  workspaceSubtitle?: string;
  workspaceIcon?: string;
  navItems: NavItem[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  pathname: string;
}

export default function Sidebar({
  workspaceTitle = 'Lightlab',
  workspaceSubtitle = 'Workspace',
  workspaceIcon = 'bx bxs-bulb',
  navItems,
  isCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  pathname,
}: SidebarProps) {
  const navGroups = Array.from(new Set(navItems.map((item) => item.group)));

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — dark theme */}
      <aside
        className={`bg-neutral-950 flex flex-col justify-between text-neutral-300 transition-all duration-300 fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-14' : 'md:w-56 xl:w-56 2xl:w-64'} w-64`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo & Branding */}
          <div
            className={`p-3 xl:p-4 flex items-center bg-neutral-950 border-b border-neutral-900 ${
              isCollapsed && !isMobileOpen ? 'justify-center' : 'space-x-2.5'
            }`}
          >
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-md bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
              <i className={`${workspaceIcon} text-base xl:text-lg`}></i>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-medium text-white tracking-tight text-sm block truncate">
                  {workspaceTitle}
                </span>
                <span className="text-xs text-neutral-500 font-medium truncate block">
                  {workspaceSubtitle}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <nav className="p-2 space-y-3 xl:space-y-4">
            {navGroups.map((group) => (
              <div key={group} className="space-y-0.5">
                {(!isCollapsed || isMobileOpen) && (
                  <p className="text-xs font-medium text-neutral-500 px-3 mb-1.5 truncate">
                    {group}
                  </p>
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
                        title={isCollapsed && !isMobileOpen ? item.name : undefined}
                        className={`flex items-center transition-all group ${
                          isCollapsed && !isMobileOpen
                            ? 'justify-center p-2 mx-auto w-9 h-9 xl:w-10 xl:h-10 rounded-md'
                            : 'justify-between px-3 py-2 rounded-md'
                        } text-xs xl:text-sm font-medium ${
                          isActive
                            ? 'bg-amber-500 text-white font-medium'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            isCollapsed && !isMobileOpen ? 'justify-center' : 'space-x-2.5'
                          }`}
                        >
                          <i className={`${item.icon} text-base xl:text-lg`}></i>
                          {(!isCollapsed || isMobileOpen) && (
                            <span className="truncate">{item.name}</span>
                          )}
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
      </aside>
    </>
  );
}
