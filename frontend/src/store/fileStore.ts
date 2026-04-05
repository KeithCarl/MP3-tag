import { create } from 'zustand';
import type { MP3FileInfo } from '../types/mp3File';

interface FileStore {
  files: MP3FileInfo[];
  selectedIds: Set<string>;
  scannedPaths: string[];
  capped: boolean;
  setFiles: (files: MP3FileInfo[], paths: string[], capped: boolean) => void;
  updateFile: (updated: MP3FileInfo) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  rangeSelect: (fromId: string, toId: string) => void;
  removeFiles: (ids: string[]) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  selectedIds: new Set(),
  scannedPaths: [],
  capped: false,

  setFiles: (files, paths, capped) =>
    set({ files, scannedPaths: paths, capped, selectedIds: new Set() }),

  updateFile: (updated) =>
    set((s) => ({ files: s.files.map((f) => (f.file_id === updated.file_id ? updated : f)) })),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => ({ selectedIds: new Set(s.files.map((f) => f.file_id)) })),

  clearSelection: () => set({ selectedIds: new Set() }),

  rangeSelect: (fromId, toId) =>
    set((s) => {
      const ids = s.files.map((f) => f.file_id);
      const a = ids.indexOf(fromId);
      const b = ids.indexOf(toId);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      const next = new Set(s.selectedIds);
      for (let i = lo; i <= hi; i++) next.add(ids[i]);
      return { selectedIds: next };
    }),

  removeFiles: (ids) =>
    set((s) => ({
      files: s.files.filter((f) => !ids.includes(f.file_id)),
      selectedIds: new Set([...s.selectedIds].filter((id) => !ids.includes(id))),
    })),
}));
