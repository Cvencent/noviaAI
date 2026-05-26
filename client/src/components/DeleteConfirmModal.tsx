import React from 'react';
import { AlertTriangle, Trash } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  cancelText = '取消',
  confirmText = '删除',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认删除"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash className="w-4 h-4 mr-2" />
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-red-900/30 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-[var(--danger-color)]" />
        </div>
        <p className="font-medium mb-2 text-[var(--text-primary)]">
          {title}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {message}
        </p>
      </div>
    </Modal>
  );
};
