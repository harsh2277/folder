'use client';

interface LayoutToggleProps {
  viewMode: 'table' | 'card';
  onChange: (mode: 'table' | 'card') => void;
}

export default function LayoutToggle({ viewMode, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-md p-0.5 h-[38px]">
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`px-3 h-full rounded transition-all flex items-center justify-center cursor-pointer ${ viewMode === 'table' ? 'bg-white text-neutral-900 ' : 'text-neutral-500 hover:text-neutral-900' }`}
        aria-label="Table view"
      >
        <i className="bx bx-list-ul text-lg"></i>
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={`px-3 h-full rounded transition-all flex items-center justify-center cursor-pointer ${ viewMode === 'card' ? 'bg-white text-neutral-900 ' : 'text-neutral-500 hover:text-neutral-900' }`}
        aria-label="Card view"
      >
        <i className="bx bx-grid-alt text-lg"></i>
      </button>
    </div>
  );
}
