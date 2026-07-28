'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type EventType = 'deadline' | 'created';

interface CalEvent {
  date: string; // yyyy-mm-dd
  type: EventType;
  projectId: string;
  projectName: string;
  clientName: string;
  status: string;
}

const EVENT_META: Record<EventType, { label: string; dot: string; icon: string; iconColor: string }> = {
  deadline: { label: 'Deadline', dot: 'bg-rose-500', icon: 'bx-flag-alt', iconColor: 'text-rose-500' },
  created: { label: 'Project Created', dot: 'bg-emerald-500', icon: 'bx-plus-circle', iconColor: 'text-emerald-500' },
};

function toDateKey(d: string | Date) {
  // Avoid UTC round-tripping (toISOString) which shifts the calendar day
  // by one in any timezone ahead of UTC. String dates from the DB are
  // already "YYYY-MM-DD..." so just take the date portion directly; Date
  // objects (built from local year/month/day in the grid) use local getters.
  if (typeof d === 'string') return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DeadlineCalendar({
  basePath,
  projectsApiUrl,
}: {
  basePath: string;
  projectsApiUrl: string;
}) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch(projectsApiUrl);
        const projects: any[] = res.ok ? (await res.json()).projects || [] : [];

        const deadlineEvents: CalEvent[] = projects
          .filter((p) => p.deadline)
          .map((p) => ({
            date: toDateKey(p.deadline),
            type: 'deadline' as const,
            projectId: p.id,
            projectName: p.project_name,
            clientName: p.client_name,
            status: p.status,
          }));

        const createdEvents: CalEvent[] = projects
          .filter((p) => p.created_at)
          .map((p) => ({
            date: toDateKey(p.created_at),
            type: 'created' as const,
            projectId: p.id,
            projectName: p.project_name,
            clientName: p.client_name,
            status: p.status,
          }));

        setEvents([...deadlineEvents, ...createdEvents]);
      } catch (err) {
        console.error('Error loading calendar data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [projectsApiUrl]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const todayKey = toDateKey(new Date());

  const deadlineEventsOnly = useMemo(() => events.filter((e) => e.type === 'deadline'), [events]);
  const upcomingDeadlines = useMemo(
    () => deadlineEventsOnly.filter((e) => e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [deadlineEventsOnly, todayKey]
  );
  const overdueCount = useMemo(() => deadlineEventsOnly.filter((e) => e.date < todayKey).length, [deadlineEventsOnly, todayKey]);
  const recentActivity = useMemo(
    () => events.filter((e) => e.type === 'created').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [events]
  );
  const thisMonthCount = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [events, cursor]);

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ key: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: null, dayNum: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(year, month, d));
    cells.push({ key, dayNum: d });
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-neutral-450 font-medium">
        <i className="bx bx-loader-alt bx-spin text-2xl text-neutral-300"></i>
      </div>
    );
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-4 font-sans">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200 rounded-md p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <i className="bx bx-calendar text-lg"></i>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-neutral-900 leading-none block">{thisMonthCount}</span>
            <span className="text-xs text-neutral-450 font-medium">Events this month</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <i className="bx bx-time-five text-lg"></i>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-neutral-900 leading-none block">{upcomingDeadlines.length}</span>
            <span className="text-xs text-neutral-450 font-medium">Upcoming deadlines</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <i className="bx bx-error-circle text-lg"></i>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-neutral-900 leading-none block">{overdueCount}</span>
            <span className="text-xs text-neutral-450 font-medium">Overdue</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-md p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <i className="bx bx-plus-circle text-lg"></i>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-neutral-900 leading-none block">{recentActivity.length}</span>
            <span className="text-xs text-neutral-450 font-medium">Recently created</span>
          </div>
        </div>
      </div>

      {/* Full-width calendar */}
      <div className="bg-white border border-neutral-200 rounded-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelectedDate(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 cursor-pointer transition-colors"
            >
              <i className="bx bx-chevron-left"></i>
            </button>
            <h2 className="text-base font-semibold text-neutral-900 w-40 text-center">{monthLabel}</h2>
            <button
              onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelectedDate(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 cursor-pointer transition-colors"
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-medium">
            {(Object.keys(EVENT_META) as EventType[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${EVENT_META[t].dot}`}></span>
                {EVENT_META[t].label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-neutral-100 rounded-md border border-neutral-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-neutral-50 text-center text-[10px] font-semibold text-neutral-450 uppercase tracking-wide py-2 first:rounded-tl-md last:rounded-tr-md">
              {d}
            </div>
          ))}

          {cells.map((cell, idx) => {
            if (!cell.key) return <div key={idx} className="bg-white min-h-[64px] sm:min-h-[92px]" />;
            const dayEvents = eventsByDate[cell.key] || [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedDate;
            const isPast = cell.key < todayKey;
            const visibleEvents = dayEvents.slice(0, 2);
            const overflow = dayEvents.length - visibleEvents.length;
            const rowIndex = Math.floor(idx / 7);
            const colIndex = idx % 7;
            const flipBelow = rowIndex <= 1;
            const alignLeft = colIndex <= 1;
            const alignRight = colIndex >= 5;

            return (
              <div key={cell.key} className="relative group bg-white">
                <button
                  onClick={() => setSelectedDate(cell.key === selectedDate ? null : cell.key)}
                  className={`w-full min-h-[64px] sm:min-h-[92px] p-1.5 text-left transition-colors cursor-pointer flex flex-col gap-1 ${
                    isSelected ? 'bg-amber-50 ring-1 ring-inset ring-amber-400' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span
                    className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                      isToday ? 'bg-amber-500 text-white' : isPast ? 'text-neutral-350' : 'text-neutral-700'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {visibleEvents.map((e, i) => (
                      <span
                        key={i}
                        className={`flex items-center gap-1 text-[10px] font-medium truncate rounded px-1 py-0.5 ${
                          e.type === 'deadline' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVENT_META[e.type].dot}`}></span>
                        <span className="truncate">{e.projectName}</span>
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[10px] font-medium text-neutral-400 px-1">+{overflow} more</span>
                    )}
                  </div>
                </button>

                {/* Detailed hover preview — flips below for the top two rows and
                    clamps to the left/right edge for outer columns so it never
                    gets clipped by the grid or the viewport. */}
                {dayEvents.length > 0 && (
                  <div
                    className={`pointer-events-none absolute z-20 hidden w-60 rounded-md border border-neutral-200 bg-white p-3 shadow-lg group-hover:block ${
                      flipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                    } ${
                      alignLeft ? 'left-0' : alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    }`}
                  >
                    <p className="mb-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                      {new Date(cell.key).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <div className="space-y-2">
                      {dayEvents.slice(0, 4).map((e, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <i className={`bx ${EVENT_META[e.type].icon} ${EVENT_META[e.type].iconColor} text-sm mt-0.5 shrink-0`}></i>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-800 truncate">{e.projectName}</p>
                            <p className="text-[10px] text-neutral-450 truncate">{EVENT_META[e.type].label} · {e.clientName}</p>
                            <span className="inline-block mt-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded px-1.5 py-0.5">
                              {e.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <p className="text-[10px] font-medium text-neutral-400">+{dayEvents.length - 4} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white border border-neutral-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
              <i className="bx bx-x text-lg"></i>
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-neutral-450">No activity on this day.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedEvents.map((e, i) => (
                <Link
                  key={i}
                  href={`${basePath}/projects/${e.projectId}`}
                  className={`flex items-start gap-2 p-2.5 rounded-md border transition-colors ${
                    e.type === 'deadline' ? 'border-rose-100 bg-rose-50/40 hover:bg-rose-50' : 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50'
                  }`}
                >
                  <i className={`bx ${EVENT_META[e.type].icon} ${EVENT_META[e.type].iconColor} shrink-0 mt-0.5`}></i>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 truncate">{e.projectName}</p>
                    <p className="text-[10px] text-neutral-450 truncate">{EVENT_META[e.type].label} · {e.clientName}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
