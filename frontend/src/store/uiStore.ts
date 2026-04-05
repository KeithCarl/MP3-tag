import { create } from 'zustand';

type Panel = 'tags' | 'batch-tags' | 'rename' | 'musicbrainz' | null;

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIStore {
  activePanel: Panel;
  setPanel: (p: Panel) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  toasts: Toast[];
  addToast: (msg: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: null,
  setPanel: (p) => set({ activePanel: p }),
  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),
  toasts: [],
  addToast: (message, type = 'info') =>
    set((s) => {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setTimeout(() => s.removeToast(id), 4000);
      return { toasts: [...s.toasts, { id, message, type }] };
    }),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
