import { useUIStore } from '../../store/uiStore';

export function ToastProvider() {
  const { toasts, removeToast } = useUIStore();
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`px-4 py-3 rounded shadow-lg text-white cursor-pointer text-sm max-w-sm
            ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
