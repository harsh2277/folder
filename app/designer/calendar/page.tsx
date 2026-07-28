'use client';

import { DeadlineCalendar } from '@/components/ui';

export default function DesignerCalendarPage() {
  return (
    <div className="space-y-4 font-sans">
      <div>
        <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Deadline Calendar</h2>
        <p className="text-sm text-neutral-450 mt-0.5">Project deadlines and pending payments for your assigned projects.</p>
      </div>
      <DeadlineCalendar basePath="/designer" projectsApiUrl="/api/designer/projects" />
    </div>
  );
}
