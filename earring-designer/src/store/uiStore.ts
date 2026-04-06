import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface UIStore {
  showMaterials: boolean
  setShowMaterials(v: boolean): void
  toasts: Toast[]
  addToast(message: string, type?: ToastType): void
  removeToast(id: string): void
}

export const useUIStore = create<UIStore>((set, get) => ({
  showMaterials: false,
  setShowMaterials(v) { set({ showMaterials: v }) },

  toasts: [],
  addToast(message, type = 'info') {
    const id = nanoid()
    set({ toasts: [...get().toasts, { id, message, type }] })
    setTimeout(() => get().removeToast(id), 3000)
  },
  removeToast(id) {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  },
}))
