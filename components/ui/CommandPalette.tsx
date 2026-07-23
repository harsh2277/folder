'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Portal from './Portal';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  project_id_serial?: string;
  status: string;
}

interface CommandPaletteProps {
  projects: Project[];
  basePath: string; // e.g. '/admin/projects' | '/architect/projects' | '/designer/projects'
}

export default function CommandPalette({ projects, basePath }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? projects.filter(p => {
        const q = query.toLowerCase();
        return (
          p.project_name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q) ||
          (p.project_id_serial || '').toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : projects.slice(0, 8);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setHighlightedIdx(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHighlightedIdx(0);
  }, []);

  const navigate = (id: string) => {
    router.push(`${basePath}/${id}`);
    closePalette();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open ? closePalette() : openPalette();
      }
      if (e.key === 'Escape') closePalette();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIdx]) navigate(filtered[highlightedIdx].id);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Approved' || status === 'Closed') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (status === 'In Design') return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (status === 'Revision Requested') return 'text-rose-600 bg-rose-50 border-rose-100';
    if (status === 'Ready for Client Review') return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  };

  if (!open) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-[9998]"
        onClick={closePalette}
      />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl px-4 font-sans">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-neutral-100 gap-3">
            <i className="bx bx-search text-lg text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects by name, client, or ID..."
              className="flex-1 py-4 text-sm text-neutral-800 bg-transparent outline-none placeholder-neutral-400 font-medium"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-400 font-medium">
                <i className="bx bx-folder-open text-2xl text-neutral-300 block mb-1" />
                No projects match &ldquo;{query}&rdquo;
              </div>
            ) : (
              <ul className="py-1.5">
                {filtered.map((p, idx) => (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate(p.id)}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        idx === highlightedIdx ? 'bg-amber-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <i className="bx bx-folder text-neutral-500 text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{p.project_name}</p>
                          <p className="text-xs text-neutral-400 font-medium truncate">
                            {p.client_name}
                            {p.project_id_serial && <span className="ml-1.5 text-neutral-300">· {p.project_id_serial}</span>}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-neutral-100 flex items-center gap-4 text-[10px] text-neutral-400 font-medium bg-neutral-50/50">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px]">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px]">Esc</kbd> Close</span>
            <span className="ml-auto">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
