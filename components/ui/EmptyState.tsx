import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = 'bx-folder-open' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-neutral-100 rounded-md">
      <div className="w-12 h-12 rounded-full bg-amber-50/50 flex items-center justify-center border border-amber-100 mb-4">
        <i className={`bx ${icon} text-2xl text-amber-600`}></i>
      </div>
      <h3 className="text-base font-medium text-neutral-900">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
