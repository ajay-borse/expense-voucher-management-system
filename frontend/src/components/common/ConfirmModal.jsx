import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen = false,
  title = 'Please Confirm',
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  destructive,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const isDanger = isDestructive || destructive;

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={onCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>

      <Button
        type="button"
        variant={isDanger ? 'danger' : 'primary'}
        size="md"
        onClick={onConfirm}
        isLoading={isLoading}
        disabled={isLoading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onCancel}
      title={title}
      size="sm"
      footer={footer}
      closeOnBackdrop={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
          }`}
          aria-hidden="true"
        >
          {isDanger ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 text-sm text-slate-600 leading-relaxed">
          {message && <p>{message}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}
