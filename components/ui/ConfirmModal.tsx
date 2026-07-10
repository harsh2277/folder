import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-neutral-900 mb-4">
          {title}
        </h2>
        <p className="text-neutral-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
