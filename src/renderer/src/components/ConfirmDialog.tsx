import { Dialog, Transition } from '@headlessui/react';
import { useState } from 'react';

interface ConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
  onClose: () => void;
  message: string;
  buttonText: string;
}

const ConfirmDialog = ({
  onConfirm,
  onCancel,
  open,
  onClose,
  message,
  buttonText,
}: ConfirmProps): JSX.Element => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed z-10 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        {/* Overlayを表示 */}
        <div className="relative bg-white rounded max-w-lg mx-auto p-5">
          <Dialog.Title className="text-lg font-medium text-gray-900">
            確認
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            {message}
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
