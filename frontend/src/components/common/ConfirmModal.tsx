import * as Dialog from '@radix-ui/react-dialog';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({ open, title, description, onConfirm, onCancel, confirmLabel = 'Confirm', danger }: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-100 mb-2">{title}</Dialog.Title>
          <Dialog.Description className="text-gray-400 mb-6">{description}</Dialog.Description>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded text-white font-medium ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
